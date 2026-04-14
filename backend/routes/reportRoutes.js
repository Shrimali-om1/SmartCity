const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Notification = require('../models/Notification');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/reports/create
// @desc    Create a new city report (with AI Verification)
router.post('/create', protect, async (req, res) => {
    try {
        const { title, description, category, imageUrl, location } = req.body;

        // 1. Download and convert image to Base64
        const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(imageResp.data).toString('base64');

        // 2. Prepare AI Prompt
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });
        const prompt = `Task: Verify if this image shows a city infrastructure or maintenance issue related to the category: "${category}". 
        Answer with only one word: "Yes" or "No".`;

        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const aiText = result.response.text().trim();
        console.log("AI Verdict:", aiText);

        if (aiText.toLowerCase().includes("no")) {
            return res.status(400).json({ message: "AI Verification Failed: Image does not match category." });
        }

        // 3. Save to Database if AI says Yes
        const newReport = await Report.create({
            citizenId: req.user.id,
            title,
            description,
            category,
            imageUrl,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                locality: location.locality || 'Unknown',
                zone: location.zone || 'Unknown'
            },
            status: 'pending'
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error("DETAILED BACKEND ERROR:", error);
        res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
});

// @route   GET /api/reports/my-reports
// @desc    Get reports submitted by the logged-in citizen
router.get('/my-reports', protect, async (req, res) => {
    try {
        const reports = await Report.find({ citizenId: req.user.id }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
// @route   GET /api/reports/all-pending
// @desc    Get all pending reports for officers
router.get('/all-pending', protect, async (req, res) => {
    try {
        const User = require('../models/User'); // Import User model
        const dbUser = await User.findById(req.user.id);

        let query = { status: 'pending' };

        // Filter by officer's zone and department if they exist
        if (dbUser && dbUser.zone) {
            query['location.zone'] = dbUser.zone;
        }
        if (dbUser && dbUser.department && dbUser.department.length > 0) {
            query.category = { $in: dbUser.department };
        }

        const reports = await Report.find(query).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/my-assigned
// @desc    Get reports assigned to the logged-in officer
router.get('/my-assigned', protect, async (req, res) => {
    try {
        const reports = await Report.find({ assignedTo: req.user.id, status: { $in: ['assigned', 'assigned_to_contractor'] } }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/my-resolved
// @desc    Get reports resolved by the logged-in officer
router.get('/my-resolved', protect, async (req, res) => {
    try {
        const reports = await Report.find({ assignedTo: req.user.id, status: 'resolved' }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/contractor
// @desc    Get reports assigned to the logged-in contractor
router.get('/contractor', protect, async (req, res) => {
    try {
        const reports = await Report.find({ contractorId: req.user.id, status: 'assigned_to_contractor' }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/reports/claim/:id
// @desc    Claim a pending report (Officer only)
router.put('/claim/:id', protect, async (req, res) => {
    try {
        console.log(`[Claim Task] Officer ${req.user.id} attempting to claim task ${req.params.id}`);
        const existing = await Report.findById(req.params.id);
        console.log(`[Claim Task] Existing Report Status:`, existing ? existing.status : 'NOT FOUND');

        // Find the report and ensure it's still pending
        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { status: 'assigned', assignedTo: req.user.id },
            { new: true }
        );

        if (!report) {
            console.log(`[Claim Task] Failed to update. Either not pending or not found.`);
            return res.status(404).json({ message: 'Report not found or already claimed' });
        }

        // Notify the citizen
        await Notification.create({
            userId: report.citizenId,
            message: `Your complaint has been claimed by the ${req.user.zone || 'assigned'} Officer!`,
            type: 'system_alert'
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/reports/assign-contractor/:id
// @desc    Assign an already claimed report to a contractor (Officer only)
router.put('/assign-contractor/:id', protect, async (req, res) => {
    try {
        const { contractorId } = req.body;

        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, assignedTo: req.user.id, status: 'assigned' },
            { status: 'assigned_to_contractor', contractorId },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found or not currently assigned to you' });
        }

        // Notify the citizen
        await Notification.create({
            userId: report.citizenId,
            message: `A Contractor has been assigned and is on the way!`,
            type: 'system_alert'
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/officer-stats
// @desc    Get performance stats for the currently logged-in officer
router.get('/officer-stats', protect, async (req, res) => {
    try {
        const officerId = req.user.id;

        const totalResolved = await Report.countDocuments({ assignedTo: officerId, status: 'resolved' });
        const currentlyAssigned = await Report.countDocuments({
            assignedTo: officerId,
            status: { $in: ['assigned', 'assigned_to_contractor'] }
        });

        // Simple placeholder for efficiency rating
        // E.g., if total tasks (resolved + assigned) > 0, efficiency relates to resolved ratio
        const totalTasks = totalResolved + currentlyAssigned;
        let efficiencyRating = 100;
        if (totalTasks > 0) {
            efficiencyRating = Math.round((totalResolved / totalTasks) * 100);
        }

        res.json({
            totalResolved,
            currentlyAssigned,
            efficiencyRating,
            department: 'City Services' // Hardcoded placeholder for now
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/contractors/:category
// @desc    Get contractors matching a specific category/department
router.get('/contractors/:category', protect, async (req, res) => {
    try {
        const User = require('../models/User'); // Import dynamically since it's not at the top
        const category = req.params.category;

        // Find users who are contractors and whose department array includes the category
        // Use regex for case insensitive match on the array elements
        const contractors = await User.find({
            role: 'contractor',
            department: { $elemMatch: { $regex: new RegExp(`^${category}$`, 'i') } }
        }).select('-password');

        // Do NOT fallback to all contractors to enforce workflow isolation
        res.json(contractors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/reports/resolve/:id
// @desc    Mark a report as resolved and award points to citizen (Officer only)
router.put('/resolve/:id', protect, async (req, res) => {
    try {
        // Enforce STRICT workflow: Task must be assigned to a contractor first
        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, assignedTo: req.user.id, status: 'assigned_to_contractor' },
            { status: 'resolved' },
            { new: true }
        );

        if (!report) {
            return res.status(400).json({ message: 'Task cannot be resolved. It must be assigned to a contractor first, or it belongs to another officer.' });
        }

        // Award 50 points to the citizen who created the report
        const User = require('../models/User'); // Import dynamically or at top
        await User.findByIdAndUpdate(
            report.citizenId,
            { $inc: { points: 50 } }
        );

        // Create a notification for the citizen
        await Notification.create({
            userId: report.citizenId,
            message: `Your report "${report.title}" was resolved! You've earned 50 points.`,
            type: 'report_update'
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   POST /api/reports/complete/:id
// @desc    Submit Resource Form and complete task (Contractor only)
router.post('/complete/:id', protect, async (req, res) => {
    try {
        const { materialsUsed, laborHours, afterImage } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.contractorId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized. You are not the assigned contractor.' });
        }

        // --- AI Image Validation (Fraud Prevention) ---
        if (afterImage) {
            try {
                // Download and convert image to Base64
                const imageResp = await axios.get(afterImage, { responseType: 'arraybuffer' });
                const base64Data = Buffer.from(imageResp.data).toString('base64');

                // Prepare AI Prompt
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `Task: Verify if this image shows a completed repair or construction work for the category: "${report.category}". 
                Check for poor quality: if the image is mostly black, completely blurred, a random selfie, or lacks any clear infrastructure details, answer "No".
                Otherwise, if it looks like a valid repair photo (even if you can't be 100% sure the repair is perfect), answer "Yes".
                Answer with only one word: "Yes" or "No".`;

                const result = await model.generateContent([
                    { text: prompt },
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);

                const aiText = result.response.text().trim();
                console.log("AI Contractor Verification Verdict:", aiText);

                if (aiText.toLowerCase().includes("no")) {
                    return res.status(400).json({
                        message: "AI Verification Failed: Low-quality image detected. Please take a clearer photo of the repair showing the completed infrastructure work."
                    });
                }
            } catch (error) {
                res.status(500).json({ message: 'Server Error', error: error.message });
            }
        }
        const slaHours = 72; // You can adjust this based on report.category later
        const createdDate = new Date(report.createdAt);
        const now = new Date();
        const diffInHours = (now - createdDate) / (1000 * 60 * 60);
        const isLate = diffInHours > slaHours;

        report.materialsUsed = materialsUsed;
        report.laborHours = laborHours;
        report.afterImage = afterImage;
        report.completionTime = now;
        report.isLate = isLate;
        report.status = 'completed_pending_review';

        await report.save();

        // Notify the Officer
        if (report.assignedTo) {
            await Notification.create({
                userId: report.assignedTo,
                message: `Task in ${report.location?.locality || 'your area'} has been resolved by the Contractor and is ready for review.`,
                type: 'system_alert'
            });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/pending-review
// @desc    Get reports pending review for officers
router.get('/pending-review', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const dbUser = await User.findById(req.user.id);

        let query = { status: 'completed_pending_review' };

        // Filter by officer's zone/department like we do for all-pending
        if (dbUser && dbUser.zone) {
            query['location.zone'] = dbUser.zone;
        }
        if (dbUser && dbUser.department && dbUser.department.length > 0) {
            query.category = { $in: dbUser.department };
        }

        const reports = await Report.find(query).sort({ completionTime: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/reports/close/:id
// @desc    Officer verifies and closes a completed report
router.put('/close/:id', protect, async (req, res) => {
    try {
        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, status: 'completed_pending_review' },
            { status: 'closed' },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found or not in pending review status' });
        }

        // Assign points to Citizen
        const User = require('../models/User');
        await User.findByIdAndUpdate(
            report.citizenId,
            { $inc: { points: 50 } }
        );

        // Notify Citizen
        await Notification.create({
            userId: report.citizenId,
            message: `Your report "${report.title}" was verified and closed! You've earned 50 points. Please rate the work.`,
            type: 'report_update'
        });

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/reports/rate/:id
// @desc    Citizen rates closed report (1-star reopens)
router.put('/rate/:id', protect, async (req, res) => {
    try {
        const { rating } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report || report.citizenId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Report not found or not authorized' });
        }

        if (report.status !== 'closed') {
            return res.status(400).json({ message: 'Can only rate closed reports' });
        }

        report.rating = rating;

        // If 1 star, reopen the issue
        if (rating === 1) {
            report.status = 'pending'; // Re-queue it
            report.reopened = true;
            report.assignedTo = null; // Unassign it so it goes back to available queue
            report.contractorId = null;

            // Optional: Notify all officers/admins
        }

        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/my-history
// @desc    Get past completed reports/tasks for the logged-in user
router.get('/my-history', protect, async (req, res) => {
    try {
        const User = require('../models/User');
        const dbUser = await User.findById(req.user.id);

        let query = { status: 'closed' };

        if (dbUser.role === 'citizen') {
            query.citizenId = req.user.id;
        } else if (dbUser.role === 'contractor') {
            query.contractorId = req.user.id;
        } else if (dbUser.role === 'officer') {
            query.assignedTo = req.user.id;
        }

        const reports = await Report.find(query).sort({ completionTime: -1, createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   PUT /api/reports/reject/:id
// @desc    Officer rejects a completed report, sends it back to contractor
router.put('/reject/:id', protect, async (req, res) => {
    try {
        const { reason } = req.body;

        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, status: 'completed_pending_review' },
            { status: 'assigned_to_contractor', rejectionNote: reason || 'Work quality not satisfactory. Please redo.' },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found or not in pending review status' });
        }

        // Notify the contractor
        if (report.contractorId) {
            await Notification.create({
                userId: report.contractorId,
                message: `Your submission for "${report.title}" was rejected. Reason: ${reason || 'Work quality not satisfactory.'}`,
                type: 'system_alert'
            });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/review-stats
// @desc    Get officer's review queue statistics
router.get('/review-stats', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [reviewedToday, critical, totalApproved, totalReviewed] = await Promise.all([
            Report.countDocuments({ assignedTo: req.user.id, status: 'closed', completionTime: { $gte: today } }),
            Report.countDocuments({ status: 'completed_pending_review', isLate: true }),
            Report.countDocuments({ assignedTo: req.user.id, status: 'closed' }),
            Report.countDocuments({ assignedTo: req.user.id, status: { $in: ['closed', 'rejected'] } }),
        ]);

        const approvalRate = totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : 92;

        res.json({ reviewedToday, critical, approvalRate });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/all
// @desc    Get literally all reports in the system across all zones and statuses (Commissioner)
router.get('/all', protect, async (req, res) => {
    try {
        const reports = await Report.find()
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/all-history
// @desc    Get all resolved and closed reports across all zones (Commissioner / Public)
router.get('/all-history', protect, async (req, res) => {
    try {
        // We allow Commissioners to see everything
        const reports = await Report.find({ status: { $in: ['resolved', 'closed', 'completed_pending_review'] } })
            .sort({ completionTime: -1, createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/reports/public/all-history
// @desc    Get all resolved and closed reports for public view (Unauthenticated)
router.get('/public/all-history', async (req, res) => {
    try {
        const reports = await Report.find({ status: { $in: ['resolved', 'closed'] } })
            .sort({ completionTime: -1, createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
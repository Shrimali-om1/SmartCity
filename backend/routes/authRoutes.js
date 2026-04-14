const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper to send email
const sendEmail = async (options) => {
    let transporter;
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
            service: 'gmail', // or based on env
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    } else {
        // Fallback to ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'SmartCity'} <${process.env.FROM_EMAIL || 'noreply@smartcity.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    if (!process.env.SMTP_EMAIL) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
};


// POST /register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, appType } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user
        user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            appType
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error in /register:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT Token
        const payload = {
            id: user.id,
            name: user.name,
            role: user.role,
            appType: user.appType
        };

        const jwtSecret = process.env.JWT_SECRET || 'temporary_secret_key';

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({ token });
            }
        );
    } catch (error) {
        console.error('Error in /login:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'There is no user with that email' });
        }

        // Generate a 6-digit OTP
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const message = `You requested a password reset. Please use the following 6-digit code to reset your password:\n\n${resetToken}\n\nThis code is valid for 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Code',
                message,
            });

            res.status(200).json({ success: true, message: 'Email sent' });
        } catch (err) {
            console.error('Email could not be sent', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error('Error in /forgot-password:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        
        const user = await User.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in /reset-password:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('name email role points isProfileComplete phone profilePhoto department');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points,
            isProfileComplete: user.isProfileComplete,
            phone: user.phone,
            profilePhoto: user.profilePhoto,
            department: user.department
        });
    } catch (error) {
        console.error('Error in /profile:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /complete-profile
router.put('/complete-profile', protect, async (req, res) => {
    try {
        const { phone, profilePhoto, name } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (phone !== undefined) user.phone = phone;
        if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
        if (name) user.name = name;
        
        user.isProfileComplete = true; // Mark as complete
        await user.save();

        res.json({ message: 'Profile completed successfully', user });
    } catch (error) {
        console.error('Error completing profile:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /update-password
router.put('/update-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error in /update-password:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

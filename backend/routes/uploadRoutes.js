const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { Readable } = require('stream');

// Use memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        // Upload to Cloudinary using a stream
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'smartcity_uploads' },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ message: 'Error uploading image' });
                }
                res.status(200).json({ secure_url: result.secure_url });
            }
        );

        // Convert the buffer to a readable stream and pipe it to Cloudinary
        Readable.from(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error('Error in /api/upload:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

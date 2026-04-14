const express = require('express');
const router = express.Router();
const RoadBlock = require('../models/RoadBlock');

// 1. Create a new Road Block (Contractor only)
router.post('/block', async (req, res) => {
    try {
        const { coordinates, title, description, expectedEndDate, userId } = req.body;
        const newBlock = new RoadBlock({
            contractor: userId,
            location: { type: 'LineString', coordinates },
            title,
            description,
            expectedEndDate
        });
        await newBlock.save();
        res.status(201).json(newBlock);
    } catch (err) {
        res.status(500).json({ message: "Error creating block", error: err.message });
    }
});

// 2. Get all active blocks (For the Citizen Map)
router.get('/blocks', async (req, res) => {
    try {
        const blocks = await RoadBlock.find();
        res.json(blocks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
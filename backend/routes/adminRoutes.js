const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Report = require('../models/Report');

// POST /api/admin/init-amc-system
// One-time administrative route to reset database and seed AMC System
router.post('/init-amc-system', async (req, res) => {
    try {
        console.log('Starting AMC Zonal Model Initialization...');

        // 1. Wipe Data
        console.log('Wiping existing Users and Reports...');
        const userDeleteResult = await User.deleteMany({});
        const reportDeleteResult = await Report.deleteMany({});
        console.log(`Deleted ${userDeleteResult.deletedCount} users and ${reportDeleteResult.deletedCount} reports.`);

        // 2. Hash Password '123456'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // 3. Seed 7 Zonal Officers
        const allDepts = ['Road', 'Waste', 'Water', 'Electricity', 'Other'];
        const officersData = [
            { name: 'Central Officer', email: 'central.officer@amc.gov.in', zone: 'Central', department: allDepts },
            { name: 'West Officer', email: 'west.officer@amc.gov.in', zone: 'West', department: allDepts },
            { name: 'North West Officer', email: 'nw.officer@amc.gov.in', zone: 'North West', department: allDepts }, // Wards: Bodakdev, Thaltej, Gota
            { name: 'South West Officer', email: 'sw.officer@amc.gov.in', zone: 'South West', department: allDepts }, // Wards: Satellite, Prahladnagar
            { name: 'North Officer', email: 'north.officer@amc.gov.in', zone: 'North', department: allDepts },
            { name: 'South Officer', email: 'south.officer@amc.gov.in', zone: 'South', department: allDepts },
            { name: 'East Officer', email: 'east.officer@amc.gov.in', zone: 'East', department: allDepts },
        ];

        const officers = officersData.map(officer => ({
            ...officer,
            password: hashedPassword,
            role: 'officer',
            appType: 'governance',
            isProfileComplete: true,
        }));

        const insertedOfficers = await User.insertMany(officers);
        console.log(`Inserted ${insertedOfficers.length} Zonal Officers.`);

        // 4. Seed 4 Specialized Contractors
        const contractorsData = [
            { name: 'Roads Contractor', email: 'roads.contractor@amc.gov.in', department: ['Road'] },
            { name: 'Waste Contractor', email: 'waste.contractor@amc.gov.in', department: ['Waste'] },
            { name: 'Water Contractor', email: 'water.contractor@amc.gov.in', department: ['Water'] },
            { name: 'Electricity Contractor', email: 'electricity.contractor@amc.gov.in', department: ['Electricity'] }
        ];

        const contractors = contractorsData.map(contractor => ({
            ...contractor,
            password: hashedPassword,
            role: 'contractor',
            appType: 'governance',
            isProfileComplete: true,
        }));

        const insertedContractors = await User.insertMany(contractors);
        console.log(`Inserted ${insertedContractors.length} Specialized Contractors.`);

        res.status(200).json({
            message: 'AMC Zonal Model Initialized successfully.',
            details: {
                usersDeleted: userDeleteResult.deletedCount,
                reportsDeleted: reportDeleteResult.deletedCount,
                officersCreated: insertedOfficers.length,
                contractorsCreated: insertedContractors.length,
            }
        });

    } catch (error) {
        console.error('Error during AMC System Initialization:', error);
        res.status(500).json({ message: 'Server error during initialization.', error: error.message });
    }
});

module.exports = router;

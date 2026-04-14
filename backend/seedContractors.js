const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if needed
require('dotenv').config();

const contractorsData = [
    {
        "name": "Sparky Volt",
        "email": "electric@city.com",
        "password": "123456",
        "role": "contractor",
        "department": "Electricity",
        "specialization": "Electricity"
    },
    {
        "name": "Road Runner Ltd",
        "email": "roads@city.com",
        "password": "123456",
        "role": "contractor",
        "department": "Roads",
        "specialization": "Roads"
    },
    {
        "name": "Clean Slate Crew",
        "email": "waste@city.com",
        "password": "123456",
        "role": "contractor",
        "department": "Waste",
        "specialization": "Waste"
    },
    {
        "name": "Aqua Flow Solutions",
        "email": "water@city.com",
        "password": "123456",
        "role": "contractor",
        "department": "Water",
        "specialization": "Water"
    }
];

const seedContractors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (let data of contractorsData) {
            const existingUser = await User.findOne({ email: data.email });
            if (existingUser) {
                console.log(`User ${data.email} already exists. Skipping.`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);

            await User.create({
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                appType: 'governance',
                department: data.department,
                specialization: data.specialization
            });

            console.log(`Successfully added contractor: ${data.name}`);
        }

        console.log('Finished seeding contractors');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding contractors:', error);
        process.exit(1);
    }
};

seedContractors();

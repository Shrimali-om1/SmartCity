require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartcity';

const seedCommissioner = async () => {
    try {
        await mongoose.connect(DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        const existingCommissioner = await User.findOne({ email: 'commissioner@smartcity.gov' });

        if (existingCommissioner) {
            console.log('Commissioner account already exists:', existingCommissioner.email);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Comm123', salt);

        const commissioner = new User({
            name: 'AMC Chief Commissioner',
            email: 'commissioner@smartcity.gov',
            password: hashedPassword,
            role: 'commissioner',
            appType: 'governance',
            isProfileComplete: true
        });

        await commissioner.save();
        console.log('Successfully added Commissioner account to the database!');
        console.log('--- Credentials ---');
        console.log('Email: commissioner@smartcity.gov');
        console.log('Password: Comm123');

    } catch (error) {
        console.error('Error seeding Commissioner:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedCommissioner();

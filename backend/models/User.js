const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['citizen', 'officer', 'admin', 'commuter', 'contractor', 'commissioner'],
        required: true,
    },
    appType: {
        type: String,
        enum: ['governance', 'traffic'],
        required: true,
    },
    zone: {
        type: String,
    },
    department: [{
        type: String,
    }],
    points: {
        type: Number,
        default: 0,
    },
    phone: {
        type: String,
    },
    profilePhoto: {
        type: String,
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

module.exports = mongoose.model('User', userSchema);

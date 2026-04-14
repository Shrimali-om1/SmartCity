const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Road', 'Waste', 'Water', 'Electricity', 'Other'], required: true },
    location: {
        latitude: Number,
        longitude: Number,
        locality: String,
        zone: { type: String, enum: ['Central', 'West', 'North West', 'South West', 'North', 'South', 'East'] },
    },
    imageUrl: { type: String },
    afterImage: { type: String }, // Phase 3: Contractor uploaded photo
    status: { type: String, enum: ['pending', 'assigned', 'assigned_to_contractor', 'completed_pending_review', 'resolved', 'closed', 'rejected'], default: 'pending' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    contractorId: { type: String },

    // Resource Form Data
    materialsUsed: { type: String },
    laborHours: { type: Number },
    completionTime: { type: Date },
    isLate: { type: Boolean },

    // Rating Data
    rating: { type: Number },
    reopened: { type: Boolean, default: false },
    rejectionNote: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
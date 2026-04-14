const mongoose = require('mongoose');

const RoadBlockSchema = new mongoose.Schema({
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
        type: { type: String, default: 'LineString' }, // We use LineString for a road segment
        coordinates: [[Number]], // Array of [lng, lat] pairs (start and end of block)
    },
    title: { type: String, required: true }, // e.g., "Metro Pillar Construction"
    description: { type: String },
    severity: { type: String, enum: ['Partial', 'Full'], default: 'Full' },
    expectedEndDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Important for map-based queries
RoadBlockSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.RoadBlock || mongoose.model('RoadBlock', RoadBlockSchema);
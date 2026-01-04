const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    s3Key: { type: String, required: true }, // Path in storage 
    fileSize: Number,
    duration: Number,
    // Status tracking for real-time updates [cite: 40]
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    // Sensitivity classification [cite: 39]
    isPublished: { type: Boolean, default: false }, // Editor controls this
    isFlagged: { type: Boolean, default: true },    // Mock AI default: Flagged on upload
    moderationLabels: [String], // AI detected labels for flagging reason
    mimeType: String,           // Store MIME type for reliable streaming
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Video', VideoSchema);
const mongoose = require('mongoose');

// Define a subdocument schema for PlacementCard in User
const placementCardInUserSchema = new mongoose.Schema({
    placementCard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlacementCard'
    },
    selected: {
        type: Boolean,
        default: false
    },
    resultsPosted: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["Admin", "Student"]
    },
    branch: {
        type: String,
        enum: ["cse", "it", "ece"]
    },
    cgpa :{
        type: String,
        required:true
    },
    resetPasswordOtp: String,
    resetPasswordOtpExpiration: Date,
    placementCards: [placementCardInUserSchema] // Use the subdocument schema for PlacementCard in User
});

module.exports = mongoose.model("User", userSchema);

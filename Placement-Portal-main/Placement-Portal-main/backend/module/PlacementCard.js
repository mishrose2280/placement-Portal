const mongoose = require('mongoose');

// Define a subdocument schema for User in PlacementCard
const userInPlacementCardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    selected: {
        type: Boolean,
        default: false
    }
});

const placementcardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    Company: {
        type: String,
        required: true,
        trim: true
    },
    Salary: {
        type: String,
        required: true,
    },
    branch: [{
        type: String,
    }],
    expiretime: {
        type: Date,
    },
    resultsPosted: {
        type: Boolean,
        default: false
    },
    cgpa :{
        type :String,
        default:"0"
    },
    User: [userInPlacementCardSchema] // Use the subdocument schema for User in PlacementCard
});

module.exports = mongoose.model("PlacementCard", placementcardSchema);

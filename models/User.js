const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["admin", "coordinator"],
        default: "coordinator"
    },

    mfaSecret: {
    type: String
},

mfaEnabled: {
    type: Boolean,
    default: false
}

});

module.exports = mongoose.model("User", userSchema);
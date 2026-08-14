const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        vehicleType: {
            type: String,
            enum: ["Bike", "Car", "Scooty", "EV"],
            required: true
        },

        brand: {
            type: String,
            required: true
        },

        model: {
            type: String,
            required: true
        },

        vehicleNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true
        },

        chargesPerHour: {
            type: Number,
            required: true,
            min: 1
        },

        imageUrl: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["Available", "Rented"],
            default: "Available"
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("Vehicle", vehicleSchema);
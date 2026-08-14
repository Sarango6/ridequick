const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true
        },

        renter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        totalHours: {
            type: Number,
            required: true
        },

        totalAmount: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Rejected",
                "Completed"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("Booking", bookingSchema);
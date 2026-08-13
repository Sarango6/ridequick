const express = require("express");
const path = require("path");

require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Vehicle Rental API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get("id");
    const bookingImage = document.getElementById("bookingVehicleImage");

    if (bookingImage) {
        bookingImage.addEventListener("error", () => {
            showImageError(bookingImage);
        }, { once: true });
    }

    if (!getToken()) {
        clearSessionAndRedirect();
        return;
    }

    const user = getUser();

    if (!user) {
        clearSessionAndRedirect();
        return;
    }

    if (!vehicleId) {
        document.getElementById("bookingNotice").classList.remove("hidden");
        return;
    }

    try {
        const response = await apiFetch(`/api/vehicles/${vehicleId}`);
        const data = await response.json();

        if (!response.ok) {
            document.getElementById("bookingNotFound").classList.remove("hidden");
            return;
        }

        renderVehicleDetails(data);
        setupDateInputs();
        document.getElementById("bookingContent").classList.remove("hidden");

        document.getElementById("confirmBookingBtn").addEventListener("click", submitBooking);
        document.getElementById("startDate").addEventListener("input", updateEstimate);
        document.getElementById("endDate").addEventListener("input", updateEstimate);
    } catch (error) {
        document.getElementById("bookingNotFound").classList.remove("hidden");
    }

    function clearSessionAndRedirect() {
        clearSession();
        window.location.href = "/login.html";
    }

    function renderVehicleDetails(vehicle) {
        document.getElementById("bookingVehicleImage").src = vehicle.imageUrl;
        document.getElementById("bookingVehicleImage").dataset.vehicleImage = "true";
        document.getElementById("bookingVehicleType").textContent = vehicle.vehicleType;
        document.getElementById("bookingVehicleTitle").textContent = `${vehicle.brand} ${vehicle.model}`;
        document.getElementById("bookingVehicleDescription").textContent = vehicle.description || "Well maintained vehicle";
        document.getElementById("bookingVehicleNumber").textContent = vehicle.vehicleNumber;
        document.getElementById("bookingOwnerName").textContent = vehicle.owner?.name || "-";
        document.getElementById("bookingOwnerPhone").textContent = vehicle.owner?.phone || "-";
        document.getElementById("bookingVehicleRate").textContent = `${formatMoney(vehicle.chargesPerHour)}/hour`;
        document.getElementById("bookingVehicleRate").dataset.price = String(vehicle.chargesPerHour);
        document.getElementById("bookingContent").dataset.vehicleId = vehicle._id;
        document.getElementById("bookingMessage").textContent = "";
        document.getElementById("bookingDuration").textContent = "Rental Duration: -";
        document.getElementById("bookingEstimate").textContent = "Estimated Cost: -";
    }

    function setupDateInputs() {
        const now = new Date();
        const minValue = now.toISOString().slice(0, 16);
        document.getElementById("startDate").min = minValue;
        document.getElementById("endDate").min = minValue;
    }

    function updateEstimate() {
        const startValue = document.getElementById("startDate").value;
        const endValue = document.getElementById("endDate").value;
        const messageNode = document.getElementById("bookingMessage");
        const durationNode = document.getElementById("bookingDuration");
        const estimateNode = document.getElementById("bookingEstimate");
        const rateNode = document.getElementById("bookingVehicleRate");
        const hourlyRate = Number(rateNode.dataset.price || 0);

        if (!startValue || !endValue) {
            durationNode.textContent = "Rental Duration: -";
            estimateNode.textContent = "Estimated Cost: -";
            messageNode.textContent = "";
            return;
        }

        const start = new Date(startValue);
        const end = new Date(endValue);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            durationNode.textContent = "Rental Duration: -";
            estimateNode.textContent = "Estimated Cost: -";
            messageNode.textContent = "Please choose valid dates.";
            return;
        }

        if (end <= start) {
            durationNode.textContent = "Rental Duration: -";
            estimateNode.textContent = "Estimated Cost: -";
            messageNode.textContent = "End time must be after start time.";
            return;
        }

        const totalHours = Math.ceil((end - start) / 3600000);
        const totalAmount = totalHours * hourlyRate;

        durationNode.textContent = `Rental Duration: ${totalHours} hour${totalHours > 1 ? "s" : ""}`;
        estimateNode.textContent = `Estimated Cost: ${formatMoney(totalAmount)}`;
        messageNode.textContent = "";
    }

    async function submitBooking() {
        const vehicleId = document.getElementById("bookingContent").dataset.vehicleId;
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const messageNode = document.getElementById("bookingMessage");

        if (!vehicleId) {
            messageNode.textContent = "Vehicle ID missing.";
            return;
        }

        if (!startDate || !endDate) {
            messageNode.textContent = "Please select start and end time.";
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            messageNode.textContent = "Please choose valid dates.";
            return;
        }

        if (end <= start) {
            messageNode.textContent = "End time must be after start time.";
            return;
        }

        try {
            const response = await apiFetch("/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    vehicleId,
                    startDate,
                    endDate
                })
            });

            const data = await response.json();

            if (!response.ok) {
                messageNode.textContent = data.message || "Booking failed.";
                return;
            }

            messageNode.style.color = "var(--green)";
            messageNode.textContent = "Booking request sent successfully!";

            setTimeout(() => {
                window.location.href = "/dashboard.html";
            }, 1000);
        } catch (error) {
            messageNode.textContent = "Server error.";
        }
    }
});
document.addEventListener("DOMContentLoaded", () => {
    if (!requireLogin()) {
        return;
    }

    const user = getUser();
    const userNameNode = document.getElementById("welcomeName");

    if (userNameNode && user) {
        userNameNode.textContent = user.name;
    }

    loadOwnerVehicles();
    loadOwnerBookings();
    loadMyBookings();

    const vehicleForm = document.getElementById("vehicleForm");

    if (vehicleForm) {
        vehicleForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const messageNode = document.getElementById("vehicleMessage");
            const submitButton = vehicleForm.querySelector("button[type='submit']");

            const payload = {
                vehicleType: document.getElementById("vehicleType").value,
                brand: document.getElementById("brand").value.trim(),
                model: document.getElementById("model").value.trim(),
                vehicleNumber: document.getElementById("vehicleNumber").value.trim(),
                chargesPerHour: Number(document.getElementById("chargesPerHour").value),
                imageUrl: document.getElementById("imageUrl").value.trim(),
                description: document.getElementById("description").value.trim()
            };

            if (!payload.vehicleType || !payload.brand || !payload.model || !payload.vehicleNumber || !payload.chargesPerHour || !payload.imageUrl) {
                messageNode.textContent = "Please fill in all required fields.";
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = "Saving...";

            try {
                const response = await apiFetch("/api/vehicles", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    messageNode.textContent = data.message || "Unable to add vehicle.";
                    return;
                }

                messageNode.style.color = "var(--green)";
                messageNode.textContent = "Vehicle added successfully.";
                vehicleForm.reset();
                loadOwnerVehicles();
                loadOwnerBookings();
                loadMyBookings();
            } catch (error) {
                messageNode.textContent = "Server error.";
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = "Add Vehicle";
            }
        });
    }
});

async function loadOwnerVehicles() {
    const container = document.getElementById("ownerVehicles");

    if (!container) {
        return;
    }

    container.innerHTML = '<div class="loading">Loading your vehicles...</div>';

    try {
        const response = await apiFetch("/api/vehicles/my");
        const vehicles = await response.json();

        if (!response.ok) {
            throw new Error(vehicles.message || "Unable to load vehicles");
        }

        if (!vehicles.length) {
            container.innerHTML = `
                <div class="empty">
                    <h3>No vehicles yet</h3>
                    <p>Add your first vehicle above.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = vehicles.map((vehicle) => `
            <article class="vehicle-card">
                <img src="${vehicle.imageUrl}" alt="${vehicle.brand} ${vehicle.model}" data-vehicle-image>
                <div class="vehicle-info">
                    <div class="vehicle-top">
                        <span class="vehicle-type">${vehicle.vehicleType}</span>
                        <span class="available">${vehicle.status}</span>
                    </div>
                    <h3>${vehicle.brand} ${vehicle.model}</h3>
                    <p>${vehicle.vehicleNumber}</p>
                    <div class="vehicle-meta">
                        <span>${formatMoney(vehicle.chargesPerHour)}/hour</span>
                        <span>${vehicle.status}</span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-danger" onclick="deleteVehicle('${vehicle._id}')">Delete</button>
                    </div>
                </div>
            </article>
        `).join("");

        container.querySelectorAll("img[data-vehicle-image]").forEach((imageElement) => {
            imageElement.addEventListener("error", () => showImageError(imageElement), { once: true });
        });
    } catch (error) {
        container.innerHTML = `
            <div class="empty">
                <h3>Unable to load vehicles</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function deleteVehicle(id) {
    if (!confirm("Delete this vehicle?")) {
        return;
    }

    try {
        const response = await apiFetch(`/api/vehicles/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to delete vehicle.");
            return;
        }

        loadOwnerVehicles();
        loadOwnerBookings();
        loadMyBookings();
    } catch (error) {
        alert("Server error.");
    }
}

async function loadOwnerBookings() {
    const container = document.getElementById("ownerBookings");

    if (!container) {
        return;
    }

    container.innerHTML = '<div class="loading">Loading booking requests...</div>';

    try {
        const response = await apiFetch("/api/bookings/owner");
        const bookings = await response.json();

        if (!response.ok) {
            throw new Error(bookings.message || "Unable to load bookings");
        }

        if (!bookings.length) {
            container.innerHTML = `
                <div class="empty">
                    <h3>No booking requests yet</h3>
                    <p>New requests will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map((booking) => {
            const renter = booking.renter || {};
            const statusClass = String(booking.status || "").toLowerCase();

            return `
                <article class="booking-card">
                    <div>
                        <h3>${booking.vehicle?.brand || "Vehicle"} ${booking.vehicle?.model || ""}</h3>
                        <p>Renter: ${renter.name || "-"}</p>
                        <p>Phone: ${renter.phone || "-"}</p>
                        <p>Email: ${renter.email || "-"}</p>
                        <p>${formatDateTime(booking.startDate)} to ${formatDateTime(booking.endDate)}</p>
                        <p>${booking.totalHours} hour(s)</p>
                        <p><strong>${formatMoney(booking.totalAmount)}</strong></p>
                    </div>
                    <div>
                        <span class="status ${statusClass}">${booking.status}</span>
                        ${booking.status === "Pending" ? `
                            <div class="action-buttons">
                                <button class="btn btn-success" onclick="updateBookingStatus('${booking._id}', 'Accepted')">Accept</button>
                                <button class="btn btn-danger" onclick="updateBookingStatus('${booking._id}', 'Rejected')">Reject</button>
                            </div>
                        ` : ""}
                        ${booking.status === "Accepted" ? `
                            <div class="action-buttons">
                                <button class="btn btn-dark" onclick="updateBookingStatus('${booking._id}', 'Completed')">Mark Completed</button>
                            </div>
                        ` : ""}
                    </div>
                </article>
            `;
        }).join("");
    } catch (error) {
        container.innerHTML = `
            <div class="empty">
                <h3>Unable to load booking requests</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function updateBookingStatus(id, status) {
    try {
        const response = await apiFetch(`/api/bookings/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to update booking.");
            return;
        }

        loadOwnerBookings();
        loadOwnerVehicles();
        loadMyBookings();
    } catch (error) {
        alert("Server error.");
    }
}

async function loadMyBookings() {
    const container = document.getElementById("myBookings");

    if (!container) {
        return;
    }

    container.innerHTML = '<div class="loading">Loading your bookings...</div>';

    try {
        const response = await apiFetch("/api/bookings/my");
        const bookings = await response.json();

        if (!response.ok) {
            throw new Error(bookings.message || "Unable to load bookings");
        }

        if (!bookings.length) {
            container.innerHTML = `
                <div class="empty">
                    <h3>No bookings yet</h3>
                    <p>Browse vehicles and make your first booking.</p>
                    <a href="/index.html" class="btn btn-primary">Browse Vehicles</a>
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map((booking) => {
            const owner = booking.owner || {};
            const vehicle = booking.vehicle || {};
            const statusClass = String(booking.status || "").toLowerCase();

            return `
                <article class="booking-card">
                    <div>
                        <h3>${vehicle.brand || "Vehicle"} ${vehicle.model || ""}</h3>
                        <p>Owner: ${owner.name || "-"}</p>
                        <p>Phone: ${owner.phone || "-"}</p>
                        <p>${formatDateTime(booking.startDate)} to ${formatDateTime(booking.endDate)}</p>
                        <p>${booking.totalHours} hour(s)</p>
                        <p><strong>${formatMoney(booking.totalAmount)}</strong></p>
                    </div>
                    <div>
                        <span class="status ${statusClass}">${booking.status}</span>
                        ${booking.status === "Accepted" ? `
                            <div class="action-buttons">
                                <a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="${getWhatsAppLink(owner.phone, `Hi ${owner.name || "Owner"}, I have a booking for ${vehicle.brand || "your vehicle"} ${vehicle.model || ""}.`)}">Contact Owner</a>
                            </div>
                        ` : ""}
                    </div>
                </article>
            `;
        }).join("");
    } catch (error) {
        container.innerHTML = `
            <div class="empty">
                <h3>Unable to load bookings</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

window.deleteVehicle = deleteVehicle;
window.updateBookingStatus = updateBookingStatus;
window.loadOwnerVehicles = loadOwnerVehicles;
window.loadOwnerBookings = loadOwnerBookings;
window.loadMyBookings = loadMyBookings;
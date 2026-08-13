let allVehicles = [];

function showImageError(imageElement) {
    const container = imageElement.closest(".vehicle-card");

    if (!container || container.querySelector(".image-error")) {
        return;
    }

    imageElement.style.display = "none";

    const error = document.createElement("div");
    error.className = "image-error";
    error.textContent = "Unable to load image from this URL.";

    container.prepend(error);
}

function vehicleCard(vehicle) {
    return `
        <article class="vehicle-card">
            <img
                src="${vehicle.imageUrl}"
                alt="${vehicle.brand} ${vehicle.model}"
                data-vehicle-image
            >
            <div class="vehicle-info">
                <div class="vehicle-top">
                    <span class="vehicle-type">${vehicle.vehicleType}</span>
                    <span class="available">Available</span>
                </div>
                <h3>${vehicle.brand} ${vehicle.model}</h3>
                <p>${vehicle.description || "Well maintained vehicle"}</p>
                <div class="vehicle-meta">
                    <span>${vehicle.vehicleNumber}</span>
                    <strong>${formatMoney(vehicle.chargesPerHour)}/hour</strong>
                </div>
                <div class="owner">
                    <div class="avatar">${vehicle.owner?.name?.charAt(0) || "O"}</div>
                    <span>Owner: ${vehicle.owner?.name || "Owner"}</span>
                </div>
                <div class="vehicle-meta" style="margin-top:0;">
                    <span>Phone: ${vehicle.owner?.phone || "-"}</span>
                </div>
                <button class="btn btn-primary full" onclick="openBooking('${vehicle._id}')">
                    Book Now
                </button>
            </div>
        </article>
    `;
}

function renderVehicles(list) {
    const grid = document.getElementById("vehicleGrid");

    if (!grid) {
        return;
    }

    if (!list.length) {
        grid.innerHTML = `
            <div class="empty">
                <h3>No vehicles available</h3>
                <p>Check back soon for new listings.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = list.map(vehicleCard).join("");

    grid.querySelectorAll("img[data-vehicle-image]").forEach((imageElement) => {
        imageElement.addEventListener("error", () => showImageError(imageElement), { once: true });
    });
}

async function loadVehicles() {
    const grid = document.getElementById("vehicleGrid");

    if (grid) {
        grid.innerHTML = '<div class="loading">Loading vehicles...</div>';
    }

    try {
        const response = await fetch("/api/vehicles");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load vehicles");
        }

        allVehicles = Array.isArray(data) ? data : [];
        renderVehicles(allVehicles);
    } catch (error) {
        if (grid) {
            grid.innerHTML = `
                <div class="empty">
                    <h3>Unable to load vehicles</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

function filterVehicles(type) {
    if (type === "All") {
        renderVehicles(allVehicles);
        return;
    }

    renderVehicles(allVehicles.filter((vehicle) => vehicle.vehicleType === type));
}

function openBooking(vehicleId) {
    if (!getToken()) {
        window.location.href = "/login.html";
        return;
    }

    window.location.href = `/booking.html?id=${encodeURIComponent(vehicleId)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const filterNode = document.getElementById("filterType");

    if (filterNode) {
        filterNode.addEventListener("change", function () {
            filterVehicles(this.value);
        });
    }

    loadVehicles();
});

window.openBooking = openBooking;

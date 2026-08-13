function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    const userText = localStorage.getItem("user");

    if (!userText) {
        return null;
    }

    try {
        return JSON.parse(userText);
    } catch (error) {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

function logout() {
    clearSession();
    window.location.href = "/index.html";
}

function requireLogin() {
    if (!getToken()) {
        clearSession();
        window.location.href = "/login.html";
        return false;
    }

    return true;
}

async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        clearSession();
        window.location.href = "/login.html";
        throw new Error("Authentication required");
    }

    return response;
}

function formatDateTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

function formatMoney(value) {
    const amount = Number(value || 0);
    return `₹${amount.toLocaleString("en-IN")}`;
}

function getWhatsAppLink(phone, message) {
    const digitsOnly = String(phone || "").replace(/\D/g, "");
    return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

function showImageError(imageElement, message = "Unable to load image from this URL.") {
    const container = imageElement.closest(".vehicle-card, .booking-vehicle-card");

    if (!container || container.querySelector(".image-error")) {
        return;
    }

    imageElement.style.display = "none";

    const error = document.createElement("div");
    error.className = "image-error";
    error.textContent = message;

    container.prepend(error);
}

function renderAuthNavigation() {
    const user = getUser();
    const hasSession = Boolean(getToken() && user);

    document.querySelectorAll("[data-auth-state='guest']").forEach((element) => {
        element.classList.toggle("hidden", hasSession);
    });

    document.querySelectorAll("[data-auth-state='authed']").forEach((element) => {
        element.classList.toggle("hidden", !hasSession);
    });

    document.querySelectorAll("[data-user-name]").forEach((element) => {
        element.textContent = user ? user.name : "";
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAuthNavigation);
} else {
    renderAuthNavigation();
}

window.getToken = getToken;
window.getUser = getUser;
window.clearSession = clearSession;
window.logout = logout;
window.requireLogin = requireLogin;
window.apiFetch = apiFetch;
window.formatDateTime = formatDateTime;
window.formatMoney = formatMoney;
window.getWhatsAppLink = getWhatsAppLink;
window.showImageError = showImageError;
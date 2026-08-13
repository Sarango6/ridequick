if (getToken()) {
    window.location.href = "/dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const messageNode = document.getElementById("loginMessage");
        const submitButton = form.querySelector("button[type='submit']");

        if (!email || !password) {
            messageNode.textContent = "Email and password are required.";
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                messageNode.textContent = data.message || "Login failed.";
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "/dashboard.html";
        } catch (error) {
            messageNode.textContent = "Server error.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Login";
        }
    });
});
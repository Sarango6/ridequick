if (getToken()) {
    window.location.href = "/dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const messageNode = document.getElementById("registerMessage");
        const submitButton = form.querySelector("button[type='submit']");

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        messageNode.style.color = "var(--red)";

        if (!name) {
            messageNode.textContent = "Full name is required.";
            return;
        }

        if (!email) {
            messageNode.textContent = "Email is required.";
            return;
        }

        if (!phone) {
            messageNode.textContent = "Phone number is required.";
            return;
        }

        if (!password) {
            messageNode.textContent = "Password is required.";
            return;
        }

        if (!confirmPassword) {
            messageNode.textContent = "Please confirm your password.";
            return;
        }

        if (!email.includes("@") || !email.includes(".")) {
            messageNode.textContent = "Enter a valid email address.";
            return;
        }

        if (password.length < 6) {
            messageNode.textContent = "Password must be at least 6 characters.";
            return;
        }

        if (password !== confirmPassword) {
            messageNode.textContent = "Passwords do not match.";
            return;
        }

        messageNode.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                messageNode.textContent = data.message || "Registration failed.";
                return;
            }

            messageNode.style.color = "var(--green)";
            messageNode.textContent = "Registration successful. Please login.";

            setTimeout(() => {
                window.location.href = "/login.html";
            }, 1200);
        } catch (error) {
            messageNode.textContent = "Server error.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Account";
        }
    });
});
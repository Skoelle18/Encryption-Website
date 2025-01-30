document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const formData = new FormData(loginForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value; // Convert FormData to a plain object
            });

            const response = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Tell the server we are sending JSON
                },
                body: JSON.stringify(data), // Convert object to JSON string
            });
            const result = await response.json();
            if (result.success) {
                localStorage.setItem("token", result.token);
                window.location.href = "index.html"; // Redirect after login
            } else {
                alert("Login failed: " + result.message); // Handle failure
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const formData = new FormData(registerForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value; // Convert FormData to a plain object
            });

            const response = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Tell the server we are sending JSON
                },
                body: JSON.stringify(data), // Convert object to JSON string
            });
            const result = await response.json();
            if (result.success) {
                alert("Registration successful! Please log in.");
                window.location.href = "login.html"; // Redirect to login page
            } else {
                alert("Registration failed: " + result.message);
            }
        });
    }
});

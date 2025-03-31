document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = {
                email: document.getElementById("email").value,
                first_name: document.getElementById("first_name").value,
                surname: document.getElementById("surname").value,
                password: document.getElementById("password").value,
                marketing: document.getElementById("marketing").value
            };

            try {
                const response = await fetch("http://localhost:3000/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    responseMessage.style.color = 'green';
                    responseMessage.textContent = data.message;
                    // window.location.href = "dashboard.html"; // Redirect to login page
                } else {
                    responseMessage.style.color = 'red';
                    responseMessage.textContent = data.message;
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Failed to fetch. Is the backend running?");
            }
        });
    }

    // Handle user login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = {
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            };

            try {
                const response = await fetch("http://localhost:3000/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("token", data.token); // Store JWT in localStorage
                    alert("Login successful!");
                    // window.location.href = "dashboard.html"; // Redirect to dashboard
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Failed to fetch. Is the backend running?");
            }
        });
    }

    // Check login status on page load
    checkLoginStatus();
});

// Check if user is logged in
async function checkLoginStatus() {
    const token = localStorage.getItem("token");
    if (!token) {
        document.getElementById("userStatus").innerText = "Not logged in";
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/check-session", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("userStatus").innerText = `Logged in as ${data.user}`;
        } else {
            document.getElementById("userStatus").innerText = "Not logged in";
            localStorage.removeItem("token"); // Remove invalid token
        }
    } catch (error) {
        console.error("Error checking login status:", error);
    }
}

// Logout user (Clear token)
function logoutUser() {
    fetch('http://localhost:3000/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {

        console.log(data.message);
  
        localStorage.removeItem('authToken');
  
        window.location.href = '/login';
      })
      .catch(error => {
        console.error('Error logging out:', error);
      });
  }

// Attach logout function to button if it exists
document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});
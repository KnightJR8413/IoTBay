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
                marketing: document.getElementById("marketing").checked
            };
            console.log(formData.marketing);
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
                    loginUser(formData.email, formData.password);
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
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
        loginUser (email, password);
        });
    }

    // Check login status on page load
    // checkLoginStatus();
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


function loginUser(email, password){ 
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/welcome';
        } else {
            alert(data.error || 'Login failed');
        }
    })
    .catch(error => console.error('Error:', error));
};

function isLoggedIn() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now; // true if token is not expired
  } catch (e) {
    return false; // Invalid token format
  }
}

// Logout user (Clear token)
function logoutUser() {
    const email = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).email;
    console.log(email);
    fetch('http://localhost:3000/logout', {
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify({email})
    })
      .then(response => response.json())
      .then(data => {

        console.log(data.message);
  
        localStorage.removeItem('token');

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
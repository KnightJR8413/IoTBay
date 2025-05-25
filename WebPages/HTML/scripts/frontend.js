document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = {
                email: document.getElementById("email").value,
                first_name: document.getElementById("first_name").value,
                last_name: document.getElementById("last_name").value,
                password: document.getElementById("password").value,
                marketing: document.getElementById("marketing").checked
            };

            try {
                const response = await fetch(`${API_BASE}/register`, {
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
});

// Check if user is logged in
async function checkLoginStatus() {
    const token = localStorage.getItem("token");
    if (!token) {
        document.getElementById("userStatus").innerText = "Not logged in";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/check-session`, {
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
    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            const token = data.token;
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Decoded token payload: ", payload);
            const customer_id = payload.userId;
            localStorage.setItem('customer_id', customer_id);
            window.location.href = '/welcome';
        } else {
            alert(data.error || 'Login failed');
        }
    })
    .catch(error => console.error('Error:', error));
};

// Logout user (Clear token)
function logoutUser() {
    const email = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).email;
    console.log(email);
    fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify({email})
    })
      .then(response => response.json())
      .then(data => {

        console.log(data.message);
      })
      .catch(error => {
        console.error('Error logging out:', error);
      });
      localStorage.removeItem('token');
      localStorage.removeItem('customer_id');
      window.location.href = '/logout'
  }

// Attach logout function to button if it exists
document.addEventListener("DOMContentLoaded", function () {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logoutUser());
    }
});

async function addToCart(product_no) {
  // Check if we already have a stored customer ID
  let customer_id = localStorage.getItem('customer_id');

  const payload = { product_no };
  if (customer_id) {
    payload.customer_id = parseInt(customer_id);
  }

  try {
    const response = await fetch('/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      // If a customer_id was returned (new guest), store it
      if (data.customer_id) {
        localStorage.setItem('customer_id', data.customer_id);
      }
      console.log('Item added to cart:', data.message);
    } else {
      console.error('Error:', data.message);
    }

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

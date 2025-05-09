document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login';  // Redirect to login if no token
        return;
    }

    // Decode token to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));  // Decode JWT payload

    document.getElementById('first_name').innerText = payload.first_name;  // Display name
    document.getElementById('user_email').innerText = payload.email;  // Display name
    document.getElementById('last_name').innerText = payload.last_name;  // Display name
});
// document.getElementById('registerForm').addEventListener('submit', async function (event) {
//     event.preventDefault();

//     const firstname = document.getElementById('firstname').value;
//     const surname = document.getElementById('surname').value;
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     const response = await fetch('http://localhost:3000/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, firstname, surname, password })
//     });

//     const data = await response.json();
//     if (data.token) {
//         localStorage.setItem('token', data.token);
//         alert('Login successful');
//     } else {
//         alert(data.message);
//     }
// });

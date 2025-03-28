// Main JavaScript code to handle frontend actions

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    alert(data.message);
}

async function loadProducts() {
    const response = await fetch('http://localhost:3000/products');
    const products = await response.json();

    let productList = document.getElementById('productList');
    productList.innerHTML = '';  // Clear any existing products

    products.forEach(product => {
        let item = document.createElement('li');
        item.textContent = `${product.name} - $${product.price}`;
        productList.appendChild(item);
    });
}

// Call the function to load products
loadProducts();

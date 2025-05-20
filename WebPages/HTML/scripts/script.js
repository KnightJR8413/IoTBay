// script.js

// ─────────────────────────────────────────────
// 1) SEARCH BAR
// ─────────────────────────────────────────────
function toggleSearchBar() {
  const searchBar = document.getElementById('search-bar');
  searchBar.classList.toggle('show');
}

function searchProduct() {
  const query = document.getElementById('search-input').value;
  alert("Searching for: " + query);
  toggleSearchBar();
}

// ─────────────────────────────────────────────
// 2) NEWSLETTER MODAL
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.querySelector('.newsletter-form');
  if (!newsletterForm) return;

  const emailInput = newsletterForm.querySelector('input[type="email"]');
  const modal      = document.querySelector('.subscription-modal');
  const backdrop   = document.querySelector('.modal-backdrop');
  const closeModal = document.querySelector('.close-modal');
  const subscribed = document.querySelector('.subscribed-email');

  newsletterForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = emailInput.value;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(email)) return alert('Enter a valid email');

    try {
      await fetch('http://localhost:3000/newsletter', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email})
      });
      subscribed.textContent = email;
      modal.classList.add('show');
      backdrop.classList.add('show');
      emailInput.value = '';
      setTimeout(() => {
        modal.classList.remove('show');
        backdrop.classList.remove('show');
      }, 5000);
    } catch {
      alert('Subscription failed');
    }
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
    backdrop.classList.remove('show');
  });
  backdrop.addEventListener('click', () => {
    modal.classList.remove('show');
    backdrop.classList.remove('show');
  });
});

// ─────────────────────────────────────────────
// 3) SMOOTH SCROLL & LOGIN REDIRECT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // smooth nav scrolling
  document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', e => {
      const target = link.getAttribute('href');
      if (target.startsWith('#')) {
        e.preventDefault();
        const sec = document.querySelector(target);
        if (sec) window.scrollTo({top: sec.offsetTop - 50, behavior:'smooth'});
      }
    });
  });
  // highlight on scroll
  window.addEventListener('scroll', () => {
    const pos = window.scrollY;
    document.querySelectorAll('nav ul li a').forEach(link => {
      const sec = document.querySelector(link.getAttribute('href'));
      if (!sec) return;
      const top = sec.offsetTop - 60, bottom = top + sec.offsetHeight;
      link.classList.toggle('active', pos >= top && pos < bottom);
    });
  });
});

function checkLoginAndRedirect() {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = '/login';
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (Date.now() >= payload.exp*1000) {
    localStorage.removeItem('token');
    return window.location.href = '/login';
  }
  window.location.href = '/account';
}

// ─────────────────────────────────────────────
// 4) PRODUCTS LISTING + ADD TO CART
// ─────────────────────────────────────────────
const API_BASE = 'http://localhost:3000';

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('products-grid')) {
    loadProducts();
  }
  if (window.location.pathname === '/shoppingcart') {
    loadCart();
  }
});

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    renderProducts(data);
  } catch (e) {
    console.error('Error fetching products:', e);
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="/images/${p.image_url}" alt="${p.name}" style="width:100%">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="rating">⭐ ${p.rating || '—'}</div>
      <div class="price">$${p.price.toFixed(2)}</div>
      <button class="buy-btn" ${p.stock===0?'disabled':''}
        onclick="addToCart(${p.id})">
        ${p.stock===0?'Out of Stock':'Add to Cart'}
      </button>
    `;
    grid.appendChild(card);
  });
}

function getUserId() {
  return localStorage.getItem('userId') || '';
}

async function addToCart(productId) {
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        product_id: productId,      // ✅ FIXED KEY
        userId: getUserId()
      })
    });
    const json = await res.json();
    if (!res.ok) throw json;
    localStorage.setItem('userId', json.customer_id);
    alert('✅ Added to cart!');
  } catch (err) {
    console.error('Add to cart failed — full error object:', err);
    if (err.message) {
      console.error('Server said:', err.message);
    }
    alert('❌ Could not add to cart (see console)');
  }
}


// ─────────────────────────────────────────────
// 5) SHOPPING CART PAGE
// ─────────────────────────────────────────────
async function loadCart() {
  try {
    const res = await fetch(`${API_BASE}/cart?userId=${getUserId()}`);
    const items = await res.json();
    renderCartItems(items);
  } catch (e) {
    console.error('Error loading cart:', e);
  }
}

function renderCartItems(items) {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.productId = it.product_no;
    div.innerHTML = `
      <img src="/images/${it.image_url}" alt="${it.name}" class="cart-img">
      <div class="item-details">
        <h3>${it.name}</h3>
        <p class="price">$${it.price.toFixed(2)}</p>
        <div class="quantity-control">
          <button class="qty-btn" onclick="updateQuantity(this,-1)">-</button>
          <input type="number" class="qty-input" value="${it.quantity ?? 1}" min="1">
          <button class="qty-btn" onclick="updateQuantity(this,1)">+</button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeItem(${it.product_no},this)">Remove</button>
    `;
    container.appendChild(div);
  });
  updateTotals();
}

async function removeItem(productId, btn) {
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({product_no:productId, userId:getUserId()})
    });
    if (!res.ok) throw await res.json();
    btn.closest('.cart-item').remove();
    updateTotals();
  } catch (e) {
    console.error('Remove failed:', e);
    alert('❌ Could not remove item');
  }
}

function updateQuantity(btn, delta) {
  const input = btn.parentElement.querySelector('.qty-input');
  let v = parseInt(input.value) + delta;
  if (v<1) v=1;
  input.value = v;
  updateTotals();
  // optionally PATCH to backend here
}

function updateTotals() {
  let sub=0;
  document.querySelectorAll('.cart-item').forEach(item=>{
    const price = parseFloat(item.querySelector('.price').textContent.slice(1));
    const qty   = parseInt(item.querySelector('.qty-input').value);
    sub += price*qty;
  });
  const tax = sub*0.10, tot = sub+tax;
  document.querySelector('.subtotal').textContent     = `$${sub.toFixed(2)}`;
  document.querySelector('.tax').textContent          = `$${tax.toFixed(2)}`;
  document.querySelector('.total-amount').textContent = `$${tot.toFixed(2)}`;
}




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
      await fetch(`${API_BASE}/newsletter`, {
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
// 3) SMOOTH SCROLL & LOGIN & ADMIN REDIRECT
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

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (Date.now() >= payload.exp * 1000) {
      localStorage.removeItem('token');
      return window.location.href = '/login';
    }

    if (payload.user_type === 's') {
      window.location.href = '/staffdashboard';
    } else if (payload.user_type === 'a') {
      window.location.href = '/admindashboard';
    } else {
      window.location.href = '/account';
    }
  } catch (e) {
    console.error("Invalid token:", e);
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

// Redirecting unauthorised users away from the Admin Dashboard for security reasons
document.addEventListener('DOMContentLoaded', () => {
  // Only run this check on the admin dashboard page.
  if (window.location.pathname === '/admindashboard') {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check that the role is 'admin'
      if (payload.user_type !== 'a') {
        // If the user is not an admin, redirect away (e.g. to the home page)
        window.location.href = '/';
      }
    } catch (err) {
      // If decoding fails, clear the token and redirect to the login page.
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
});

// ─────────────────────────────────────────────
// 4) PRODUCTS LISTING + ADD TO CART START
// ─────────────────────────────────────────────

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
        product_id: productId,
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
// 4) PRODUCTS LISTING + ADD TO CART END
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 5) SHOPPING CART PAGE START
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
    div.dataset.productId = it.product_id;
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
      <button class="remove-btn" onclick="removeItem(${it.product_id},this)">Remove</button>
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
      body: JSON.stringify({ product_id: productId, userId: getUserId() })
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
// ─────────────────────────────────────────────
// 5) SHOPPING CART PAGE END
// ─────────────────────────────────────────────

//ADMIN STUFF
const token = localStorage.getItem('token');

// Helper function which automatically includes the Authorization header
function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  options.headers['Authorization'] = 'Bearer ' + token;
  options.headers['Content-Type'] = 'application/json';
  return fetch(url, options);
}

// Loads list of users for the admin 
async function loadUsers(query = '') {
  try {
    let url = `${API_BASE}/admin/users`;
    if (query) url += `?search=${encodeURIComponent(query)}`;
    const res = await authFetch(url);
    const data = await res.json();
    renderUserTable(data.users);
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function renderUserTable(users) {
  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';
  
  users.forEach(user => {
    const isAdmin = user.email.toLowerCase() === "admin@iotbay.com";
    let actionButtons = `<button class="adm-btn btn btn-edit" onclick="openUserModal(${user.userId})">Edit</button>`;
    
    if (!isAdmin) {
      actionButtons += `<button class="adm-btn btn btn-delete" onclick="deleteUser(${user.userId})">Delete</button>`;
      actionButtons += `<button class="adm-btn btn btn-toggle" data-user-id="${user.userId}" onclick="toggleStatus(${user.userId}, '${user.status}')">
                           ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>`;
    }
    
    const rowHTML = `
    <tr>
    <td>${user.full_name}</td>
    <td>${user.email}</td>
    <td>${user.phone || 'N/A'}</td>
    <td>${user.user_type === 'c' ? 'Customer' : 'Staff'}</td>
    <td id="status-${user.userId}">${user.status}</td>
    <td>${actionButtons}</td>
    </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', rowHTML);
  });
}


function searchUsers() {
  const query = document.getElementById('searchInput').value;
  loadUsers(query);
}

// Allows the adding or editing of users
function openUserModal(userId = null) {
  if (userId) {
    // Edit mode: fetch the user details first
    authFetch(`${API_BASE}/admin/users/${userId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('modalTitle').innerText = 'Edit User';
      document.getElementById('userId').value = data.user.userId;
      document.getElementById('fullName').value = data.user.full_name;
      document.getElementById('emailInput').value = data.user.email;
      document.getElementById('phoneInput').value = data.user.phone || '';
      document.getElementById('userType').value = data.user.user_type;
      document.getElementById('statusInput').value = data.user.status;
      document.getElementById('userModal').style.display = 'flex';
      })
      .catch(err => console.error('Error fetching user:', err));
    } else {
      // Add mode: clear the form and open the modal
      document.getElementById('modalTitle').innerText = 'Add New User';
      document.getElementById('userForm').reset();
      document.getElementById('userId').value = '';
      document.getElementById('userModal').style.display = 'flex';
    }
  }
  
  function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
  }
  
  // Form for adding/editing a user
  document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('userId').value;
    const payload = {
      full_name: document.getElementById('fullName').value,
      email: document.getElementById('emailInput').value,
      phone: document.getElementById('phoneInput').value,
      user_type: document.getElementById('userType').value,
      status: document.getElementById('statusInput').value
    };
    
    try {
      let url = `${API_BASE}/admin/users`;
      let method = 'POST';
      if (id) {
        url += `/${id}`;
        method = 'PUT';
      }
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        closeUserModal();
        loadUsers();
      } else {
        alert(data.error || data.message);
      }
    } catch (err) {
      console.error('Error saving user:', err);
    }
});

async function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      const res = await authFetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        loadUsers();
      } else {
        alert(data.error || data.message);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }
}

// Function for toggling the users status
async function toggleStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();

    if (response.ok) {
      loadUsers();
    } else {
      alert(data.error || "Failed to update status.");
    }
  } catch (error) {
    console.error("Error toggling status:", error);
  }
}

// Loading users when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('userTable')) {
    console.log('Loading users ...');
    loadUsers();
  }  
});


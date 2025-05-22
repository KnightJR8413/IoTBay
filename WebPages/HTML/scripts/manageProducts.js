document.addEventListener("DOMContentLoaded", () => {
    const baseUrl   = "http://localhost:3000";
    const token     = localStorage.getItem("token");
    const form      = document.getElementById("productForm");
    const statusP   = document.getElementById("status");
    const catalogue = document.getElementById("catalogue");
    const searchBox = document.getElementById("searchBox");
    const [searchBtn, clearBtn, cancelBtn, saveBtn] =
      ["searchBtn","clearBtn","cancelBtn","saveBtn"].map(id => document.getElementById(id));
    const formTitle = document.getElementById("form-title");
    const hiddenId  = document.getElementById("productId");
  
    const fields = ["name","price","description","stock","image_url",
      "supplier","brand","model","release_year","specifications","size","colour"]
      .reduce((o,id) => (o[id]=document.getElementById(id), o), {});
  
    // Helpers
    const resetForm = () => {
      form.reset();
      hiddenId.value = "";
      cancelBtn.style.display = "none";
      formTitle.textContent = "Add New Product";
    };
  
    const getFormData = () => {
      const data = Object.fromEntries(new FormData(form));
      data.price        = parseFloat(data.price);
      data.stock        = parseInt(data.stock,10);
      data.release_year = data.release_year ? +data.release_year : null;
      return data;
    };
  
    const renderList = list => {
      catalogue.innerHTML = list.map(p => `
        <div class="product-card" data-id="${p.id}">
          <h3>${p.name}</h3>
          <p>Price: $${p.price.toFixed(2)}</p>
          <p>Stock: ${p.stock}</p>
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </div>
      `).join("");
    };
  
    // Load & render
    async function loadProducts(filter="") {
      const url = `${baseUrl}/products?name=${encodeURIComponent(filter)}`;
      const res = await fetch(url);
      const list= await res.json();
      renderList(list);
      resetForm();  // exit edit mode if you reload list
    }
    loadProducts();
  
    // Search / Clear
    searchBtn.addEventListener("click", () => loadProducts(searchBox.value));
    clearBtn .addEventListener("click", () => { searchBox.value=""; loadProducts(); });
  
    // Submit (Create or Update)
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data    = getFormData();
      const id      = hiddenId.value;
      const method  = id ? "PUT" : "POST";
      const url     = id ? `${baseUrl}/products/${id}` : `${baseUrl}/products`;
  
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type":"application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
  
        statusP.style.color = "green";
        statusP.textContent = id
          ? `Saved changes to product`
          : "New product added";
  
        loadProducts(searchBox.value);
      } catch (err) {
        statusP.style.color = "red";
        statusP.textContent = err.message || "Save failed";
      }
    });
  
    // Cancel edit
    cancelBtn.addEventListener("click", resetForm);
  
    // Delegated Edit / Delete
  catalogue.addEventListener("click", async e => {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const id = card.dataset.id;
    const name = card.querySelector("h3").innerText;  // grab the name

    // DELETE
    if (e.target.classList.contains("delete")) {
      if (!confirm(`Really delete "${name}"?`)) return;
      const res  = await fetch(`${baseUrl}/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        statusP.style.color = "red";
        statusP.textContent = data.message;
      } else {
        statusP.style.color = "green";
        statusP.textContent = `"${name}" deleted`;
        loadProducts(searchBox.value);
      }
      return;
    }

    // EDIT
    if (e.target.classList.contains("edit")) {
      // Enter edit mode
      formTitle.textContent = `Editing Product: "${name}"`;
      cancelBtn.style.display = "";
      statusP.textContent = "";

      // Fetch full details
      const res = await fetch(`${baseUrl}/products/${id}`);
      const p   = await res.json();

      hiddenId.value = id;
      // Populate every field
      Object.keys(fields).forEach(key => {
        if (p[key] != null) fields[key].value = p[key];
      });

      // Smooth scroll to form
      window.scrollTo({ top: form.offsetTop, behavior: "smooth" });
    }
  });
});
  
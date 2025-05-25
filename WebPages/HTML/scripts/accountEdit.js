const API_BASE = 'http://localhost:3000';
document.addEventListener("DOMContentLoaded", function () {
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');

    editBtn.addEventListener('click', () => {
        const mode = editBtn.dataset.mode;

        // EDIT MODE: swap spans → inputs
        if (mode === 'view') {
        editBtn.textContent = 'Update';
        editBtn.dataset.mode = 'edit';
        deleteBtn.style.display = 'inline-block';

        document.querySelectorAll('.info-row .info-value')
            .forEach(span => {
            const value = span.textContent.trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.className = 'info-input';
            input.name = span.id || '';
            span.parentNode.replaceChild(input, span);
            });
        }

        // UPDATE MODE: swap inputs → spans
        else {
        const payload = {};

        document.querySelectorAll('.info-row input.info-input')
            .forEach(input => {
            const span = document.createElement('span');
            span.className = 'info-value';
            span.id = input.name;
            span.textContent = input.value;
            payload[input.name] = input.value;
            input.parentNode.replaceChild(span, input);
            });

        fetch(`${API_BASE}/update-customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to update user info");
            }
            return response.json();
        })
        .then(data => {
            console.log("User info updated:", data);
        })
        .catch(error => {
            console.error("Update error:", error);
            alert("Failed to update profile.");
        });

        editBtn.textContent = 'Edit';
        editBtn.dataset.mode = 'view';
        deleteBtn.style.display = 'none';
        }
    });

    deleteBtn.addEventListener('click', async () => {
        const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");
        if (confirmed) {
            try {
                const res = await fetch(`${API_BASE}/delete-account`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!res.ok) throw new Error('Deletion failed');
                alert("Account deleted successfully.");
                localStorage.removeItem("token");
                window.location.href = '/'; // Redirect to homepage
            } catch (err) {
                console.error("Delete error:", err);
                alert("There was a problem deleting your account.");
            }
        }
    });
});
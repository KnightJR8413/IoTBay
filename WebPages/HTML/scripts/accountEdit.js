document.addEventListener("DOMContentLoaded", function () {
    const editBtn = document.getElementById('editBtn');

    editBtn.addEventListener('click', () => {
        const mode = editBtn.dataset.mode;

        // EDIT MODE: swap spans → inputs
        if (mode === 'view') {
        editBtn.textContent = 'Update';
        editBtn.dataset.mode = 'edit';

        document.querySelectorAll('.info-row .info-value')
            .forEach(span => {
            const value = span.textContent.trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.className = 'info-input';
            // Optional: give name attributes so you can serialize later
            input.name = span.id || '';  // e.g. first_name, last_name, etc.
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

        fetch('http://localhost:3000/update-user', {
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
        }
    });
});
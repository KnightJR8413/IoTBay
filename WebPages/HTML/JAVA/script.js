// Function to toggle the visibility of the search bar
function toggleSearchBar() {
    var searchBar = document.getElementById('search-bar');
    // Check if the "show" class is already applied
    if (searchBar.classList.contains('show')) {
        searchBar.classList.remove('show'); // Hide the search bar
    } else {
        searchBar.classList.add('show'); // Show the search bar
    }
}

// Function to simulate the search action (this can be extended with real search functionality)
function searchProduct() {
    var query = document.getElementById('search-input').value;
    alert("Searching for: " + query);
    toggleSearchBar(); // Close the search bar after search
}

// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function () {
    console.log("IoTBay Landing Page Loaded");

    // Smooth scrolling for navigation links
    document.querySelectorAll("nav ul li a").forEach(link => {
        link.addEventListener("click", function (event) {
            if (this.getAttribute("href").startsWith("#")) {
                event.preventDefault();
                const section = document.querySelector(this.getAttribute("href"));
                if (section) {
                    window.scrollTo({
                        top: section.offsetTop - 50,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // Highlight navigation links on scroll
    window.addEventListener("scroll", function () {
        let scrollPosition = window.scrollY;
        document.querySelectorAll("nav ul li a").forEach(link => {
            let section = document.querySelector(link.getAttribute("href"));
            if (section) {
                let sectionTop = section.offsetTop - 60;
                let sectionBottom = sectionTop + section.offsetHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    document.querySelectorAll("nav ul li a").forEach(a => a.classList.remove("active"));
                    link.classList.add("active");
                }
            }
        });
    });
});

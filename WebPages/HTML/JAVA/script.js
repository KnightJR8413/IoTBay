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

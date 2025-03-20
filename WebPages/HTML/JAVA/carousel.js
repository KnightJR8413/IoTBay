let currentIndex = 0;
let slideInterval;

document.addEventListener("DOMContentLoaded", function () {
    const slides = document.querySelectorAll(".carousel-slide");
    const totalSlides = slides.length;
    const carousel = document.querySelector(".carousel");

    // Create dot navigation dynamically
    const dotsContainer = document.createElement("div");
    dotsContainer.classList.add("carousel-dots");
    document.querySelector(".carousel-container").appendChild(dotsContainer);

    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("span");
        dot.classList.add("dot");
        dot.setAttribute("data-index", i);
        dot.addEventListener("click", function () {
            moveSlide(i);
            resetAutoSlide(); // Reset auto-slide when user clicks
        });
        dotsContainer.appendChild(dot);
    }

    updateDots(); // Initialize dots
    startAutoSlide(); // Start automatic sliding

    function moveSlide(index) {
        currentIndex = index;
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateDots();
    }

    function updateDots() {
        document.querySelectorAll(".dot").forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });
    }

    function startAutoSlide() {
        slideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalSlides; // Loop back to first slide
            moveSlide(currentIndex);
        }, 4000); // Change slide every 4 seconds
    }

    function resetAutoSlide() {
        clearInterval(slideInterval); // Stop the current auto-slide
        startAutoSlide(); // Restart auto-slide
    }
});



const slides = document.querySelector(".slides");
const slideItems = document.querySelectorAll(".slides .card");
const button_back = document.getElementById("button_back");
const button_next = document.getElementById("button_next");
const indicatorsContainer = document.querySelector(".dots");

let index = 0;

function updateSlider() {
    slides.style.transform = `translateX(-${index * 14.6}%)`;
    slides.style.transition = "transform 0.8s ease";
    updateIndicators(); 
}

button_back.addEventListener("click", () => {
    if (index === 0) {
        index = slideItems.length - 3;
    } else {
        index--;
    }
    updateSlider();
});

button_next.addEventListener("click", () => {
    if (index === slideItems.length - 3) {
        index = 0;
    } else {
        index++;
    }
    updateSlider();
});

function createIndicators() {
    for (let i = 0; i < slideItems.length - 2; i++) {
        const indicator = document.createElement("div");
        indicator.classList.add("dot");
        if (i === 0) indicator.classList.add("active");
        indicator.addEventListener("click", () => {
            index = i;
            updateSlider();
            updateIndicators();
        });
        indicatorsContainer.appendChild(indicator);
    }
}

function updateIndicators() {
    const indicators = document.querySelectorAll(".dot");
    indicators.forEach((indicator, i) => {
        const isActive = (i === index && index < slideItems.length - 1);
        indicator.classList.toggle("active", isActive);
    });
}

createIndicators();
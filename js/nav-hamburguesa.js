

const hamburger = document.getElementById("hamburger");
const navbar = document.querySelector(".navbar");

hamburger.addEventListener("click",()=>{

    hamburger.classList.toggle("active");
    navbar.classList.toggle("active");

});

document.querySelectorAll(".nav-links a").forEach(link=>{

    link.addEventListener("click",()=>{

        navbar.classList.remove("active");
        hamburger.classList.remove("active");

    });

});


document.addEventListener("DOMContentLoaded", function() {

const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

document.getElementById("bookingForm").addEventListener("submit", function(e) {

e.preventDefault();

let name = document.getElementById("name").value;
let phone = document.getElementById("phone").value;
let email = document.getElementById("email").value;
let arrival = document.getElementById("arrival").value;
let departure = document.getElementById("departure").value;
let guests = document.getElementById("guests").value;

let templateParams = {
name: name,
phone: phone,
email: email,
arrival_date: arrival,
departure_date: departure,
guests: guests
};

emailjs.send("service_b6m9tqh","template_xx8qpgm",templateParams)
.then(function(){
alert("Booking Request Sent Successfully!");
})
.catch(function(){
alert("Error Sending Booking Request");
});

});

menuBtn.addEventListener("click", (e) => {
  navLinks.classList.toggle("open");

  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

navLinks.addEventListener("click", (e) => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-line");
});

const scrollRevealOption = {
  distance: "50px",
  origin: "bottom",
  duration: 1000,
};

ScrollReveal().reveal(".header__container .section__subheader", {
  ...scrollRevealOption,
});

ScrollReveal().reveal(".header__container h1", {
  ...scrollRevealOption,
  delay: 500,
});

ScrollReveal().reveal(".header__container .btn", {
  ...scrollRevealOption,
  delay: 1000,
});

ScrollReveal().reveal(".room__card", {
  ...scrollRevealOption,
  interval: 500,
});

ScrollReveal().reveal(".feature__card", {
  ...scrollRevealOption,
  interval: 500,
});

ScrollReveal().reveal(".news__card", {
  ...scrollRevealOption,
  interval: 500,
});

});
// Book Now button functionality
const bookNowBtn = document.getElementById("bookNowBtn");

bookNowBtn.addEventListener("click", function () {

  // Scroll to booking section
  document.getElementById("booking").scrollIntoView({
    behavior: "smooth"
  });

  // Focus on first input after scroll
  setTimeout(() => {
    document.getElementById("name").focus();
  }, 500);

  // Optional: small alert guidance
  setTimeout(() => {
    alert("Please fill your details to check availability");
  }, 600);

});

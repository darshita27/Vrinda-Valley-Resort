document.addEventListener("DOMContentLoaded", function() {

const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

document.getElementById("bookingForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  let data = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    arrival: document.getElementById("arrival").value,
    departure: document.getElementById("departure").value,
    guests: document.getElementById("guests").value
  };

  try {
    let response = await fetch("https://vrinda-backend-h8oz.onrender.com/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    let result = await response.json();

// ✅ EMAILJS CODE (ADD THIS)
emailjs.send("service_8ktw1xg", "template_9gehunp", {
  name: data.name,
  phone: data.phone,
  email: data.email,
  arrival: data.arrival,
  departure: data.departure,
  guests: data.guests
})
.then(function() {
  console.log("Email sent successfully");
})
.catch(function(error) {
  console.log("Email error:", error);
});

// ✅ EXISTING CODE
alert("Booking Saved Successfully!");
document.getElementById("bookingForm").reset();

  } catch (error) {
    alert("Error saving booking");
    console.log(error);
  }
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
const bookNowBtns = document.querySelectorAll(".bookNowBtn");

  bookNowBtns.forEach(button => {
    button.addEventListener("click", function () {

      const bookingSection = document.getElementById("booking");

      bookingSection.scrollIntoView({
        behavior: "smooth"
      });

      setTimeout(() => {
        bookingSection.classList.add("highlight");
      }, 400);

      setTimeout(() => {
        bookingSection.classList.remove("highlight");
      }, 2400);

      setTimeout(() => {
        document.getElementById("name").focus();
      }, 600);

    });
  });
  if (document.getElementById("total")) {
    loadStats();
  } 
});
async function loadStats() {
  const token = localStorage.getItem("token");

  const res = await fetch("https://vrinda-backend-h8oz.onrender.com/api/bookings/stats", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();
  console.log("STATS DATA:", data); 
  document.getElementById("total").innerText = "Total: " + data.total;
  document.getElementById("confirmed").innerText = "Confirmed: " + data.confirmed;
  document.getElementById("pending").innerText = "Pending: " + data.pending;
  document.getElementById("cancelled").innerText = "Cancelled: " + data.cancelled;
window.onload = function () {
    document.getElementById("popup-banner").style.display = "block";
}

document.querySelector(".close-btn").onclick = function () {
    document.getElementById("popup-banner").style.display = "none";
}

}
// Book Now button functionality

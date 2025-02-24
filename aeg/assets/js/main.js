// assets/js/main.js

document.addEventListener("DOMContentLoaded", function() {
  // If a login form is present, attach the login functionality
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      // Hardcoded credentials for demo purposes
      if (username === "admin" && password === "password") {
        // Set a logged-in flag in sessionStorage
        sessionStorage.setItem("loggedIn", "true");
        // Redirect to the main menu (adjust the path as necessary)
        window.location.href = "../index.html";
      } else {
        const errorMsg = document.getElementById("error-msg");
        errorMsg.style.display = "block";
        errorMsg.textContent = "Invalid credentials. Try again.";
      }
    });
  }

  // For pages that require authentication, check if the user is logged in.
  // If not on the login page and not logged in, redirect to login.
  if (!window.location.href.includes("login.html") && sessionStorage.getItem("loggedIn") !== "true") {
    // Adjust the path to login.html if necessary.
    window.location.href = "login.html";
  }

  // (Other global interactions can be added below)
});

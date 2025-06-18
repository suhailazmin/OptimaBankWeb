// Handle email/password login
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const rememberMe = document.getElementById("rememberMe").checked;
  const errorElement = document.getElementById("login-error");

  clearErrors();

  const loginBtn = document.querySelector(".login-btn");
  const originalBtnText = loginBtn.innerText;
  loginBtn.innerHTML = '<span class="spinner"></span> Logging in...';
  loginBtn.disabled = true;

  // Set persistence based on remember me
  const persistence = rememberMe
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;

  firebase
    .auth()
    .setPersistence(persistence)
    .then(() => {
      return firebase.auth().signInWithEmailAndPassword(email, password);
    })
    .then(() => {
      window.location.href = "../dashboard.html";
    })
    .catch((error) => {
      loginBtn.innerHTML = originalBtnText;
      loginBtn.disabled = false;

      let errorMessage = "Login failed. Please check your email and password.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up.";
        document.getElementById("login-email").classList.add("input-error");
      } else if (error.code === "auth/wrong-password") {
        errorMessage =
          "Incorrect password. Please try again or reset your password.";
        document.getElementById("login-password").classList.add("input-error");
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Too many attempts. Please try again later or reset your password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format. Please check your email address.";
        document.getElementById("login-email").classList.add("input-error");
      }

      showError(errorMessage);
    });
});

// Handle Google sign-in
document
  .getElementById("google-signin-btn")
  .addEventListener("click", function () {
    const errorElement = document.getElementById("login-error");
    const googleBtn = this;
    const originalBtnText = googleBtn.innerHTML;

    // Clear previous errors
    clearErrors();

    // Show loading state
    googleBtn.innerHTML =
      '<span class="spinner"></span> Continuing with Google...';
    googleBtn.disabled = true;

    const provider = new firebase.auth.GoogleAuthProvider();

    firebase
      .auth()
      .signInWithPopup(provider)
      .then(() => {
        window.location.href = "../dashboard.html";
      })
      .catch((error) => {
        // Restore button state
        googleBtn.innerHTML = originalBtnText;
        googleBtn.disabled = false;

        // Handle Google sign-in errors
        let errorMessage = "Google sign-in failed. Please try again.";

        if (error.code === "auth/account-exists-with-different-credential") {
          errorMessage =
            "This email is already registered with another method. Please use email/password login.";
        } else if (error.code === "auth/popup-closed-by-user") {
          errorMessage = "Google sign-in window was closed. Please try again.";
        } else if (error.code === "auth/cancelled-popup-request") {
          errorMessage = "Sign-in process was cancelled. Please try again.";
        }

        showError(errorMessage);
      });
  });

// Helper functions
function showError(message) {
  const errorElement = document.getElementById("login-error");
  errorElement.innerText = message;
  errorElement.style.display = "block";
}

function clearErrors() {
  document.getElementById("login-error").style.display = "none";
  document.getElementById("login-email").classList.remove("input-error");
  document.getElementById("login-password").classList.remove("input-error");
}

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in, redirect
    window.location.href = "../dashboard.html";
  }
});

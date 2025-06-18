document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;
  const phone = document.getElementById("phone").value;
  const errorDiv = document.getElementById("signup-error");
  const submitBtn = document.querySelector(".register-btn");
  const originalBtnText = submitBtn.innerText;

  // Clear previous errors
  errorDiv.innerText = "";
  clearInputErrors();

  // Show loading state
  submitBtn.innerHTML = '<span class="spinner"></span> Registering...';
  submitBtn.disabled = true;

  // Client-side validation
  if (password !== confirm) {
    errorDiv.innerText = "Passwords do not match.";
    document.getElementById("signup-password").classList.add("input-error");
    document.getElementById("signup-confirm").classList.add("input-error");
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
  }

  if (password.length < 6) {
    errorDiv.innerText = "Password must be at least 6 characters.";
    document.getElementById("signup-password").classList.add("input-error");
    document.getElementById("signup-confirm").classList.add("input-error");
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
  }

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Only update displayName, phoneNumber is not supported here
      return userCredential.user.updateProfile({
        displayName: name,
      });
    })
    .then(() => {
      window.location.href = "../dashboard.html";
    })
    .catch((error) => {
      // Error handling remains the same
      let errorMessage = "Registration failed. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already registered. Please login instead.";
        document.getElementById("signup-email").classList.add("input-error");
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format. Please check your email address.";
        document.getElementById("signup-email").classList.add("input-error");
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
        document.getElementById("signup-password").classList.add("input-error");
        document.getElementById("signup-confirm").classList.add("input-error");
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }

      errorDiv.innerText = errorMessage;
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    });
});

// Google Signup (if uncommented in HTML)
const googleBtn = document.getElementById("google-signup-btn");
if (googleBtn) {
  googleBtn.addEventListener("click", function () {
    const errorDiv = document.getElementById("signup-error");
    const googleBtn = this;
    const originalBtnText = googleBtn.innerHTML;

    // Clear previous errors
    errorDiv.innerText = "";
    clearInputErrors();

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
        // Handle Google sign-in errors
        let errorMessage = "Google sign-up failed. Please try again.";

        if (error.code === "auth/account-exists-with-different-credential") {
          errorMessage =
            "This email is already registered. Please login instead.";
        } else if (error.code === "auth/popup-closed-by-user") {
          errorMessage = "Google sign-up window was closed. Please try again.";
        } else if (error.code === "auth/cancelled-popup-request") {
          errorMessage = "Sign-up process was cancelled. Please try again.";
        }

        errorDiv.innerText = errorMessage;
        googleBtn.innerHTML = originalBtnText;
        googleBtn.disabled = false;
      });
  });
}

function clearInputErrors() {
  const inputs = document.querySelectorAll("#signupForm input");
  inputs.forEach((input) => input.classList.remove("input-error"));
}

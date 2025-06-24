document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;
  const phone = document.getElementById("phone").value.trim();
  const errorDiv = document.getElementById("signup-error");
  const submitBtn = document.querySelector(".register-btn");
  const originalBtnText = submitBtn.innerHTML;

  // Clear previous errors
  errorDiv.textContent = "";
  errorDiv.style.display = "none";
  clearInputErrors();

  // Show loading state
  submitBtn.innerHTML = '<span class="spinner"></span> Registering...';
  submitBtn.disabled = true;

  /* ======================
     CLIENT-SIDE VALIDATION
     ====================== */
  if (!name || !email || !password || !confirm || !phone) {
    showError("All fields are required.");
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
  }

  if (password !== confirm) {
    showError("Passwords do not match.");
    document.getElementById("signup-password").classList.add("input-error");
    document.getElementById("signup-confirm").classList.add("input-error");
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters.");
    document.getElementById("signup-password").classList.add("input-error");
    document.getElementById("signup-confirm").classList.add("input-error");
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
  }

  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    showError("Please enter a valid email address.");
    document.getElementById("signup-email").classList.add("input-error");
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    return;
  }

  /* ======================
     FIREBASE REGISTRATION
     ====================== */
  // Inside the try block of signupForm submit handler
  try {
  const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
  await userCredential.user.updateProfile({ displayName: name });

  // ADD THIS: Save profile to Firestore
  await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
    name: name,
    phone: phone,
    email: email
  });

  window.location.href = "../dashboard.html";
} catch (error) {
  handleAuthError(error);
  submitBtn.innerHTML = originalBtnText;
  submitBtn.disabled = false;
}
});

// Google Signup (now identical to login.js implementation)
document.getElementById("google-signup-btn")?.addEventListener("click", function () {
  const errorDiv = document.getElementById("signup-error");
  const googleBtn = this;
  const originalBtnText = googleBtn.innerHTML;

  // Clear previous errors
  clearErrors();

  // Show loading state
  googleBtn.innerHTML = '<span class="spinner"></span> Continuing with Google...';
  googleBtn.disabled = true;

  const provider = new firebase.auth.GoogleAuthProvider();

  firebase
      .auth()
      .signInWithPopup(provider)
      .then(async (result) => {
        // Add this block for Firestore profile creation
        const user = result.user;
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        if (!doc.exists) {
          await userRef.set({
            name: user.displayName || "",
            phone: user.phoneNumber || "",
            email: user.email
          });
        }
        window.location.href = "../dashboard.html";
      })
    .catch((error) => {
      googleBtn.innerHTML = originalBtnText;
      googleBtn.disabled = false;

      let errorMessage = "Google sign-in failed. Please try again.";
      if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "This email is already registered with another method. Please use email/password login.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google sign-in window was closed. Please try again.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Sign-in process was cancelled. Please try again.";
      }

      showError(errorMessage);
    });
});

/* ======================
   HELPER FUNCTIONS
   ====================== */
function showError(message) {
  const errorElement = document.getElementById("signup-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

function clearErrors() {
  document.getElementById("signup-error").style.display = "none";
  document.getElementById("signup-email").classList.remove("input-error");
  document.getElementById("signup-password").classList.remove("input-error");
  document.getElementById("signup-confirm").classList.remove("input-error");
}

function clearInputErrors() {
  const inputs = document.querySelectorAll("#signupForm input");
  inputs.forEach((input) => input.classList.remove("input-error"));
}

function handleAuthError(error) {
  console.error("Auth error:", error);
  let errorMessage = "Registration failed. Please try again.";
  const emailField = document.getElementById("signup-email");
  const passwordField = document.getElementById("signup-password");

  switch (error.code) {
    case "auth/email-already-in-use":
      errorMessage = "This email is already registered. Please login instead.";
      emailField.classList.add("input-error");
      break;
    case "auth/invalid-email":
      errorMessage = "Invalid email format. Please check your email address.";
      emailField.classList.add("input-error");
      break;
    case "auth/weak-password":
      errorMessage = "Password should be at least 6 characters.";
      passwordField.classList.add("input-error");
      break;
    case "auth/too-many-requests":
      errorMessage = "Too many attempts. Please try again later.";
      break;
    default:
      errorMessage = error.message;
  }

  showError(errorMessage);
}
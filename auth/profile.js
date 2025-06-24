// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  let currentUser = null;

  // Show loading state
  function setLoadingState(isLoading) {
    document
      .querySelectorAll("#profileForm input, #profileForm button")
      .forEach((el) => {
        el.disabled = isLoading;
      });
  }

  // Populate form with user data
  function populateProfileForm(data, user) {
    console.log("Populating form with:", { data, user });
    document.getElementById("profile-name").value = data.name || "";
    document.getElementById("profile-email").value = user.email || "";
    document.getElementById("profile-phone").value = data.phone || "";
  }

  // Show error message visibly
  function showError(msg) {
    console.error(msg);
    const errorEl = document.getElementById("profile-error");
    const successEl = document.getElementById("profile-success");
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = "block";
    }
    if (successEl) successEl.style.display = "none";

    // Optional: auto-hide after 3 seconds
    setTimeout(() => {
      if (errorEl) errorEl.style.display = "none";
    }, 3000);
  }

  // Show success message visibly
  function showSuccess(msg) {
    console.log(msg);
    const successEl = document.getElementById("profile-success");
    const errorEl = document.getElementById("profile-error");
    if (successEl) {
      successEl.textContent = msg;
      successEl.style.display = "block";
    }
    if (errorEl) errorEl.style.display = "none";

    // Optional: auto-hide after 3 seconds
    setTimeout(() => {
      if (successEl) successEl.style.display = "none";
    }, 3000);
  }

  // Load user data when logged in
  firebase.auth().onAuthStateChanged(async function (user) {
    console.log("Auth state changed, user:", user);
    if (user) {
      console.log("User UID:", user.uid);
      currentUser = user;
      setLoadingState(true);
      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        console.log("Document snapshot:", userDoc);

        if (userDoc.exists) {
          console.log("Document data:", userDoc.data());
          populateProfileForm(userDoc.data(), user);
        } else {
          console.log("No document found, using auth data");
          populateProfileForm(
            {
              name: user.displayName || "",
              phone: user.phoneNumber || "",
            },
            user
          );
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        showError("Failed to load profile: " + err.message);
      }
      setLoadingState(false);
    } else {
      console.log("No user, redirecting to login");
      window.location.href = "login.html";
    }
  });

  // Handle form submission
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      console.log("Form submitted");

      if (!currentUser) {
        showError("No user logged in");
        return;
      }

      const name = document.getElementById("profile-name").value.trim();
      const phone = document.getElementById("profile-phone").value.trim();

      try {
        setLoadingState(true);
        console.log("Attempting to save:", {
          name,
          phone,
          uid: currentUser.uid,
        });

        // Save to Firestore
        await db.collection("users").doc(currentUser.uid).set(
          {
            name,
            phone,
            email: currentUser.email,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log("Firestore update successful");

        // Update display name in Firebase Auth
        await currentUser.updateProfile({ displayName: name });
        console.log("Auth profile update successful");

        showSuccess("Profile updated successfully!");
      } catch (err) {
        console.error("Error updating profile:", err);
        showError("Failed to update profile: " + err.message);
      } finally {
        setLoadingState(false);
      }
    });
  } else {
    console.error("Profile form not found");
  }
});

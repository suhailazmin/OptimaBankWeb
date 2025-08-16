// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  let currentUser = null;
  let tempImageBase64 = null; // hold uploaded image until save

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
    document.getElementById("profile-email").value =
      user.email || data.email || "";
    document.getElementById("profile-phone").value = data.phone || "";
    document.getElementById("profile-username").value = data.username || "";
    document.getElementById("profile-address").value = data.address || "";
    document.getElementById("profile-about").value = data.about_me || "";
    document.getElementById("profile-points").value = data.points || "";
    document.getElementById("profile-active").value = data.is_active || "";

    if (data.lastUpdated && data.lastUpdated.toDate) {
      document.getElementById("profile-updated").value = data.lastUpdated
        .toDate()
        .toLocaleString();
    } else {
      document.getElementById("profile-updated").value = "";
    }

    // === Retrieve image from MongoDB if reference exists ===
    const imgPreview = document.getElementById("profile-image-preview");

    if (data.profile_image) {
      fetch(`http://localhost:3000/image/${data.profile_image}`)
        .then((res) => res.json())
        .then((imgData) => {
          if (imgData.success && imgData.base64) {
            imgPreview.src = imgData.base64;
          } else {
            imgPreview.src = "../assets/default-profile.png";
          }
        })
        .catch((err) => {
          console.error("Error fetching image:", err);
          imgPreview.src = "../assets/default-profile.png";
        });
    } else {
      imgPreview.src = "../assets/default-profile.png";
    }
    console.log(`http://localhost:3000/image/${data.profile_image}`);
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
        if (userDoc.exists) {
          populateProfileForm(userDoc.data(), user);
        } else {
          populateProfileForm(
            { name: user.displayName || "", phone: user.phoneNumber || "" },
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

  // === Handle image upload preview ===
  const fileInput = document.getElementById("profile-image-upload");
  if (fileInput) {
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        tempImageBase64 = e.target.result; // store temporarily
        document.getElementById("profile-image-preview").src = tempImageBase64; // show preview immediately
      };
      reader.readAsDataURL(file);
    });
  }

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
      const username = document.getElementById("profile-username").value.trim();
      const address = document.getElementById("profile-address").value.trim();
      const about = document.getElementById("profile-about").value.trim();

      try {
        setLoadingState(true);

        let imageId = null;
        if (tempImageBase64) {
          // Upload or update in MongoDB using user_id
          const res = await fetch("http://localhost:3000/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "profile",
              user_id: currentUser.uid,
              data: tempImageBase64,
            }),
          });

          const result = await res.json();
          if (result.success) {
            imageId = result.id;
            console.log("Saved/Updated image in MongoDB with ID:", imageId);
          }
        }

        // Save to Firestore
        const userData = {
          name,
          phone,
          username,
          address,
          about_me: about,
          email: currentUser.email,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (imageId) userData.profile_image = imageId;

        await db.collection("users").doc(currentUser.uid).set(userData, {
          merge: true,
        });

        // Update display name in Firebase Auth
        await currentUser.updateProfile({ displayName: name });

        showSuccess("Profile updated successfully!");
        tempImageBase64 = null; // reset temp image
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

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;

    const db = firebase.firestore();

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const points = userData.points || "0";

        // Header element (simple text)
        const headerEl = document.getElementById("points-header");
        if (headerEl) {
          headerEl.textContent = `${points} Points`;
        }

        // Main dashboard element (preserve 🪙 icon)
        const balanceEl = document.getElementById("points-balance");
        if (balanceEl) {
          balanceEl.innerHTML = `${points} <span class="coin-icon">🪙</span>`;
        }
      } else {
        showError("0");
      }
    } catch (error) {
      console.error("Failed to fetch user points:", error);
      showError("Error");
    }

    function showError(text) {
      const headerEl = document.getElementById("points-header");
      const balanceEl = document.getElementById("points-balance");

      if (headerEl) headerEl.textContent = `${text} Points`;
      if (balanceEl)
        balanceEl.innerHTML = `${text} <span class="coin-icon">🪙</span>`;
    }
  });
});

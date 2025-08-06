firebase.auth().onAuthStateChanged(async (user) => {
  const cartEl = document.getElementById("cartItems");

  if (!user) {
    cartEl.textContent = "You need to log in to see your cart.";
    return;
  }

  const db = firebase.firestore();

  try {
    // Get cart items where user_id == current user
    const userRef = db.doc(`users/${user.uid}`);
    const cartSnapshot = await db
      .collection("cart_items")
      .where("user_id", "==", userRef)
      .get();

    if (cartSnapshot.empty) {
      cartEl.textContent = "Your cart is empty.";
      return;
    }

    cartEl.innerHTML = "";

    for (const doc of cartSnapshot.docs) {
      const cartItem = doc.data();

      // Fetch voucher details from the reference
      const voucherDoc = await cartItem.voucher_id.get();
      const voucher = voucherDoc.exists
        ? voucherDoc.data()
        : { title: "Unknown Voucher", points: "N/A" };

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <strong>${voucher.title}</strong><br/>
        Quantity: ${cartItem.quantity}<br/>
        Points: ${voucher.points}
      `;
      cartEl.appendChild(div);
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    cartEl.textContent = "Failed to load cart.";
  }
});

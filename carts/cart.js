firebase.auth().onAuthStateChanged(async (user) => {
  const cartEl = document.getElementById("cartItems");

  if (!user) {
    cartEl.textContent = "You need to log in to see your cart.";
    return;
  }

  const db = firebase.firestore();

  try {
    const userRef = db.collection("users").doc(user.uid);
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

      let voucher = { title: "Unknown Voucher", points: "N/A" };

      if (cartItem.voucher_id) {
        // If voucher_id is a DocumentReference
        if (typeof cartItem.voucher_id.get === "function") {
          const voucherDoc = await cartItem.voucher_id.get();
          if (voucherDoc.exists) voucher = voucherDoc.data();
        } else {
          // If voucher_id is stored as string ID
          const voucherDoc = await db
            .collection("vouchers")
            .doc(cartItem.voucher_id)
            .get();
          if (voucherDoc.exists) voucher = voucherDoc.data();
        }
      }

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <strong>${voucher.title}</strong><br/>
        Quantity: ${cartItem.quantity || 1}<br/>
        Points: ${voucher.points || 0}
      `;
      cartEl.appendChild(div);
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    cartEl.textContent = "Failed to load cart.";
  }
});

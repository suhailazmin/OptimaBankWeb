document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const auth = firebase.auth();
  const cartEl = document.getElementById("cartItems");

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      cartEl.textContent = "You need to log in to see your cart.";
      return;
    }

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
        const cartId = doc.id;

        let voucher = { title: "Unknown Voucher", points: 0 };
        let voucherId = null;

        if (cartItem.voucher_id) {
          if (typeof cartItem.voucher_id.get === "function") {
            const voucherDoc = await cartItem.voucher_id.get();
            if (voucherDoc.exists) {
              voucher = voucherDoc.data();
              voucherId = voucherDoc.id;
            }
          } else {
            const voucherDoc = await db
              .collection("vouchers")
              .doc(cartItem.voucher_id)
              .get();
            if (voucherDoc.exists) {
              voucher = voucherDoc.data();
              voucherId = voucherDoc.id;
            }
          }
        }

        const qty = cartItem.quantity || 1;
        const pointsPerVoucher = Number(voucher.points) || 0;

        let imgSrc = "assets/giftcard.jpg";
        if (voucher.image) {
          try {
            const res = await fetch(
              `http://localhost:3000/image/${voucher.image}`
            );
            const imgData = await res.json();
            if (imgData.success) imgSrc = imgData.base64;
          } catch (err) {
            console.error("Error loading voucher image:", err);
          }
        }

        const div = document.createElement("div");
        div.id = `cartItem-${cartId}`;
        div.className = "cart-item";
        div.style.display = "flex";
        div.style.alignItems = "flex-start";
        div.style.gap = "15px";

        div.innerHTML = `
          <img src="${imgSrc}" alt="Voucher Image" style="width:80px; height:80px; border-radius:8px; object-fit:cover;">
          <div class="cart-details" style="flex:1;">
            <h3>${voucher.title}</h3>
            <p>Points per Voucher: ${pointsPerVoucher}</p>
            <p>Quantity: <span id="qty-${cartId}">${qty}</span></p>
            <p>Total Points: <span id="total-${cartId}">${
          qty * pointsPerVoucher
        }</span></p>
            <div class="cart-buttons" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
              <button class="decrease-btn">➖</button>
              <button class="increase-btn">➕</button>
              <button class="checkout-btn">Checkout</button>
              <button class="remove-btn">❌ Remove</button>
            </div>
          </div>
        `;

        // Remove
        div.querySelector(".remove-btn").addEventListener("click", async () => {
          if (confirm("Remove this item from cart?")) {
            await db.collection("cart_items").doc(cartId).delete();
            div.remove();
          }
        });

        // Increase qty
        div
          .querySelector(".increase-btn")
          .addEventListener("click", async () => {
            const newQty = (cartItem.quantity || 1) + 1;
            await db
              .collection("cart_items")
              .doc(cartId)
              .update({ quantity: newQty });
            cartItem.quantity = newQty;
            document.getElementById(`qty-${cartId}`).textContent = newQty;
            document.getElementById(`total-${cartId}`).textContent =
              newQty * pointsPerVoucher;
          });

        // Decrease qty
        div
          .querySelector(".decrease-btn")
          .addEventListener("click", async () => {
            let newQty = (cartItem.quantity || 1) - 1;
            if (newQty < 1) return;
            await db
              .collection("cart_items")
              .doc(cartId)
              .update({ quantity: newQty });
            cartItem.quantity = newQty;
            document.getElementById(`qty-${cartId}`).textContent = newQty;
            document.getElementById(`total-${cartId}`).textContent =
              newQty * pointsPerVoucher;
          });

        // Checkout
        div.querySelector(".checkout-btn").addEventListener("click", () => {
          showCheckoutModal(
            user.uid,
            voucher,
            voucherId,
            cartId,
            cartItem.quantity,
            pointsPerVoucher,
            imgSrc
          );
        });

        cartEl.appendChild(div);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      cartEl.textContent = "Failed to load cart.";
    }
  });
});

// Checkout modal
function showCheckoutModal(
  userId,
  voucher,
  voucherId,
  cartId,
  qty,
  pointsPerVoucher,
  imgSrc
) {
  const overlay = document.createElement("div");
  overlay.style =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;";

  const modal = document.createElement("div");
  modal.style =
    "background:#fff;padding:20px;border-radius:12px;width:350px;text-align:center;";
  modal.innerHTML = `
    <img src="${imgSrc}" alt="Voucher" style="width:100px;height:100px;border-radius:8px;margin-bottom:10px;">
    <h3>${voucher.title}</h3>
    <p>${voucher.description || ""}</p>
    <p>Quantity: ${qty}</p>
    <p>Points per Voucher: ${pointsPerVoucher}</p>
    <p>Total Points: ${qty * pointsPerVoucher}</p>
    <div style="text-align:left;margin:10px 0;">
      <input type="checkbox" id="agreeTerms"> 
      <label for="agreeTerms">I agree to the Terms & Conditions</label>
      <p style="font-size:12px;color:#555;">${
        voucher.terms_and_condition || "No terms available."
      }</p>
    </div>
    <button id="confirmPurchaseBtn" disabled style="background:#6a0dad;color:#fff;padding:10px 15px;border:none;border-radius:6px;cursor:pointer;">Confirm Purchase</button>
    <button id="closeModalBtn" style="margin-top:10px;background:#ccc;color:#333;padding:6px 12px;border:none;border-radius:6px;cursor:pointer;">Cancel</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const checkbox = modal.querySelector("#agreeTerms");
  const confirmBtn = modal.querySelector("#confirmPurchaseBtn");
  checkbox.addEventListener("change", () => {
    confirmBtn.disabled = !checkbox.checked;
  });

  modal
    .querySelector("#closeModalBtn")
    .addEventListener("click", () => overlay.remove());

  confirmBtn.addEventListener("click", async () => {
    try {
      const userRef = firebase.firestore().collection("users").doc(userId);
      const voucherRef = firebase
        .firestore()
        .collection("vouchers")
        .doc(voucherId);

      const totalPoints = pointsPerVoucher * qty;

      // 1️⃣ Create voucher_history first
      const historyRef = await firebase
        .firestore()
        .collection("voucher_history")
        .add({
          user_id: userRef, // DocumentReference
          voucher_id: voucherRef, // DocumentReference
          quantity: qty,
          total_points: totalPoints,
          completed_date: firebase.firestore.Timestamp.now(),
          voucher_snapshot: {
            title: voucher.title,
            description: voucher.description,
            points: pointsPerVoucher,
          },
        });

      // 2️⃣ Add to users_voucher_list and decrease points in a batch
      const batch = firebase.firestore().batch();

      for (let i = 0; i < qty; i++) {
        const docRef = firebase
          .firestore()
          .collection("users_voucher_list")
          .doc();
        batch.set(docRef, {
          user_id: userRef,
          voucher_id: voucherRef,
          history_id: historyRef, // Reference to voucher_history
          added_date: firebase.firestore.Timestamp.now(),
          redeem: false,
          redeem_date: null,
        });
      }

      // Decrease user points
      batch.update(userRef, {
        points: firebase.firestore.FieldValue.increment(-totalPoints),
      });

      // Commit batch
      await batch.commit();

      // 3️⃣ Remove from cart
      if (cartId) {
        await firebase
          .firestore()
          .collection("cart_items")
          .doc(cartId)
          .delete();
        const cartItemEl = document.getElementById(`cartItem-${cartId}`);
        if (cartItemEl) cartItemEl.remove();
      }

      alert(`Purchased ${qty} x ${voucher.title} successfully!`);
      overlay.remove();
    } catch (err) {
      console.error("Error during checkout:", err);
      alert("Failed to complete checkout: " + err.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const auth = firebase.auth();
  const historyListEl = document.getElementById("voucher_list");

  // --- PDF Function ---
  function generateVoucherPDF(voucher, data, docId, imgBase64) {
    const { jsPDF } = window.jspdf;
    const docPDF = new jsPDF();

    // Header
    docPDF.setFontSize(20);
    docPDF.text("Voucher ID for Redemption", 20, 20);

    docPDF.setFontSize(10);
    docPDF.text(`ID: ${docId}`, 20, 28);

    let y = 40;

    // Voucher image
    if (imgBase64.startsWith("data:image")) {
      docPDF.addImage(imgBase64, "PNG", 20, y, 50, 50);
    }

    // Details
    y += 60;
    docPDF.setFontSize(14);
    docPDF.text(voucher.title, 20, y);
    y += 10;

    if (voucher.description) {
      docPDF.setFontSize(12);
      docPDF.text(voucher.description, 20, y);
      y += 10;
    }

    docPDF.text(`Added Date: ${data.addedDate}`, 20, y);
    y += 8;
    docPDF.text(`Redeem Date: ${data.redeemDate}`, 20, y);
    y += 8;
    docPDF.text(`Status: ${data.statusText}`, 20, y);

    // Footer
    y += 20;
    docPDF.setFontSize(10);
    docPDF.text("Thank you for using our voucher system!", 20, y);

    docPDF.save(`${voucher.title}-voucher.pdf`);
  }

  // --- Voucher Card Function ---
  async function createVoucherCard(voucher, data, docId, index) {
    const div = document.createElement("div");
    div.id = `voucher-${docId}`;
    div.className = "voucher-item";
    div.style.display = "flex";
    div.style.alignItems = "flex-start";
    div.style.gap = "15px";
    div.style.marginBottom = "15px";

    // Add visible box styles
    div.style.border = "1px solid #ccc";
    div.style.borderRadius = "10px";
    div.style.padding = "15px";
    div.style.background = "#fff";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

    // Load image
    let imgSrc = "assets/giftcard.jpg";
    if (voucher.image) {
      try {
        const res = await fetch(`http://localhost:3000/image/${voucher.image}`);
        const imgData = await res.json();
        if (imgData.success) imgSrc = imgData.base64;
      } catch (err) {
        console.error("Error loading voucher image:", err);
      }
    }

    div.innerHTML = `

    <!-- Image -->
    <img src="${imgSrc}" alt="Voucher Image" 
         style="width:80px; height:80px; border-radius:8px; object-fit:cover;">

    <!-- Details -->
    <div class="voucher-details" style="flex:1;">
      <h3 style="margin:0 0 5px 0;">${voucher.title}</h3>
      <p style="margin:0 0 5px 0;">${voucher.description || ""}</p>
      <p><strong>Added Date:</strong> ${data.addedDate}</p>
      <p><strong>Redeem Date:</strong> ${data.redeemDate}</p>
      <p><strong>Status:</strong> ${data.statusText}</p>

      <div class="voucher-buttons" 
           style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button class="print-btn">🖨️ Print PDF</button>
      </div>
    </div>
  `;

    // Print PDF
    div.querySelector(".print-btn").addEventListener("click", () => {
      generateVoucherPDF(voucher, data, docId, imgSrc);
    });

    // Remove
    // div.querySelector(".remove-btn").addEventListener("click", async () => {
    //   if (confirm("Remove this voucher from your list?")) {
    //     await db.collection("users_voucher_list").doc(docId).delete();
    //     div.remove();
    //   }
    // });

    return div;
  }

  // --- MAIN FIREBASE LOGIC ---
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      historyListEl.innerHTML = "<p>Please log in to view your vouchers.</p>";
      return;
    }

    try {
      // Build the reference to this user’s document
      const userRef = db.collection("users").doc(user.uid);

      // Query vouchers where user_id == that reference
      const snapshot = await db
        .collection("users_voucher_list")
        .where("user_id", "==", userRef)
        .get();

      if (snapshot.empty) {
        historyListEl.innerHTML = "<p>You have no vouchers yet.</p>";
        return;
      }

      historyListEl.innerHTML = "";

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // voucher_id is also a reference
        const voucherRef = data.voucher_id;
        let voucher = {
          title: "Unknown Voucher",
          description: "",
        };

        if (voucherRef) {
          const voucherDoc = await voucherRef.get();
          if (voucherDoc.exists) voucher = voucherDoc.data();
        }

        const formattedData = {
          addedDate: data.added_date?.toDate().toLocaleString() || "N/A",
          redeemDate: data.redeem_date?.toDate().toLocaleString() || "N/A",
          statusText: data.redeem ? "Used" : "Not Used",
        };

        const card = await createVoucherCard(voucher, formattedData, doc.id);
        historyListEl.appendChild(card);
      }
    } catch (err) {
      console.error("Error loading vouchers:", err);
      historyListEl.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    }
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const auth = firebase.auth();
  const historyListEl = document.getElementById("history-list");

  // --- PDF Function (with image) ---
  // --- PDF Function (with image & full details) ---
  function generateReceiptPDF(voucher, data, docId, imgBase64) {
    const { jsPDF } = window.jspdf;
    const docPDF = new jsPDF();

    // Header
    docPDF.setFontSize(20);
    docPDF.text("Voucher Receipt", 20, 20);

    docPDF.setFontSize(10);
    docPDF.text(`Receipt ID: ${docId}`, 20, 28);

    let y = 40;

    // Voucher image
    if (imgBase64 && imgBase64.startsWith("data:image")) {
      docPDF.addImage(imgBase64, "PNG", 20, y, 50, 50);
    }

    // Move Y after image
    y += imgBase64 ? 60 : 20;

    // Voucher Details
    docPDF.setFontSize(14);
    docPDF.text(voucher.title || "Voucher", 20, y);
    y += 10;

    if (voucher.description) {
      docPDF.setFontSize(12);
      docPDF.text(voucher.description, 20, y, { maxWidth: 170 });
      y += 15;
    }

    docPDF.setFontSize(11);
    docPDF.text(`Completed Date: ${data.completedDate}`, 20, y);
    y += 8;
    docPDF.text(`Quantity: ${data.quantity}`, 20, y);
    y += 8;
    docPDF.text(`Total Points: ${data.totalPoints}`, 20, y);
    y += 8;

    // Extra voucher fields
    if (voucher.points) {
      docPDF.text(`Points per voucher: ${voucher.points}`, 20, y);
      y += 8;
    }
    if (voucher.category_id) {
      docPDF.text(
        `Category: ${voucher.category_id.path || voucher.category_id}`,
        20,
        y
      );
      y += 8;
    }
    if (voucher.is_latest) {
      docPDF.text(`Latest: ${voucher.is_latest}`, 20, y);
      y += 8;
    }

    // Terms & Conditions
    if (voucher.terms_and_condition) {
      y += 10;
      docPDF.setFontSize(12);
      docPDF.text("Terms & Conditions:", 20, y);
      y += 8;
      docPDF.setFontSize(10);

      // Multi-line terms wrapping
      const terms = docPDF.splitTextToSize(voucher.terms_and_condition, 170);
      docPDF.text(terms, 20, y);
      y += terms.length * 6;
    }

    // Footer
    y += 20;
    docPDF.setFontSize(10);
    docPDF.text("✅ Thank you for redeeming!", 20, y);

    // Save PDF
    docPDF.save(`${voucher.title}-receipt.pdf`);
  }

  // --- Voucher History Card (with image) ---
  async function createHistoryCard(voucher, data, docId) {
    const div = document.createElement("div");
    div.className = "voucher-item";
    div.style.border = "1px solid #ccc";
    div.style.borderRadius = "10px";
    div.style.padding = "15px";
    div.style.marginBottom = "15px";
    div.style.background = "#fff";
    div.style.display = "flex";
    div.style.gap = "15px";

    // Load image (default placeholder if none)
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
      <div style="flex:1;">
        <h3 style="margin:0 0 8px 0;">${voucher.title}</h3>
        <p style="margin:0 0 4px 0;">${voucher.description || ""}</p>
        <p><strong>Completed Date:</strong> ${data.completedDate}</p>
        <p><strong>Quantity:</strong> ${data.quantity}</p>
        <p><strong>Total Points:</strong> ${data.totalPoints}</p>

        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="print-btn">🖨️ Print Receipt</button>
        </div>
      </div>
    `;

    // Print button event
    div.querySelector(".print-btn").addEventListener("click", () => {
      generateReceiptPDF(voucher, data, docId, imgSrc);
    });

    return div;
  }

  // --- MAIN FIREBASE LOGIC ---
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      historyListEl.innerHTML =
        "<p>Please log in to view your voucher history.</p>";
      return;
    }

    try {
      const userRef = db.collection("users").doc(user.uid);

      const snapshot = await db
        .collection("voucher_history")
        .where("user_id", "==", userRef)
        .get();

      if (snapshot.empty) {
        historyListEl.innerHTML = "<p>No voucher history found.</p>";
        return;
      }

      historyListEl.innerHTML = "";

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Load voucher info
        let voucher = { title: "Unknown Voucher", description: "" };
        if (data.voucher_id) {
          const voucherDoc = await data.voucher_id.get();
          if (voucherDoc.exists) voucher = voucherDoc.data();
        }

        const formattedData = {
          completedDate:
            data.completed_date?.toDate().toLocaleString() || "N/A",
          quantity: data.quantity || 0,
          totalPoints: data.total_points || 0,
        };

        const card = await createHistoryCard(voucher, formattedData, doc.id);
        historyListEl.appendChild(card);
      }
    } catch (err) {
      console.error("Error loading voucher history:", err);
      historyListEl.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    }
  });
});

/* ==========================================================================
   Razorpay payment. The frontend only receives the public key and the order id
   from the backend. The backend verifies the signature and confirms the booking.
   ========================================================================== */

async function startPayment(data, msgEl) {
  try {
    // 1. Backend re-checks availability, calculates the amount and creates the order
    const order = await apiPost("/api/payment/create-order", {
      roomType: data.roomType,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      adults: data.adults,
      children: data.children,
      numberOfRooms: data.numberOfRooms,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
    });

    // 2. Open Razorpay Checkout
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: SITE_CONFIG.resortName,
      description: `${data.roomType} room - ${data.numberOfRooms} room(s)`,
      order_id: order.orderId,
      prefill: {
        name: data.customerName,
        email: data.email,
        contact: data.phone,
      },
      theme: { color: "#3c2b21" },

      // 3. Payment response -> backend verification
      handler: async function (response) {
        showMessage(msgEl, "Verifying payment...", "");
        try {
          const result = await apiPost("/api/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          showConfirmation(result.booking, result.emailSent);
        } catch (err) {
          showFailure(err.message, order.orderId);
        }
      },

      modal: {
        ondismiss: function () {
          showMessage(msgEl, "Payment was cancelled. You can try again.", "error");
        },
      },
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", async function () {
      await apiPost("/api/payment/failed", { orderId: order.orderId }).catch(() => {});
      showFailure("The payment could not be completed. Your booking has not been confirmed.", order.orderId);
    });

    rzp.open();
    showMessage(msgEl, "Complete the payment in the Razorpay window.", "");
  } catch (err) {
    showMessage(msgEl, err.message, "error");
  }
}

// Booking confirmed screen (data comes from MongoDB via the backend)
function showConfirmation(booking, emailSent) {
  window.__lastBooking = booking;
  document.getElementById("bookingSteps").classList.add("hidden");
  const box = document.getElementById("resultSection");
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="panel">
      <p class="eyebrow">Thank you</p>
      <h2>Booking Confirmed</h2>
      <table class="summary-table" style="margin-top:16px">
        <tr><th>Booking ID</th><td><strong>${booking.bookingId}</strong></td></tr>
        <tr><th>Guest name</th><td>${booking.customerName}</td></tr>
        <tr><th>Room</th><td>${booking.roomType} (${booking.numberOfRooms} room(s))</td></tr>
        <tr><th>Check-in</th><td>${formatDate(booking.checkIn)}</td></tr>
        <tr><th>Check-out</th><td>${formatDate(booking.checkOut)}</td></tr>
        <tr><th>Guests</th><td>${booking.adults} adults, ${booking.children} children</td></tr>
        <tr><th>Total amount</th><td>${money(booking.totalAmount)}</td></tr>
        <tr><th>Payment ID</th><td>${booking.razorpayPaymentId || "-"}</td></tr>
        <tr><th>Payment status</th><td>${booking.paymentStatus}</td></tr>
        <tr><th>Booking status</th><td>${booking.bookingStatus}</td></tr>
      </table>
      <p class="muted" style="margin-top:14px">${emailSent
        ? `A confirmation and payment receipt has been emailed to <strong>${booking.email}</strong>.`
        : `We could not email your receipt right now — please download it below and keep it safe.`}</p>
      <p class="muted">Please save your Booking ID and mention it in any communication with the resort.</p>
      <p class="muted">Payments are processed only through the authorised payment gateway configured by the resort.</p>
      <div class="card-actions">
        <button class="btn" type="button" onclick="downloadReceipt(window.__lastBooking)">Download Receipt</button>
        <a class="btn btn-outline" href="index.html">Back to Home</a>
        <a class="btn btn-outline" href="cancellation.html">Cancellation &amp; Refund Policy</a>
      </div>
    </div>`;
  box.scrollIntoView({ behavior: "smooth" });
}

// Payment failed screen
function showFailure(message, orderId) {
  const box = document.getElementById("resultSection");
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="panel">
      <h2>Payment Failed</h2>
      <p class="message error">${message}</p>
      <p class="muted">Your booking has not been confirmed. Reference order: ${orderId || "-"}</p>
      <div class="card-actions">
        <button class="btn" onclick="location.reload()">Try Again</button>
      </div>
    </div>`;
  box.scrollIntoView({ behavior: "smooth" });
}

// Download Receipt: opens a clean printable receipt; the browser's
// "Save as PDF" option in the print window saves it as a file.
function downloadReceipt(b) {
  if (!b) return;
  const rows = [
    ["Booking ID", b.bookingId], ["Guest name", b.customerName], ["Email", b.email], ["Phone", b.phone],
    ["Room", `${b.roomType} (${b.numberOfRooms} room(s))`], ["Check-in", formatDate(b.checkIn)],
    ["Check-out", formatDate(b.checkOut)], ["Nights", b.numberOfNights],
    ["Guests", `${b.adults} adults, ${b.children} children`], ["Room charges", money(b.roomCharges)],
    ["Tax", money(b.tax)], ["Total paid", money(b.totalAmount)], ["Payment ID", b.razorpayPaymentId || "-"],
    ["Order ID", b.razorpayOrderId || "-"], ["Payment status", b.paymentStatus], ["Booking status", b.bookingStatus],
    ["Receipt date", formatDate(new Date())],
  ];
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${b.bookingId}</title>
    <style>body{font-family:Georgia,serif;color:#3c2b21;max-width:680px;margin:30px auto;padding:0 20px}
    h1{margin:0;font-size:26px}p{color:#6b5c4f}table{width:100%;border-collapse:collapse;margin-top:18px}
    th,td{border:1px solid #e5ddd0;padding:8px 10px;text-align:left;font-size:14px}th{background:#faf6ef;width:40%}
    .bar{margin-top:20px}@media print{.bar{display:none}}</style></head><body>
    <h1>${SITE_CONFIG.resortName}</h1><p>${SITE_CONFIG.address || ""}<br>${SITE_CONFIG.phone || ""} · ${SITE_CONFIG.email || ""}</p>
    <h2>Booking Confirmation &amp; Payment Receipt</h2>
    <table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</table>
    <p style="font-size:13px">Payments are processed only through the authorised payment gateway configured by the resort.</p>
    <div class="bar"><button onclick="window.print()">Download / Print</button></div>
    <script>window.onload=function(){window.print()}<\/script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to download your receipt."); return; }
  w.document.write(html);
  w.document.close();
}

import nodemailer from "nodemailer";

let transporter;
function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t || !to) return { skipped: true, reason: !to ? "missing-recipient" : "smtp-not-configured" };
  return t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });
}

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function verifyEmailTransport() {
  const t = getTransporter();
  if (!t) {
    return {
      ok: false,
      configured: false,
      reason: "SMTP is not configured. Add SMTP_HOST, SMTP_USER and SMTP_PASS to backend/.env."
    };
  }
  try {
    await t.verify();
    return { ok: true, configured: true };
  } catch (error) {
    return { ok: false, configured: true, reason: error.message };
  }
}

export async function sendOrderConfirmationEmail({ to, name, order, restaurant, paymentMethod }) {
  if (!to) return { skipped: true, reason: "missing-recipient" };

  const items = (order.items || []).map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee">${item.name} × ${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">₹${Number(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  const paymentLabel = paymentMethod === "online" ? "Online payment" : "Cash on Delivery";
  const total = Number(order.pricing?.total || 0).toFixed(2);

  return sendEmail({
    to,
    subject: `FoodGo Order Confirmed — #${order._id}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#222">
        <div style="padding:24px 0">
          <h1 style="margin:0;color:#ff5a1f">FoodGo</h1>
          <p style="color:#666;margin-top:6px">Smart food delivery</p>
        </div>
        <div style="border:1px solid #eee;border-radius:16px;padding:24px">
          <h2 style="margin-top:0">Order confirmed 🎉</h2>
          <p>Hello ${name || "Customer"},</p>
          <p>Your order <strong>#${order._id}</strong> from <strong>${restaurant?.name || "FoodGo Restaurant"}</strong> has been successfully placed.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">${items}</table>
          <p style="margin:6px 0"><strong>Payment:</strong> ${paymentLabel}</p>
          <p style="margin:6px 0"><strong>Order total:</strong> ₹${total}</p>
          <p style="margin:6px 0"><strong>Estimated delivery:</strong> ${restaurant?.deliveryTime || 30} minutes</p>
          <p style="margin-top:22px">You can track your order from the FoodGo Orders page.</p>
        </div>
        <p style="font-size:12px;color:#888;text-align:center;margin-top:18px">This is an automated FoodGo order confirmation.</p>
      </div>
    `
  });
}

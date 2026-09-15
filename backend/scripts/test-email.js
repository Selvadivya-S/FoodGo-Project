import "dotenv/config";
import { sendEmail, verifyEmailTransport } from "../src/services/email.service.js";

const to = process.argv[2] || process.env.SMTP_USER;
if (!to) {
  console.error("Usage: node scripts/test-email.js your-email@example.com");
  process.exit(1);
}

const status = await verifyEmailTransport();
if (!status.ok) {
  console.error(`Email setup failed: ${status.reason}`);
  process.exit(1);
}

try {
  const info = await sendEmail({
    to,
    subject: "FoodGo email test",
    html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#ff5a1f">FoodGo email is working 🎉</h2><p>This is a test message from your local FoodGo backend.</p></div>`
  });
  console.log(`Test email sent to ${to}. Message ID: ${info.messageId || "n/a"}`);
} catch (error) {
  console.error(`Could not send test email: ${error.message}`);
  process.exit(1);
}

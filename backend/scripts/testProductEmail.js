import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const testEmailConfig = async () => {
  console.log("=== TESTING EMAIL CONFIGURATION ===");

  // Check environment variables
  console.log("Environment variables:");
  console.log("MAIL_SERVICE:", process.env.MAIL_SERVICE);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "***SET***" : "NOT SET");

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "❌ EMAIL_USER or EMAIL_PASS not set in environment variables"
    );
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("✅ Transporter created successfully");

    // Verify configuration
    console.log("Verifying email configuration...");
    await transporter.verify();
    console.log("✅ Email configuration verified successfully");

    // Send test email
    console.log("Sending test email...");
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: "🧪 Test Email - Inventory System",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email from your inventory management system.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>
          <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
          <p>If you receive this email, your email configuration is working correctly!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(testMailOptions);
    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Check your email inbox for the test message");
  } catch (error) {
    console.error("❌ Email test failed:", error);

    if (error.code === "EAUTH") {
      console.error("Authentication failed. Please check:");
      console.error("1. Email and password are correct");
      console.error('2. "Less secure app access" is enabled (for Gmail)');
      console.error(
        "3. Use App Password instead of regular password (recommended)"
      );
    }
  }
};

// Run the test
testEmailConfig();

import nodemailer from "nodemailer";
import User from "../models/UserModel.js";

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email template for ROP notification
const createROPEmailTemplate = (products, isAdmin = false) => {
  const productList = products
    .map((product) => {
      const ropData = product.rop;
      return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; border: 1px solid #ddd;">${product.name}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${product.currentStock}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${ropData.rop}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${ropData.leadTime} hari</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${ropData.dailyDemand}</td>
        ${isAdmin ? `<td style="padding: 12px; border: 1px solid #ddd;">${product.createdBy?.name || "N/A"}</td>` : ""}
      </tr>
    `;
    })
    .join("");

  const recipientText = isAdmin ? "Administrator" : "User";
  const introText =
    products.length === 1
      ? `Produk ${products[0].name} perlu dilakukan reorder karena stok saat ini (${products[0].currentStock}) sudah mencapai atau di bawah Reorder Point (${products[0].rop.rop}).`
      : `Terdapat ${products.length} produk yang perlu dilakukan reorder karena stok sudah mencapai atau di bawah Reorder Point.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Notifikasi Reorder Point (ROP)</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center;">🚨 Notifikasi Reorder Point</h1>
        <p style="color: white; text-align: center; margin: 10px 0 0 0; font-size: 16px;">Sistem Manajemen Inventori</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">Kepada ${recipientText},</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">${introText}</p>
        <p style="font-size: 14px; color: #6c757d;">
          <strong>Waktu Notifikasi:</strong> ${new Date().toLocaleString(
            "id-ID",
            {
              timeZone: "Asia/Jakarta",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          )}
        </p>
      </div>

      <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
        <h3 style="background: #e9ecef; margin: 0; padding: 15px; color: #495057;">Detail Produk yang Perlu Reorder</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Nama Produk</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Stok Saat Ini</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">ROP</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Lead Time</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Daily Demand</th>
              ${isAdmin ? '<th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Dibuat Oleh</th>' : ""}
            </tr>
          </thead>
          <tbody>
            ${productList}
          </tbody>
        </table>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #856404; margin-top: 0;">💡 Informasi Penting:</h4>
        <ul style="color: #856404; margin: 0;">
          <li><strong>ROP (Reorder Point)</strong> adalah titik minimum stok dimana pemesanan ulang harus dilakukan</li>
          <li><strong>Lead Time</strong> adalah waktu yang dibutuhkan dari pemesanan hingga barang diterima</li>
          <li><strong>Daily Demand</strong> adalah rata-rata kebutuhan harian produk</li>
          <li>Segera lakukan pemesanan untuk menghindari kehabisan stok</li>
        </ul>
      </div>

      <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #0c5460; margin-top: 0;">📋 Tindakan yang Perlu Dilakukan:</h4>
        <ol style="color: #0c5460; margin: 0;">
          <li>Periksa stok fisik untuk memastikan data akurat</li>
          <li>Hubungi supplier untuk melakukan pemesanan</li>
          <li>Update sistem setelah melakukan pemesanan</li>
          <li>Monitor kedatangan barang sesuai lead time</li>
        </ol>
      </div>

      <div style="text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #dee2e6;">
        <p style="margin: 0; font-size: 14px;">
          Email ini dikirim secara otomatis oleh Sistem Manajemen Inventori<br>
          Jangan membalas email ini. Untuk pertanyaan, hubungi administrator sistem.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px;">
          © 2025 Sistem Manajemen Inventori. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
};

// Send ROP notification to admin (all users with role 'pemilik')
export const notifyAdminROP = async (products) => {
  try {
    console.log("Starting admin ROP notification process...");

    // Get all admin users (pemilik)
    const adminUsers = await User.find({ role: "pemilik" })
      .select("name email")
      .lean();

    if (adminUsers.length === 0) {
      console.log("No admin users found");
      return {
        success: false,
        error: "No admin users found",
        recipientCount: 0,
      };
    }

    console.log(`Found ${adminUsers.length} admin users`);

    const transporter = createTransporter();
    const emailTemplate = createROPEmailTemplate(products, true);

    // Prepare email recipients
    const recipients = adminUsers.map((admin) => admin.email).join(", ");

    const mailOptions = {
      from: `"Sistem Inventori" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `🚨 Notifikasi ROP - ${products.length} Produk Perlu Reorder`,
      html: emailTemplate,
    };

    console.log(`Sending admin email to: ${recipients}`);
    const result = await transporter.sendMail(mailOptions);

    console.log("Admin email sent successfully:", result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipientCount: adminUsers.length,
      recipients: adminUsers.map((admin) => ({
        name: admin.name,
        email: admin.email,
      })),
    };
  } catch (error) {
    console.error("Error sending admin ROP notification:", error);
    return {
      success: false,
      error: error.message,
      recipientCount: 0,
    };
  }
};

// Send ROP notification to specific user (product creator)
export const notifyUserROP = async (product, user) => {
  try {
    console.log(`Starting user ROP notification for ${user.email}...`);

    if (!user.email) {
      return {
        success: false,
        error: "User email not provided",
        recipient: null,
      };
    }

    const transporter = createTransporter();
    const emailTemplate = createROPEmailTemplate([product], false);

    const mailOptions = {
      from: `"Sistem Inventori" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🚨 Notifikasi ROP - Produk "${product.name}" Perlu Reorder`,
      html: emailTemplate,
    };

    console.log(`Sending user email to: ${user.email}`);
    const result = await transporter.sendMail(mailOptions);

    console.log("User email sent successfully:", result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipient: {
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Error sending user ROP notification:", error);
    return {
      success: false,
      error: error.message,
      recipient: {
        name: user.name,
        email: user.email,
      },
    };
  }
};

// Test email function for debugging
export const sendTestEmail = async (to = process.env.EMAIL_USER) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Sistem Inventori Test" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "✅ Test Email - Sistem Inventori",
      html: `
        <h2>Test Email Berhasil!</h2>
        <p>Jika Anda menerima email ini, berarti konfigurasi email sudah benar.</p>
        <p><strong>Waktu:</strong> ${new Date().toLocaleString("id-ID")}</p>
        <p><strong>Dari:</strong> ${process.env.EMAIL_USER}</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Test email sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      recipient: to,
    };
  } catch (error) {
    console.error("Error sending test email:", error);
    return {
      success: false,
      error: error.message,
      recipient: to,
    };
  }
};

console.log("Email Service loaded successfully");

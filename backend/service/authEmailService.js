import nodemailer from "nodemailer";

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Create password reset email template
const createPasswordResetEmailTemplate = (user, resetCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password - Sistem Inventori</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center;">🔐 Reset Password</h1>
        <p style="color: white; text-align: center; margin: 10px 0 0 0; font-size: 16px;">Sistem Manajemen Inventori</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">Halo ${user.name},</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">
          Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode verifikasi di bawah ini 
          untuk mengatur password baru Anda.
        </p>
        <p style="font-size: 14px; color: #6c757d;">
          <strong>Waktu Permintaan:</strong> ${new Date().toLocaleString(
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

      <div style="text-align: center; margin: 30px 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 20px; border-radius: 15px; 
                    display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">🔑 Kode Reset Password</h3>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                      background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
            ${resetCode}
          </div>
        </div>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #856404; margin-top: 0;">⚠️ Penting untuk Diketahui:</h4>
        <ul style="color: #856404; margin: 0;">
          <li>Kode reset password ini akan <strong>expired dalam 15 menit</strong></li>
          <li>Kode ini hanya dapat digunakan <strong>satu kali</strong></li>
          <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
          <li>Password lama Anda masih aktif sampai Anda menggantinya</li>
        </ul>
      </div>

      <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #0c5460; margin-top: 0;">📝 Cara Menggunakan:</h4>
        <ol style="color: #0c5460; margin: 0;">
          <li>Buka halaman reset password di aplikasi</li>
          <li>Masukkan email Anda: <strong>${user.email}</strong></li>
          <li>Masukkan kode verifikasi: <strong>${resetCode}</strong></li>
          <li>Buat password baru yang kuat</li>
          <li>Konfirmasi password baru Anda</li>
        </ol>
      </div>

      <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #721c24; margin-top: 0;">🛡️ Keamanan Akun:</h4>
        <p style="color: #721c24; margin: 0; font-size: 14px;">
          Jika Anda tidak meminta reset password, kemungkinan ada yang mencoba mengakses akun Anda. 
          Pastikan untuk menggunakan password yang kuat dan unik. Jika Anda mencurigai aktivitas yang tidak biasa, 
          segera hubungi administrator sistem.
        </p>
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

// Create welcome email template for new registrations
const createWelcomeEmailTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Selamat Datang - Sistem Inventori</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center;">🎉 Selamat Datang!</h1>
        <p style="color: white; text-align: center; margin: 10px 0 0 0; font-size: 16px;">Sistem Manajemen Inventori</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">Halo ${user.name},</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">
          Selamat datang di Sistem Manajemen Inventori! Akun Anda telah berhasil dibuat dan siap digunakan.
        </p>
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
          <h4 style="margin-top: 0; color: #495057;">Detail Akun:</h4>
          <p style="margin: 5px 0;"><strong>Nama:</strong> ${user.name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
        </div>
      </div>

      <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
        <h4 style="color: #155724; margin-top: 0;">✅ Langkah Selanjutnya:</h4>
        <ol style="color: #155724; margin: 0;">
          <li>Login ke sistem menggunakan email dan password Anda</li>
          <li>Lengkapi profil Anda jika diperlukan</li>
          <li>Mulai gunakan fitur-fitur yang tersedia</li>
          <li>Hubungi administrator jika membutuhkan bantuan</li>
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

// Send password reset email
export const sendPasswordResetEmail = async (user, resetCode) => {
  try {
    const transporter = createEmailTransporter();
    const emailTemplate = createPasswordResetEmailTemplate(user, resetCode);

    const mailOptions = {
      from: `"Sistem Inventori" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔐 Kode Reset Password - Sistem Inventori",
      html: emailTemplate,
    };

    console.log(`Sending password reset email to: ${user.email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      recipient: user.email,
    };
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Send welcome email for new user registration
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createEmailTransporter();
    const emailTemplate = createWelcomeEmailTemplate(user);

    const mailOptions = {
      from: `"Sistem Inventori" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🎉 Selamat Datang di Sistem Inventori",
      html: emailTemplate,
    };

    console.log(`Sending welcome email to: ${user.email}`);
    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      recipient: user.email,
    };
  } catch (error) {
    console.error("Welcome email send error:", error);
    // Don't throw error for welcome email to avoid blocking registration
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send test email (for debugging purposes)
export const sendTestEmail = async (email, resetCode = "123456") => {
  try {
    // Create a mock user object for testing
    const mockUser = {
      name: "Test User",
      email: email,
      role: "test",
    };

    const transporter = createEmailTransporter();
    const emailTemplate = createPasswordResetEmailTemplate(mockUser, resetCode);

    const mailOptions = {
      from: `"Sistem Inventori Test" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🧪 Test Kode Reset Password - Sistem Inventori",
      html: emailTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      "Test password reset email sent successfully:",
      result.messageId
    );

    return {
      success: true,
      messageId: result.messageId,
      recipient: email,
      testCode: resetCode,
    };
  } catch (error) {
    console.error("Error sending test email:", error);
    throw new Error(`Failed to send test email: ${error.message}`);
  }
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createEmailTransporter();
    const verified = await transporter.verify();

    if (verified) {
      console.log("Email transporter configuration verified successfully");
      return { success: true, message: "Email configuration is valid" };
    }
  } catch (error) {
    console.error("Email configuration error:", error);
    return {
      success: false,
      message: "Email configuration failed",
      error: error.message,
    };
  }
};

console.log("Auth Email Service loaded successfully");

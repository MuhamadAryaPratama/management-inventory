import nodemailer from "nodemailer";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";

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

// Helper function to send low stock notification email
const sendLowStockNotification = async (product) => {
  try {
    console.log(`=== SENDING EMAIL FOR PRODUCT: ${product.name} ===`);

    // Get all users with 'pemilik' role
    const pemilikUsers = await User.find({ role: "pemilik" }).select(
      "name email role"
    );
    console.log(`Found ${pemilikUsers.length} pemilik users:`, pemilikUsers);

    if (pemilikUsers.length === 0) {
      console.log("No pemilik users found to send low stock notification");
      throw new Error("No pemilik users found");
    }

    const transporter = createEmailTransporter();
    console.log("Email transporter created successfully");

    // Populate product details for email
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("supplier", "name");

    console.log("Product populated:", {
      name: populatedProduct.name,
      currentStock: populatedProduct.currentStock,
      minStock: populatedProduct.minStock,
      category: populatedProduct.category?.name,
      supplier: populatedProduct.supplier?.name,
    });

    const emailSubject = `⚠️ Low Stock Alert - ${populatedProduct.name}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .alert-box { background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; }
          .product-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .stock-info { display: flex; justify-content: space-between; margin: 10px 0; }
          .stock-current { color: #f44336; font-weight: bold; }
          .stock-min { color: #ff9800; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Low Stock Alert</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Attention Required!</strong> One of your products has fallen below the minimum stock level.
            </div>
            
            <div class="product-details">
              <h2>${populatedProduct.name}</h2>
              <p><strong>Category:</strong> ${populatedProduct.category?.name || "N/A"}</p>
              <p><strong>Supplier:</strong> ${populatedProduct.supplier?.name || "N/A"}</p>
              
              <div class="stock-info">
                <span>Current Stock: <span class="stock-current">${populatedProduct.currentStock}</span></span>
                <span>Minimum Stock: <span class="stock-min">${populatedProduct.minStock}</span></span>
              </div>
              
              ${populatedProduct.description ? `<p><strong>Description:</strong> ${populatedProduct.description}</p>` : ""}
            </div>
            
            <p><strong>Action Required:</strong> Please consider restocking this item to maintain adequate inventory levels.</p>
            
            <div class="footer">
              <p>This is an automated notification from your Inventory Management System.</p>
              <p>Date: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to each pemilik
    const emailPromises = [];
    for (const pemilik of pemilikUsers) {
      console.log(`Preparing email for: ${pemilik.name} (${pemilik.email})`);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: pemilik.email,
        subject: emailSubject,
        html: emailHtml,
      };

      console.log("Mail options:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      emailPromises.push(
        transporter
          .sendMail(mailOptions)
          .then(() => {
            console.log(
              `✅ Low stock notification sent successfully to ${pemilik.name} (${pemilik.email})`
            );
            return { recipient: pemilik.email, status: "success" };
          })
          .catch((error) => {
            console.error(
              `❌ Failed to send email to ${pemilik.email}:`,
              error
            );
            return {
              recipient: pemilik.email,
              status: "failed",
              error: error.message,
            };
          })
      );
    }

    const results = await Promise.all(emailPromises);
    console.log("Email sending results:", results);

    return results;
  } catch (error) {
    console.error("Error sending low stock notification:", error);
    // Don't throw error to prevent disrupting the main operation
    return [];
  }
};

// Helper function to check if stock is low and send notification
const checkAndNotifyLowStock = async (product) => {
  try {
    if (product.currentStock < product.minStock && product.minStock > 0) {
      console.log(
        `Low stock detected for product: ${product.name} (Current: ${product.currentStock}, Min: ${product.minStock})`
      );
      await sendLowStockNotification(product);
    }
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
};

// Function to test email configuration
const testEmailConfiguration = async () => {
  try {
    console.log("Testing email configuration...");
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log("Email configuration is valid");
    return { valid: true };
  } catch (emailError) {
    console.error("Email configuration error:", emailError);
    return {
      valid: false,
      error: emailError.message,
    };
  }
};

// Function to check all products for low stock
const checkAllProductsLowStock = async () => {
  try {
    console.log("=== CHECKING ALL PRODUCTS FOR LOW STOCK ===");

    // Get all products to see what we have
    const allProducts = await Product.find({});
    console.log(`Total products in database: ${allProducts.length}`);

    // Log each product's stock info
    allProducts.forEach((product) => {
      console.log(
        `Product: ${product.name} | Current: ${product.currentStock} | Min: ${product.minStock} | Low Stock: ${product.currentStock < product.minStock}`
      );
    });

    // Check for users with 'pemilik' role
    const pemilikUsers = await User.find({ role: "pemilik" }).select(
      "name email role"
    );
    console.log(`Found ${pemilikUsers.length} pemilik users:`, pemilikUsers);

    if (pemilikUsers.length === 0) {
      throw new Error("No users with 'pemilik' role found in database");
    }

    // Find all products where current stock is less than minimum stock
    const lowStockProducts = await Product.find({
      $expr: { $lt: ["$currentStock", "$minStock"] },
      minStock: { $gt: 0 }, // Only check products that have a minimum stock set
    });

    console.log(`Found ${lowStockProducts.length} low stock products`);

    if (lowStockProducts.length === 0) {
      return {
        success: true,
        message: "No low stock products found",
        count: 0,
        products: [],
        emailResults: [],
        debug: {
          totalProducts: allProducts.length,
          productsWithMinStock: allProducts.filter((p) => p.minStock > 0)
            .length,
          lowStockCandidates: allProducts.filter(
            (p) => p.currentStock < p.minStock && p.minStock > 0
          ).length,
        },
      };
    }

    // Test email configuration first
    const emailTest = await testEmailConfiguration();
    if (!emailTest.valid) {
      throw new Error(`Email configuration error: ${emailTest.error}`);
    }

    // Send notification for each low stock product
    const emailResults = [];
    for (const product of lowStockProducts) {
      try {
        console.log(`Sending notification for product: ${product.name}`);
        const result = await sendLowStockNotification(product);
        emailResults.push({
          product: product.name,
          status: "sent",
          results: result,
        });
      } catch (emailError) {
        console.error(`Failed to send email for ${product.name}:`, emailError);
        emailResults.push({
          product: product.name,
          status: "failed",
          error: emailError.message,
        });
      }
    }

    return {
      success: true,
      message: `Low stock check completed for ${lowStockProducts.length} products`,
      count: lowStockProducts.length,
      products: lowStockProducts.map((p) => ({
        name: p.name,
        currentStock: p.currentStock,
        minStock: p.minStock,
      })),
      emailResults: emailResults,
      debug: {
        pemilikUsers: pemilikUsers.length,
        emailConfig: {
          service: process.env.MAIL_SERVICE,
          user: process.env.EMAIL_USER ? "Set" : "Not Set",
          pass: process.env.EMAIL_PASS ? "Set" : "Not Set",
        },
      },
    };
  } catch (error) {
    console.error("Check all low stock error:", error);
    return {
      success: false,
      message: error.message,
      error: error.stack,
    };
  }
};

export {
  sendLowStockNotification,
  checkAndNotifyLowStock,
  testEmailConfiguration,
  checkAllProductsLowStock,
  createEmailTransporter,
};

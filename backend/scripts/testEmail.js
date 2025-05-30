import dotenv from "dotenv";
import {
  sendTestEmail,
  notifyAdminROP,
  notifyUserROP,
} from "../service/emailService.js";

// Load environment variables
dotenv.config();

console.log("🧪 Testing Email Configuration...\n");

// Test basic email sending
const testBasicEmail = async () => {
  console.log("1. Testing basic email sending...");
  try {
    const result = await sendTestEmail();
    if (result.success) {
      console.log("✅ Basic email test passed!");
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Sent to: ${result.recipient}\n`);
    } else {
      console.log("❌ Basic email test failed!");
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error) {
    console.log("❌ Basic email test error!");
    console.log(`   Error: ${error.message}\n`);
  }
};

// Test ROP admin notification
const testAdminROPNotification = async () => {
  console.log("2. Testing Admin ROP notification...");

  // Mock data untuk testing
  const mockProducts = [
    {
      _id: "507f1f77bcf86cd799439011",
      name: "Test Product 1",
      currentStock: 5,
      createdBy: {
        name: "John Doe",
        email: "john@example.com",
      },
      rop: {
        rop: 10,
        leadTime: 7,
        dailyDemand: 2,
        lastCalculated: new Date(),
      },
    },
    {
      _id: "507f1f77bcf86cd799439012",
      name: "Test Product 2",
      currentStock: 3,
      createdBy: {
        name: "Jane Smith",
        email: "jane@example.com",
      },
      rop: {
        rop: 8,
        leadTime: 5,
        dailyDemand: 1.5,
        lastCalculated: new Date(),
      },
    },
  ];

  try {
    const result = await notifyAdminROP(mockProducts);
    if (result.success) {
      console.log("✅ Admin ROP notification test passed!");
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Recipients: ${result.recipientCount}`);
      console.log(
        `   Sent to: ${result.recipients?.map((r) => r.email).join(", ")}\n`
      );
    } else {
      console.log("❌ Admin ROP notification test failed!");
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error) {
    console.log("❌ Admin ROP notification test error!");
    console.log(`   Error: ${error.message}\n`);
  }
};

// Test user ROP notification
const testUserROPNotification = async () => {
  console.log("3. Testing User ROP notification...");

  const mockProduct = {
    _id: "507f1f77bcf86cd799439013",
    name: "Test Product 3",
    currentStock: 2,
    rop: {
      rop: 15,
      leadTime: 10,
      dailyDemand: 3,
      lastCalculated: new Date(),
    },
  };

  const mockUser = {
    name: "Test User",
    email: process.env.EMAIL_USER, // Kirim ke email kita sendiri untuk testing
  };

  try {
    const result = await notifyUserROP(mockProduct, mockUser);
    if (result.success) {
      console.log("✅ User ROP notification test passed!");
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Sent to: ${result.recipient.email}\n`);
    } else {
      console.log("❌ User ROP notification test failed!");
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error) {
    console.log("❌ User ROP notification test error!");
    console.log(`   Error: ${error.message}\n`);
  }
};

// Function to check environment variables
const checkEnvironmentVariables = () => {
  console.log("🔍 Checking environment variables...");

  const requiredVars = ["EMAIL_USER", "EMAIL_PASS", "MAIL_SERVICE"];
  const missingVars = [];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      console.log(
        `✅ ${varName}: ${varName === "EMAIL_PASS" ? "***hidden***" : process.env[varName]}`
      );
    }
  });

  if (missingVars.length > 0) {
    console.log(`❌ Missing environment variables: ${missingVars.join(", ")}`);
    console.log("Please check your .env file\n");
    return false;
  } else {
    console.log("✅ All required environment variables are set\n");
    return true;
  }
};

// Main test function
const runAllTests = async () => {
  console.log("=".repeat(50));
  console.log("📧 EMAIL CONFIGURATION TEST");
  console.log("=".repeat(50));

  // Check environment variables first
  const envCheck = checkEnvironmentVariables();
  if (!envCheck) {
    console.log("❌ Please fix environment variables before running tests");
    return;
  }

  // Run tests
  await testBasicEmail();
  await testAdminROPNotification();
  await testUserROPNotification();

  console.log("=".repeat(50));
  console.log("🎉 Email testing completed!");
  console.log("=".repeat(50));
};

// Run the tests
runAllTests().catch(console.error);

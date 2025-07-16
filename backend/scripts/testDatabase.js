// testDatabase.js - Script untuk test database dan user roles
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Simple User model for testing
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});

const User = mongoose.model("Users", UserSchema);

// Simple Product model for testing
const ProductSchema = new mongoose.Schema({
  name: String,
  currentStock: Number,
  minStock: Number,
  price: Number,
});

const Product = mongoose.model("Products", ProductSchema);

const testDatabase = async () => {
  try {
    console.log("=== TESTING DATABASE CONNECTION ===");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");

    // Test 1: Check all users and their roles
    console.log("\n=== CHECKING USERS ===");
    const allUsers = await User.find({}).select("name email role");
    console.log(`Total users in database: ${allUsers.length}`);

    allUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Test 2: Check specifically for 'pemilik' users
    const pemilikUsers = await User.find({ role: "pemilik" }).select(
      "name email role"
    );
    console.log(`\n📋 Users with 'pemilik' role: ${pemilikUsers.length}`);

    if (pemilikUsers.length === 0) {
      console.log("❌ NO PEMILIK USERS FOUND!");
      console.log(
        '💡 Solution: Create a user with role "pemilik" in your database'
      );

      // Suggest creating a pemilik user
      console.log("\n🔧 To create a pemilik user, you can:");
      console.log("1. Use your user registration endpoint");
      console.log("2. Or manually update a user in MongoDB:");
      console.log(
        '   db.users.updateOne({email: "your-email@example.com"}, {$set: {role: "pemilik"}})'
      );
    } else {
      pemilikUsers.forEach((user) => {
        console.log(`✅ ${user.name} (${user.email})`);
      });
    }

    // Test 3: Check products with low stock
    console.log("\n=== CHECKING PRODUCTS FOR LOW STOCK ===");
    const allProducts = await Product.find({});
    console.log(`Total products in database: ${allProducts.length}`);

    const lowStockProducts = allProducts.filter(
      (p) => p.currentStock < p.minStock && p.minStock > 0
    );
    console.log(`Products with low stock: ${lowStockProducts.length}`);

    if (lowStockProducts.length === 0) {
      console.log("❌ NO LOW STOCK PRODUCTS FOUND!");
      console.log(
        "💡 To test email notifications, create a product where currentStock < minStock"
      );
      console.log("   Example: currentStock: 5, minStock: 10");
    } else {
      lowStockProducts.forEach((product) => {
        console.log(
          `⚠️  ${product.name} - Current: ${product.currentStock}, Min: ${product.minStock}`
        );
      });
    }

    // Test 4: Show sample data for testing
    console.log("\n=== SAMPLE DATA FOR TESTING ===");
    console.log("To test low stock notifications, ensure you have:");
    console.log('1. At least one user with role "pemilik"');
    console.log("2. At least one product where currentStock < minStock");
    console.log("3. Valid email configuration in .env file");

    await mongoose.disconnect();
    console.log("\n✅ Database test completed");
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
};

// Run the test
testDatabase();

import ROP from "../models/RopModel.js";
import Product from "../models/ProductModel.js";
import User from "../models/UserModel.js";
import asyncHandler from "express-async-handler";
import { notifyAdminROP, notifyUserROP } from "../service/emailService.js";

export const calculateROP = asyncHandler(async (req, res) => {
  const { product, leadTime, dailyDemand } = req.body;

  // Validate input
  if (!product || !leadTime || !dailyDemand) {
    res.status(400);
    throw new Error("Product, lead time, and daily demand are required");
  }

  if (leadTime <= 0 || dailyDemand <= 0) {
    res.status(400);
    throw new Error("Lead time and daily demand must be positive numbers");
  }

  // Check if product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to this product if they are karyawan
  if (
    req.user.role === "karyawan" &&
    productExists.createdBy.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("Not authorized to calculate ROP for this product");
  }

  // Calculate ROP
  const rop = Math.round(dailyDemand * leadTime);

  try {
    // Create or update ROP record using findOneAndUpdate with upsert
    const ropRecord = await ROP.findOneAndUpdate(
      { product }, // filter
      {
        $set: {
          leadTime: Number(leadTime),
          dailyDemand: Number(dailyDemand),
          rop: rop,
          lastCalculated: new Date(),
          updatedBy: req.user.id,
        },
      },
      {
        new: true, // return updated document
        upsert: true, // create if doesn't exist
        runValidators: true, // run schema validations
      }
    );

    // Update product's updatedBy and updatedAt fields
    await Product.findByIdAndUpdate(
      product,
      {
        $set: {
          updatedBy: req.user.id,
          updatedAt: new Date(),
        },
      },
      { runValidators: true }
    );

    // Get the updated product with populated data including the creator
    const updatedProduct = await Product.findById(product)
      .populate("createdBy", "name email role")
      .lean();

    if (!updatedProduct) {
      res.status(404);
      throw new Error("Product not found after update");
    }

    const needsReorder = updatedProduct.currentStock <= rop;

    // Prepare response data first
    const responseData = {
      _id: ropRecord._id,
      product: ropRecord.product,
      leadTime: ropRecord.leadTime,
      dailyDemand: ropRecord.dailyDemand,
      rop: ropRecord.rop,
      lastCalculated: ropRecord.lastCalculated,
      needsReorder: needsReorder,
      currentStock: updatedProduct.currentStock,
      calculatedBy: req.user.id,
      message: "ROP calculated successfully",
    };

    // If current stock is at or below ROP, send notifications
    if (needsReorder) {
      console.log(
        `Product ${updatedProduct.name} needs reordering. Current stock: ${updatedProduct.currentStock}, ROP: ${rop}`
      );

      // Prepare product data with ROP information for email
      const productWithROP = {
        ...updatedProduct,
        rop: {
          rop: rop,
          leadTime: ropRecord.leadTime,
          dailyDemand: ropRecord.dailyDemand,
          lastCalculated: ropRecord.lastCalculated,
        },
      };

      const emailResults = {
        admin: { sent: false },
        user: { sent: false },
      };

      // Send admin notification (to all admins/owners)
      try {
        console.log("Sending admin ROP notification...");
        const adminEmailResult = await notifyAdminROP([productWithROP]);
        emailResults.admin = adminEmailResult;

        if (adminEmailResult.success) {
          console.log(
            `Admin ROP notification sent to ${adminEmailResult.recipientCount} recipients`
          );
        } else {
          console.error(
            "Failed to send admin ROP notification:",
            adminEmailResult.error
          );
        }
      } catch (adminEmailError) {
        console.error("Error sending admin ROP notification:", adminEmailError);
        emailResults.admin = {
          sent: false,
          error: adminEmailError.message,
          message: "Error occurred while sending admin notification",
        };
      }

      // Send user notification (to the product creator)
      if (updatedProduct.createdBy && updatedProduct.createdBy.email) {
        try {
          console.log(
            `Sending user ROP notification to ${updatedProduct.createdBy.email}...`
          );
          const userEmailResult = await notifyUserROP(
            productWithROP,
            updatedProduct.createdBy
          );
          emailResults.user = userEmailResult;

          if (userEmailResult.success) {
            console.log(
              `User ROP notification sent successfully to ${updatedProduct.createdBy.email}`
            );
          } else {
            console.error(
              "Failed to send user ROP notification:",
              userEmailResult.error
            );
          }
        } catch (userEmailError) {
          console.error("Error sending user ROP notification:", userEmailError);
          emailResults.user = {
            sent: false,
            error: userEmailError.message,
            message: "Error occurred while sending user notification",
          };
        }
      } else {
        console.warn(
          "Product creator email not found, skipping user notification"
        );
        emailResults.user = {
          sent: false,
          message: "Product creator email not found",
        };
      }

      responseData.emailNotifications = emailResults;
    } else {
      responseData.emailNotifications = {
        admin: {
          sent: false,
          message: "No notification needed - stock above ROP level",
        },
        user: {
          sent: false,
          message: "No notification needed - stock above ROP level",
        },
      };
    }

    // Return response with calculation results
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in calculateROP:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      res.status(400);
      throw new Error(`Validation error: ${error.message}`);
    } else if (error.name === "CastError") {
      res.status(400);
      throw new Error("Invalid product ID format");
    } else {
      res.status(500);
      throw new Error(`Failed to calculate ROP: ${error.message}`);
    }
  }
});

export const getAllROP = asyncHandler(async (req, res) => {
  try {
    let query = {};

    // If user is karyawan, only show ROPs for products they created
    if (req.user.role === "karyawan") {
      // First get products created by this user
      const products = await Product.find({ createdBy: req.user.id })
        .select("_id")
        .lean();

      const productIds = products.map((product) => product._id);

      // Filter ROPs by these products
      query.product = { $in: productIds };
    }

    const rops = await ROP.find(query)
      .populate({
        path: "product",
        select: "name code currentStock createdBy",
        populate: {
          path: "createdBy",
          select: "name email role",
        },
      })
      .lean();

    // Add needsReorder flag to each ROP
    const ropsWithStatus = rops.map((rop) => ({
      ...rop,
      needsReorder: rop.product.currentStock <= rop.rop,
    }));

    res.status(200).json(ropsWithStatus);
  } catch (error) {
    console.error("Error in getAllROP:", error);
    res.status(500);
    throw new Error(`Failed to fetch ROP data: ${error.message}`);
  }
});

export const checkAllProductsROP = asyncHandler(async (req, res) => {
  try {
    // Get all products with their ROP data and creator information
    const products = await Product.find({})
      .populate("createdBy", "name email role")
      .lean();

    const rops = await ROP.find({}).lean();

    // Create a map of product ID to ROP data
    const ropMap = new Map();
    rops.forEach((rop) => {
      ropMap.set(rop.product.toString(), rop);
    });

    // Find products that need reordering
    const productsBelowROP = [];

    products.forEach((product) => {
      const ropData = ropMap.get(product._id.toString());
      if (ropData && product.currentStock <= ropData.rop) {
        productsBelowROP.push({
          ...product,
          rop: ropData,
        });
      }
    });

    if (productsBelowROP.length > 0) {
      console.log(
        `Found ${productsBelowROP.length} products below ROP threshold`
      );

      const emailResults = {
        admin: { sent: false },
        users: [],
      };

      // Send admin notification
      try {
        console.log("Sending admin notification for all products below ROP...");
        const adminEmailResult = await notifyAdminROP(productsBelowROP);
        emailResults.admin = adminEmailResult;

        if (adminEmailResult.success) {
          console.log(
            `Admin notification sent to ${adminEmailResult.recipientCount} recipients`
          );
        }
      } catch (adminError) {
        console.error("Error sending admin notifications:", adminError);
        emailResults.admin = {
          sent: false,
          error: adminError.message,
        };
      }

      // Send individual user notifications
      for (const product of productsBelowROP) {
        if (product.createdBy && product.createdBy.email) {
          try {
            console.log(
              `Sending notification to user: ${product.createdBy.email} for product: ${product.name}`
            );
            const userEmailResult = await notifyUserROP(
              product,
              product.createdBy
            );
            emailResults.users.push({
              productId: product._id,
              productName: product.name,
              userId: product.createdBy._id,
              email: product.createdBy.email,
              result: userEmailResult,
            });

            if (userEmailResult.success) {
              console.log(
                `Notification sent successfully to ${product.createdBy.email}`
              );
            }
          } catch (userError) {
            console.error(
              `Error sending notification to user ${product.createdBy.email}:`,
              userError
            );
            emailResults.users.push({
              productId: product._id,
              productName: product.name,
              userId: product.createdBy._id,
              email: product.createdBy.email,
              result: {
                sent: false,
                error: userError.message,
              },
            });
          }
        } else {
          console.warn(`Product ${product.name} has no valid creator email`);
          emailResults.users.push({
            productId: product._id,
            productName: product.name,
            userId: product.createdBy?._id || null,
            email: "No email found",
            result: {
              sent: false,
              error: "Creator email not found",
            },
          });
        }
      }

      res.status(200).json({
        message: "ROP check completed",
        totalProducts: products.length,
        productsBelowROP: productsBelowROP.length,
        productsNeedingReorder: productsBelowROP.map((p) => ({
          id: p._id,
          name: p.name,
          currentStock: p.currentStock,
          rop: p.rop.rop,
          createdBy: p.createdBy?.name || "Unknown",
        })),
        emailNotifications: emailResults,
      });
    } else {
      console.log("No products need reordering");
      res.status(200).json({
        message: "ROP check completed - no products need reordering",
        totalProducts: products.length,
        productsBelowROP: 0,
      });
    }
  } catch (error) {
    console.error("Error in checkAllProductsROP:", error);
    res.status(500);
    throw new Error(`Failed to check ROP for all products: ${error.message}`);
  }
});

// New function to manually trigger ROP notifications for testing
export const sendTestROPNotification = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    // Get product with creator information
    const product = await Product.findById(productId)
      .populate("createdBy", "name email role")
      .lean();

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Get ROP data
    const ropData = await ROP.findOne({ product: productId }).lean();

    if (!ropData) {
      res.status(404);
      throw new Error("ROP data not found for this product");
    }

    const productWithROP = {
      ...product,
      rop: ropData,
    };

    const emailResults = {
      admin: { sent: false },
      user: { sent: false },
    };

    // Send admin notification
    try {
      const adminEmailResult = await notifyAdminROP([productWithROP]);
      emailResults.admin = adminEmailResult;
    } catch (adminError) {
      emailResults.admin = {
        sent: false,
        error: adminError.message,
      };
    }

    // Send user notification
    if (product.createdBy && product.createdBy.email) {
      try {
        const userEmailResult = await notifyUserROP(
          productWithROP,
          product.createdBy
        );
        emailResults.user = userEmailResult;
      } catch (userError) {
        emailResults.user = {
          sent: false,
          error: userError.message,
        };
      }
    }

    res.status(200).json({
      message: "Test notifications sent",
      product: {
        id: product._id,
        name: product.name,
        currentStock: product.currentStock,
        rop: ropData.rop,
      },
      emailResults,
    });
  } catch (error) {
    console.error("Error in sendTestROPNotification:", error);
    res.status(500);
    throw new Error(`Failed to send test notification: ${error.message}`);
  }
});

console.log("ROP Controller loaded successfully");

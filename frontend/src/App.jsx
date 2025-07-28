import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./styles/Styles.scss";
import Layout from "./layout/Layout";
import Dashboard from "./views/Dashboard";
import Product from "./views/products/Product";
import AddProduct from "./views/products/AddProduct";
import IncomingGoods from "./views/transaction/IncomingGoods";
import CategoriesList from "./views/category/CategoriesList";
import AddCategory from "./views/category/AddCategory";
import EditCategory from "./views/category/EditCategory";
import Supplier from "./views/supplier/Supplier";
import AddSupplier from "./views/supplier/AddSupplier";
import EditSupplier from "./views/supplier/EditSupplier";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ValidateResetCode from "./pages/ValidateResetCode";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/profile/Setting";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
import OutgoingGoods from "./views/transaction/OutgoingGoods";
import History from "./views/transaction/History";
import CalculatorEoq from "./views/eoq/CalculatorEoq";
import Eoq from "./views/eoq/Eoq";
import CalculatorRop from "./views/rop/CalculatorRop";
import Rop from "./views/rop/Rop";
import User from "./views/users/User";
import EditUser from "./views/users/EditUser";
import UserLog from "./views/log/UserLog";
import EditProduct from "./views/products/EditProduct";
import StockReport from "./views/report/StockReport";
import TransactionReport from "./views/report/TransactionReport";
import RopEoqReport from "./views/report/RopEoqReport";
import ProductLog from "./views/log/ProductLog";
import TransactionLog from "./views/log/TransactionLog";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/validate-reset-code" element={<ValidateResetCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Product Management Routes */}
            <Route path="/product-management" element={<Product />} />
            <Route path="/product-management/items" element={<Product />} />
            <Route path="/product-management/add" element={<AddProduct />} />
            <Route
              path="/product-management/edit/:id"
              element={<EditProduct />}
            />

            {/* Category Management Routes */}
            <Route
              path="/product-management/categories"
              element={<CategoriesList />}
            />
            <Route
              path="/product-management/categories/add"
              element={<AddCategory />}
            />
            <Route
              path="/product-management/categories/edit/:id"
              element={<EditCategory />}
            />

            {/* Supplier Management Routes */}
            <Route path="/supplier/suppliers" element={<Supplier />} />
            <Route path="/supplier/suppliers/add" element={<AddSupplier />} />
            <Route
              path="/supplier/suppliers/edit/:id"
              element={<EditSupplier />}
            />

            {/* Profile Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Transaction Management Routes */}
            <Route
              path="/inventory-transactions/incoming"
              element={<IncomingGoods />}
            />
            <Route
              path="/inventory-transactions/outgoing"
              element={<OutgoingGoods />}
            />
            <Route
              path="/inventory-transactions/history"
              element={<History />}
            />

            {/* EOQ Routes */}
            <Route
              path="/eoq/calculator"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <CalculatorEoq />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/eoq/data"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <Eoq />
                </RoleBasedRoute>
              }
            />

            {/* ROP Routes - With Role-Based Access Control */}
            <Route
              path="/rop/calculator"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <CalculatorRop />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/rop/data"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <Rop />
                </RoleBasedRoute>
              }
            />

            {/* User Routes - Typically admin only */}
            <Route
              path="/user-management/users"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <User />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/user-management/edit/:id"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <EditUser />
                </RoleBasedRoute>
              }
            />

            {/* Report Routes - Admin access */}
            <Route
              path="/reports/stock"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <StockReport />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/reports/transactions"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <TransactionReport />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/reports/eoq-rop"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <RopEoqReport />
                </RoleBasedRoute>
              }
            />

            {/* Log Routes - Admin access */}
            <Route
              path="/logs/users"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <UserLog />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/logs/items"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <ProductLog />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/logs/transactions"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <TransactionLog />
                </RoleBasedRoute>
              }
            />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

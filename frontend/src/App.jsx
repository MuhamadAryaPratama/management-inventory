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
import Category from "./views/category/Category";
import Supplier from "./views/supplier/Supplier";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import UserLog from "./views/log/UserLog";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Product Management Routes */}
            <Route path="/product-management/items" element={<Product />} />
            <Route path="/product-management/add" element={<AddProduct />} />
            <Route
              path="/product-management/categories"
              element={<Category />}
            />

            {/* Supplier Management Routes */}
            <Route path="/suplier/suppliers" element={<Supplier />} />

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

            {/* Log Routes - Admin and Manager access */}
            <Route
              path="/logs/users"
              element={
                <RoleBasedRoute allowedRoles={["pemilik"]}>
                  <UserLog />
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

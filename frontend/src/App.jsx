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
import AddProduct from "./views/products/AddProduct"; // Import AddProduct component
import Category from "./views/category/Category";
import Supplier from "./views/supplier/Supplier";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/profile/Setting";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
            <Route
              path="/product-management/add"
              element={<AddProduct />}
            />{" "}
            {/* Add this route */}
            <Route
              path="/product-management/categories"
              element={<Category />}
            />
            {/* Supplier Management Routes */}
            <Route path="/suplier/suppliers" element={<Supplier />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

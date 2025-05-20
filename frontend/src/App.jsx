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
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/profile/Profile"; // Import from correct path
import Settings from "./pages/profile/Setting"; // Fixed import path
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes within Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/product-management/items" element={<Product />} />
            {/* Fixed Profile and Settings routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            {/* Add other routes here */}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

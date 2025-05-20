import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/Styles.scss";
import App from "./App.jsx";

// Bootstrap the React application
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

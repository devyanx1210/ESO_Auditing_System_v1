import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import router from "./routes/router";
import { AuthProvider } from "./context/AuthContext";

import "../styles/index.css";

// Apply theme synchronously before first render to prevent flash
if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

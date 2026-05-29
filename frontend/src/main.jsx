import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./style.css";

// Habilitar analíticas e insights de rendimiento de forma segura solo en producción
if (import.meta.env.PROD) {
  import("@vercel/analytics")
    .then(({ inject }) => inject())
    .catch((err) => console.warn("Vercel Analytics blocked by client:", err));

  import("@vercel/speed-insights")
    .then(({ injectSpeedInsights }) => injectSpeedInsights())
    .catch((err) => console.warn("Vercel Speed Insights blocked by client:", err));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

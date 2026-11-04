import { Analytics } from "@vercel/analytics/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { startUrlSync } from "./urlSync";
import "./index.css";

startUrlSync();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    {/* Vercel Web Analytics: page views, no cookies. Inactive outside Vercel deployments. */}
    <Analytics />
  </React.StrictMode>
);

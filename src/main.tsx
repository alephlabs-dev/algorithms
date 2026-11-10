import React from "react";
import ReactDOM from "react-dom/client";
import { lang } from "./i18n";
import { Root } from "./Root";
import { startUrlSync } from "./urlSync";
import "./index.css";

// Prerendered pages already say it; the dev server serves index.html for every path.
document.documentElement.lang = lang;
startUrlSync();

const container = document.getElementById("root")!;
const tree = (
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
// Prerendered pages arrive with their HTML, which React takes over in place (#140).
// The dev server sends an empty #root, so there it renders from scratch.
if (container.hasChildNodes()) ReactDOM.hydrateRoot(container, tree);
else ReactDOM.createRoot(container).render(tree);

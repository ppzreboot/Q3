import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.jsx";
import { LangProvider } from "./i18n.jsx";
import { installFrames } from "./frames.js";
import "./index.css";

installFrames();

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <BrowserRouter basename={basename}>
    <LangProvider>
      <App />
    </LangProvider>
  </BrowserRouter>,
);

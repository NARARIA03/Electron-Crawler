import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "./components";
import { ComsiganAlertPage, LandingPage, NaraJangterPage, OpenGoKrPage } from "./pages";
import "./index.css";
import { OverlayProvider } from "overlay-kit";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="flex flex-col justify-center items-center gap-24 bg-white">
      <OverlayProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/openGoKr" element={<OpenGoKrPage />} />
            <Route path="/comsiganAlert" element={<ComsiganAlertPage />} />
            <Route path="/naraJangter" element={<NaraJangterPage />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </HashRouter>
      </OverlayProvider>
    </div>
  </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "./components";
import { ComsiganAlertPage, LandingPage, NaraJangterPage, OpenGoKrPage } from "./pages";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-24 bg-slate-800">
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/openGoKr" element={<OpenGoKrPage />} />
          <Route path="/comsiganAlert" element={<ComsiganAlertPage />} />
          <Route path="/naraJangter" element={<NaraJangterPage />} />
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </HashRouter>
    </div>
  </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./index.css"
import App from "./App"

// HashRouter statt BrowserRouter: hält den Dokumentpfad stabil auf
// .../proxy/5173/ und vermeidet kaputte Asset-Pfade hinter dem Proxy.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </HashRouter>
  </StrictMode>,
)

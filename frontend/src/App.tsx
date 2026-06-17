import { Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "@/components/layout"
import { BuchenPage } from "@/pages/buchen"
import { MeineBuchungenPage } from "@/pages/meine-buchungen"
import { BuchungDetailPage } from "@/pages/buchung-detail"
import { KalenderPage } from "@/pages/kalender"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/buchen" replace />} />
        <Route path="/buchen" element={<BuchenPage />} />
        <Route path="/buchungen" element={<MeineBuchungenPage />} />
        <Route path="/buchungen/:id" element={<BuchungDetailPage />} />
        <Route path="/kalender" element={<KalenderPage />} />
      </Route>
    </Routes>
  )
}

export default App

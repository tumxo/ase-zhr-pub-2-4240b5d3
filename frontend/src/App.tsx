import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { Layout } from "@/components/layout"
import { BuchenPage } from "@/pages/buchen"
import { MeineBuchungenPage } from "@/pages/meine-buchungen"
import { BuchungDetailPage } from "@/pages/buchung-detail"
import { KalenderPage } from "@/pages/kalender"
import { StatusPage } from "@/pages/status"
import { LoginPage } from "@/pages/login"
import { getBenutzer } from "@/lib/benutzer"

function PrivateRoute() {
  if (!getBenutzer()) return <Navigate to="/login" replace />
  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/buchen" replace />} />
          <Route path="/buchen" element={<BuchenPage />} />
          <Route path="/buchungen" element={<MeineBuchungenPage />} />
          <Route path="/buchungen/:id" element={<BuchungDetailPage />} />
          <Route path="/kalender" element={<KalenderPage />} />
          <Route path="/status" element={<StatusPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

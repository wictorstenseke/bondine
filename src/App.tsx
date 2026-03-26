import { BrowserRouter, Routes, Route } from "react-router"
import { Feed } from "@/pages/Feed"
import { Restaurants } from "@/pages/Restaurants"
import { AppHeader } from "@/components/Header"
import { AppSidebar } from "@/components/Sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { activeAdapter } from "@/lib/storage"
import { AddVisitProvider } from "@/context/AddVisitContext"

export default function App() {
  return (
    <BrowserRouter>
      <AddVisitProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <Routes>
              <Route path="/" element={<Feed adapter={activeAdapter} />} />
              <Route path="/restaurants" element={<Restaurants />} />
            </Routes>
          </SidebarInset>
        </SidebarProvider>
      </AddVisitProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route } from "react-router"
import { Feed } from "@/pages/Feed"
import { Restaurants } from "@/pages/Restaurants"
import { AppHeader } from "@/components/Header"
import { AppSidebar } from "@/components/Sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { activeAdapter } from "@/lib/storage"
import { AddVisitProvider } from "@/context/AddVisitContext"
import { AssistantProvider } from "@/context/AssistantContext"
import { CommandPaletteProvider } from "@/context/CommandPaletteContext"
import { AssistantDrawer } from "@/components/AssistantDrawer"
import { CommandPalette } from "@/components/CommandPalette"

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AddVisitProvider>
        <AssistantProvider>
          <CommandPaletteProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <AppHeader />
                <Routes>
                  <Route path="/" element={<Feed adapter={activeAdapter} />} />
                  <Route path="/restaurants" element={<Restaurants />} />
                </Routes>
              </SidebarInset>
              <AssistantDrawer />
              <CommandPalette />
            </SidebarProvider>
          </CommandPaletteProvider>
        </AssistantProvider>
      </AddVisitProvider>
    </BrowserRouter>
  )
}

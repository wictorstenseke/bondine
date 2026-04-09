import { useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { AssistantChat } from "./AssistantChat"
import { AssistantSettings } from "./AssistantSettings"
import { useAssistant } from "@/context/AssistantContext"
import { activeAdapter } from "@/lib/storage"

/**
 * Top-level wrapper for the Ask Bondine feature. Mounts once at the App level,
 * responsible for:
 *  - responsive Drawer/Dialog switching
 *  - choosing between onboarding, empty-history, settings, and chat states
 *  - wiring the chat to the live visit store (fresh snapshot per session)
 */
export function AssistantDrawer() {
  const { open, setOpen, hasKey, key } = useAssistant()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [showSettings, setShowSettings] = useState(false)

  const getVisits = () => activeAdapter.getVisits()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // Reset settings view so the next open starts in chat mode.
      setShowSettings(false)
    }
  }

  const body = (() => {
    if (!hasKey || showSettings) {
      return <AssistantSettings onClose={() => setShowSettings(false)} />
    }
    return (
      <AssistantChat
        apiKey={key!}
        getVisits={getVisits}
        addVisit={activeAdapter.addVisit}
      />
    )
  })()

  const header = (
    <div className="flex items-center gap-2">
      <span>Ask Bondine</span>
      {hasKey && (
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={() => setShowSettings((s) => !s)}
          aria-label="Assistant settings"
        >
          <Settings className="size-4" />
        </Button>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle asChild>
              <div>{header}</div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chat with the Bondine assistant about your logged visits.
            </DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle asChild>
            <div>{header}</div>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Chat with the Bondine assistant about your logged visits.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">{body}</div>
      </DrawerContent>
    </Drawer>
  )
}

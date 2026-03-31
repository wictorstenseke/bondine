import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { VisitForm } from "@/components/VisitForm"
import type { Visit } from "@/lib/storage/types"
import { FlameIcon } from "@/components/FlameIcon"

interface Props {
  visit: Visit
  onUpdate: (visit: Visit) => void
  onDelete: (id: string) => void
}

export function VisitDetail({ visit, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <VisitForm
        defaultValues={visit}
        onSubmit={(data) => {
          onUpdate({ ...data, id: visit.id, createdAt: visit.createdAt })
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">{visit.restaurantName}</h2>
        <p className="text-sm text-muted-foreground">{visit.date}</p>
      </div>

      {visit.mealType && (
        <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
          {visit.mealType}
        </span>
      )}

      {visit.rating !== null && (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: visit.rating }, (_, i) => (
            <FlameIcon key={i} className="size-5" />
          ))}
        </div>
      )}

      {visit.note && (
        <p className="text-sm text-muted-foreground">{visit.note}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the visit to {visit.restaurantName}
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(visit.id)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

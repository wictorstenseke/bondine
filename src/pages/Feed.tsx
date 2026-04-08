import { useState } from "react"
import { nanoid } from "nanoid"
import { useVisits } from "@/lib/storage/useVisits"
import { VisitCard } from "@/components/VisitCard"
import { VisitForm } from "@/components/VisitForm"
import { VisitDetail } from "@/components/VisitDetail"
import { AddVisitModal } from "@/components/AddVisitModal"
import { FiltersMenu } from "@/components/FiltersMenu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { UtensilsCrossed } from "lucide-react"
import { useAddVisit } from "@/context/AddVisitContext"
import type { StorageAdapter, Visit } from "@/lib/storage/types"

interface Props {
  adapter: StorageAdapter
}

export function Feed({ adapter }: Props) {
  const { visits, addVisit, updateVisit, deleteVisit } = useVisits(adapter)
  const { open, setOpen } = useAddVisit()
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)

  const mealTypes = [
    ...new Set(
      visits.map((v) => v.mealType).filter((t): t is string => t !== null)
    ),
  ]
  const restaurantSuggestions = [
    ...new Set(visits.map((v) => v.restaurantName)),
  ]

  const generateMockVisits = () => {
    const restaurants = [
      "Pasta Palace",
      "Sushi Zen",
      "Burger Barn",
      "Taco Fiesta",
      "Le Petit Bistro",
      "Ramen House",
      "Green Garden",
      "Pizza Corner",
      "Dim Sum Dynasty",
      "The Steakhouse",
    ]
    const meals = ["lunch", "dinner", null]
    const notes = [
      "Great atmosphere, will come back.",
      "Service was a bit slow but food was amazing.",
      "Best meal I've had this month!",
      "Cozy spot, perfect for a date night.",
      null,
    ]
    const today = new Date()
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 60)
      const date = new Date(today)
      date.setDate(date.getDate() - daysAgo)
      addVisit({
        id: nanoid(),
        restaurantName: restaurants[i],
        date: date.toISOString().slice(0, 10),
        mealType: meals[Math.floor(Math.random() * meals.length)],
        rating: Math.floor(Math.random() * 5) + 1,
        note: notes[Math.floor(Math.random() * notes.length)],
        createdAt: new Date().toISOString(),
      })
    }
  }

  const sorted = [...visits]
    .filter((v) => activeFilter === null || v.mealType === activeFilter)
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date)
      return b.createdAt.localeCompare(a.createdAt)
    })

  return (
    <>
      <FiltersMenu
        mealTypes={mealTypes}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <div className="mx-auto max-w-xl">
        <div className="p-4">
          {sorted.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UtensilsCrossed />
                </EmptyMedia>
                <EmptyTitle>No visits yet</EmptyTitle>
                <EmptyDescription>
                  Add your first restaurant visit to get started.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(true)}
                >
                  Add visit
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((v) => (
                <VisitCard
                  key={v.id}
                  visit={v}
                  onClick={() => setSelectedVisit(v)}
                />
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Button size="sm" variant="outline" onClick={generateMockVisits}>
              Generate 10 mock visits (dev)
            </Button>
          </div>

          <AddVisitModal open={open} onOpenChange={setOpen}>
            <VisitForm
              restaurantSuggestions={restaurantSuggestions}
              onSubmit={(data) => {
                addVisit({
                  ...data,
                  id: nanoid(),
                  createdAt: new Date().toISOString(),
                })
                setOpen(false)
              }}
            />
          </AddVisitModal>

          <AddVisitModal
            open={selectedVisit !== null}
            onOpenChange={(o) => {
              if (!o) setSelectedVisit(null)
            }}
            title="Visit detail"
          >
            {selectedVisit && (
              <VisitDetail
                visit={selectedVisit}
                onUpdate={(updated) => {
                  updateVisit(updated)
                  setSelectedVisit(null)
                }}
                onDelete={(id) => {
                  deleteVisit(id)
                  setSelectedVisit(null)
                }}
              />
            )}
          </AddVisitModal>
        </div>
      </div>
    </>
  )
}

import { useState } from "react"
import { nanoid } from "nanoid"
import { useVisits } from "@/lib/storage/useVisits"
import { deriveRestaurants, type SortOrder } from "@/lib/deriveRestaurants"
import { RestaurantDetail } from "@/components/RestaurantDetail"
import { AddVisitModal } from "@/components/AddVisitModal"
import { VisitForm } from "@/components/VisitForm"
import { activeAdapter } from "@/lib/storage"
import { FiltersMenu } from "@/components/FiltersMenu"
import { useAddVisit } from "@/context/AddVisitContext"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty-state"
import { Store } from "lucide-react"
import { FlameIcon } from "@/components/FlameIcon"

export function Restaurants() {
  const { visits, addVisit } = useVisits(activeAdapter)
  const { open, setOpen } = useAddVisit()
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOrder>("recent")
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [prefillName, setPrefillName] = useState<string | null>(null)

  const mealTypes = [
    ...new Set(
      visits.map((v) => v.mealType).filter((t): t is string => t !== null)
    ),
  ]
  const filteredVisits =
    activeFilter === null
      ? visits
      : visits.filter((v) => v.mealType === activeFilter)

  const restaurants = deriveRestaurants(filteredVisits, sort)
  const restaurantSuggestions = [
    ...new Set(visits.map((v) => v.restaurantName)),
  ]

  function handleAddVisit(name: string) {
    setSelectedName(null)
    setPrefillName(name)
  }

  return (
    <>
      <FiltersMenu
        mealTypes={mealTypes}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sort={sort}
        onSortChange={setSort}
      />
      <div className="mx-auto max-w-xl p-4">
        {restaurants.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Store />
              </EmptyMedia>
              <EmptyTitle>No restaurants yet</EmptyTitle>
              <EmptyDescription>
                Your visited restaurants will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {restaurants.map((r) => (
              <button
                key={r.name}
                onClick={() => setSelectedName(r.name)}
                className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{r.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {r.lastVisited}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {r.visitCount} {r.visitCount === 1 ? "visit" : "visits"}
                  </span>
                  {r.avgRating !== null && (
                    <span className="flex items-center gap-0.5">
                      {Array.from(
                        { length: Math.round(r.avgRating) },
                        (_, i) => (
                          <FlameIcon key={i} className="size-4" />
                        )
                      )}
                      <span>{r.avgRating.toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Restaurant detail drawer */}
        <AddVisitModal
          open={selectedName !== null}
          onOpenChange={(o) => {
            if (!o) setSelectedName(null)
          }}
          title={selectedName ?? ""}
        >
          {selectedName && (
            <RestaurantDetail
              name={selectedName}
              visits={visits.filter((v) => v.restaurantName === selectedName)}
              onAddVisit={handleAddVisit}
            />
          )}
        </AddVisitModal>

        {/* Add visit modal — opens from header button or pre-filled from restaurant detail */}
        <AddVisitModal
          open={open || prefillName !== null}
          onOpenChange={(o) => {
            if (!o) {
              setOpen(false)
              setPrefillName(null)
            }
          }}
          title="Add visit"
        >
          <VisitForm
            defaultValues={{ restaurantName: prefillName ?? "" }}
            restaurantSuggestions={restaurantSuggestions}
            onSubmit={(data) => {
              addVisit({
                ...data,
                id: nanoid(),
                createdAt: new Date().toISOString(),
              })
              setPrefillName(null)
            }}
          />
        </AddVisitModal>
      </div>
    </>
  )
}

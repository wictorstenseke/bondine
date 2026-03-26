import { Button } from "@/components/ui/button"
import { VisitCard } from "@/components/VisitCard"
import type { Visit } from "@/lib/storage/types"

interface Props {
  name: string
  visits: Visit[]
  onAddVisit: (restaurantName: string) => void
}

export function RestaurantDetail({ name, visits, onAddVisit }: Props) {
  const ratedVisits = visits.filter((v) => v.rating !== null)
  const avgRating =
    ratedVisits.length > 0
      ? ratedVisits.reduce((sum, v) => sum + (v.rating ?? 0), 0) / ratedVisits.length
      : null

  const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {visits.length} {visits.length === 1 ? "visit" : "visits"}
            {avgRating !== null && ` · avg ${avgRating.toFixed(1)} 🔥`}
          </p>
        </div>
        <Button size="sm" onClick={() => onAddVisit(name)}>
          Add visit
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((v) => (
          <VisitCard key={v.id} visit={v} onClick={() => {}} />
        ))}
      </div>
    </div>
  )
}

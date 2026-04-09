import type { Visit } from "@/lib/storage/types"
import { FlameIcon } from "@/components/FlameIcon"

interface Props {
  visit: Visit
  onClick: () => void
}

export function VisitCard({ visit, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{visit.restaurantName}</span>
        <span className="shrink-0 text-sm text-muted-foreground">
          {visit.date}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {visit.mealType !== null && (
          <span
            data-testid="meal-type"
            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
          >
            {visit.mealType.charAt(0).toUpperCase() + visit.mealType.slice(1)}
          </span>
        )}
        {visit.rating !== null && (
          <span data-testid="rating" className="flex items-center gap-0.5">
            {Array.from({ length: visit.rating }, (_, i) => (
              <FlameIcon key={i} className="size-4" />
            ))}
          </span>
        )}
      </div>

      {visit.note && (
        <p className="mt-2 text-sm text-muted-foreground">{visit.note}</p>
      )}
    </button>
  )
}

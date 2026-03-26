import type { ReactNode } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export const filterToggleOnClass =
  "data-[state=on]:bg-amber-500 data-[state=on]:text-black data-[state=on]:border-amber-500"

export function FilterStripRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-x-6 gap-y-2 px-4 py-3">
      {children}
    </div>
  )
}

export function FilterStripCluster({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
    </div>
  )
}

interface Props {
  mealTypes: string[]
  active: string | null
  onChange: (mealType: string | null) => void
}

export function MealTypeToggleGroup({ mealTypes, active, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={active ?? "all"}
      onValueChange={(val) => onChange(val === "all" ? null : val || null)}
    >
      <ToggleGroupItem value="all" className={filterToggleOnClass}>
        All
      </ToggleGroupItem>
      {mealTypes.map((type) => (
        <ToggleGroupItem
          key={type}
          value={type}
          className={`capitalize ${filterToggleOnClass}`}
        >
          {type}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function FilterBar({ mealTypes, active, onChange }: Props) {
  return (
    <FilterStripRow>
      <FilterStripCluster label="Filter">
        <MealTypeToggleGroup mealTypes={mealTypes} active={active} onChange={onChange} />
      </FilterStripCluster>
    </FilterStripRow>
  )
}

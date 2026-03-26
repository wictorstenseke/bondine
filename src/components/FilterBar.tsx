import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface Props {
  mealTypes: string[]
  active: string | null
  onChange: (mealType: string | null) => void
}

export function FilterBar({ mealTypes, active, onChange }: Props) {
  return (
    <div className="border-b px-4 py-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={active ?? "all"}
        onValueChange={(val) => onChange(val === "all" ? null : val || null)}
      >
        <ToggleGroupItem
          value="all"
          className="data-[state=on]:bg-amber-500 data-[state=on]:text-black data-[state=on]:border-amber-500"
        >
          All
        </ToggleGroupItem>
        {mealTypes.map((type) => (
          <ToggleGroupItem
            key={type}
            value={type}
            className="capitalize data-[state=on]:bg-amber-500 data-[state=on]:text-black data-[state=on]:border-amber-500"
          >
            {type}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

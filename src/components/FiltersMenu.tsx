import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import type { SortOrder } from "@/lib/deriveRestaurants"

const SORT_OPTIONS: { label: string; value: SortOrder }[] = [
  { label: "Most recent", value: "recent" },
  { label: "Most visited", value: "visits" },
  { label: "Highest rated", value: "rating" },
  { label: "Alphabetical", value: "alpha" },
]

export interface FiltersMenuProps {
  mealTypes: string[]
  activeFilter: string | null
  onFilterChange: (mealType: string | null) => void
  sort?: SortOrder
  onSortChange?: (sort: SortOrder) => void
}

export function FiltersMenu({
  mealTypes,
  activeFilter,
  onFilterChange,
  sort,
  onSortChange,
}: FiltersMenuProps) {
  const filterSummary = activeFilter === null ? "All meals" : activeFilter
  const sortSummary =
    sort !== undefined
      ? (SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "")
      : ""
  const showSort = sort !== undefined && onSortChange !== undefined

  return (
    <div className="flex w-full justify-end px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={showSort ? "Filter and sort" : "Filter visits"}
            className="h-8 max-w-full min-w-0 gap-1.5 rounded-md border-border bg-background font-normal shadow-xs"
          >
            <span className="truncate text-xs text-muted-foreground">
              {filterSummary}
              {showSort ? (
                <>
                  <span className="text-muted-foreground/70"> · </span>
                  {sortSummary}
                </>
              ) : null}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={activeFilter === null ? "all" : activeFilter}
              onValueChange={(v) => onFilterChange(v === "all" ? null : v)}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              {mealTypes.map((type) => (
                <DropdownMenuRadioItem
                  key={type}
                  value={type}
                  className="capitalize"
                >
                  {type}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          {showSort ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => v && onSortChange(v as SortOrder)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

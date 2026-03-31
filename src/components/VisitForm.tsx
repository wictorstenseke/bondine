import { useState, useRef } from "react"
import { CalendarIcon } from "lucide-react"
import { FlameIcon } from "@/components/FlameIcon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Visit } from "@/lib/storage/types"

type VisitFormData = Omit<Visit, "id" | "createdAt">

interface Props {
  onSubmit: (data: VisitFormData) => void
  defaultValues?: Partial<VisitFormData>
  restaurantSuggestions?: string[]
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const PRESET_MEAL_TYPES = ["Lunch", "Dinner"]

export function VisitForm({
  onSubmit,
  defaultValues,
  restaurantSuggestions = [],
}: Props) {
  const [restaurantName, setRestaurantName] = useState(
    defaultValues?.restaurantName ?? ""
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState(
    defaultValues?.date ?? toLocalDateString(new Date())
  )
  const [mealType, setMealType] = useState<string | null>(
    defaultValues?.mealType ?? null
  )
  const [customMealType, setCustomMealType] = useState("")
  const [showCustomMealType, setShowCustomMealType] = useState(false)
  const [rating, setRating] = useState<number | null>(
    defaultValues?.rating ?? null
  )
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [note, setNote] = useState(defaultValues?.note ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!restaurantName.trim()) return

    const resolvedMealType = showCustomMealType
      ? customMealType.trim() || null
      : mealType

    onSubmit({
      restaurantName: restaurantName.trim(),
      date,
      mealType: resolvedMealType,
      rating,
      note: note.trim() || null,
    })
  }

  function handleMealTypePill(type: string) {
    setShowCustomMealType(false)
    setMealType(mealType === type.toLowerCase() ? null : type.toLowerCase())
  }

  function handleOtherPill() {
    setShowCustomMealType(true)
    setMealType(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative flex flex-col gap-1.5">
        <Label htmlFor="restaurantName">Restaurant</Label>
        <Input
          id="restaurantName"
          ref={inputRef}
          value={restaurantName}
          onChange={(e) => {
            setRestaurantName(e.target.value)
            setShowSuggestions(true)
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Restaurant name"
          required
          autoComplete="off"
        />
        {showSuggestions &&
          restaurantSuggestions.length > 0 &&
          (() => {
            const filtered = restaurantSuggestions.filter(
              (s) =>
                s.toLowerCase().includes(restaurantName.toLowerCase()) &&
                restaurantName.length > 0
            )
            return filtered.length > 0 ? (
              <ul className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {filtered.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setRestaurantName(s)
                        setShowSuggestions(false)
                        inputRef.current?.focus()
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null
          })()}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start font-normal"
            >
              <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={new Date(date + "T00:00:00")}
              onSelect={(d) => {
                if (d) {
                  setDate(toLocalDateString(d))
                  setCalendarOpen(false)
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Meal type</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_MEAL_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={
                mealType === type.toLowerCase() && !showCustomMealType
                  ? "default"
                  : "outline"
              }
              onClick={() => handleMealTypePill(type)}
            >
              {type}
            </Button>
          ))}
          <Button
            type="button"
            variant={showCustomMealType ? "default" : "outline"}
            onClick={handleOtherPill}
          >
            Other…
          </Button>
        </div>
        {showCustomMealType && (
          <Input
            value={customMealType}
            onChange={(e) => setCustomMealType(e.target.value)}
            placeholder="e.g. Breakfast, Catered, Café"
            autoFocus
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? null : n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(null)}
              aria-label={`${n} flames`}
              className={`transition-opacity ${
                n <= (hoverRating ?? rating ?? 0) ? "opacity-100" : "opacity-30"
              }`}
            >
              <FlameIcon className="size-8" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any thoughts…"
          rows={3}
        />
      </div>

      <Button type="submit">Save</Button>
    </form>
  )
}

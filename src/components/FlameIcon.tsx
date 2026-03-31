interface Props {
  className?: string
}

export function FlameIcon({ className = "size-4" }: Props) {
  return (
    <>
      <img
        src="/assets/icons/flame_Dark Wood-1.svg"
        className={`dark:hidden ${className}`}
        alt=""
        aria-hidden="true"
      />
      <img
        src="/assets/icons/flame_White Ash-1.svg"
        className={`hidden dark:inline ${className}`}
        alt=""
        aria-hidden="true"
      />
    </>
  )
}

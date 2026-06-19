interface ArrowIconProps {
  direction?: "right" | "down";
}

export function ArrowIcon({ direction = "right" }: ArrowIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      style={{
        transform: direction === "down" ? "rotate(90deg)" : undefined
      }}
      viewBox="0 0 18 18"
      width="18"
    >
      <path
        d="M3.75 9h10.5M10 4.75 14.25 9 10 13.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

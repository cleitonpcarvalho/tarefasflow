import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "teal" | "amber" | "coral" | "slate";
}

const variants = {
  purple: "bg-tf-purple-light text-tf-purple dark:bg-tf-dark-purple-light",
  teal: "bg-tf-teal-bg text-tf-teal-text",
  amber: "bg-tf-amber-bg text-tf-amber-text",
  coral: "bg-tf-coral-bg text-tf-coral-text",
  slate: "bg-slate-100 text-slate-700 dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-muted"
};

export function Badge({
  className,
  variant = "slate",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

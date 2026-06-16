import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "secondary" | "ghost";
}

const variants = {
  primary: "border border-tf-purple bg-tf-purple text-white hover:bg-[#4540A3]",
  outline:
    "border border-tf-border bg-transparent text-tf-text-muted hover:border-tf-purple hover:text-tf-purple dark:border-tf-dark-border dark:text-tf-dark-text-muted",
  secondary:
    "border border-tf-border bg-transparent text-tf-text-muted hover:border-tf-purple hover:text-tf-purple dark:border-tf-dark-border dark:text-tf-dark-text-muted",
  ghost:
    "border border-transparent bg-transparent text-tf-text-muted hover:text-tf-text-primary dark:text-tf-dark-text-muted dark:hover:text-tf-dark-text-primary"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition focus:outline-none focus:ring-4 focus:ring-tf-purple-light disabled:cursor-not-allowed disabled:opacity-60",
          variants[variant],
          className
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

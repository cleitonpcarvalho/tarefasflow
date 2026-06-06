import Image from "next/image";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export function BrandLogo({ className, compact = false }: BrandLogoProps) {
  return (
    <span
      aria-label="TarefasFlow"
      className={cn("inline-flex items-center gap-2", className)}
      role="img"
    >
      <Image
        alt=""
        className={cn(
          "h-auto shrink-0 object-contain",
          compact ? "w-8" : "w-12"
        )}
        height={40}
        priority
        src="/favicon.png"
        width={48}
      />
      <span
        className={cn(
          "font-bold tracking-[-0.04em] text-[#534AB7]",
          compact ? "text-xl" : "text-[30px]"
        )}
      >
        TarefasFlow
      </span>
    </span>
  );
}

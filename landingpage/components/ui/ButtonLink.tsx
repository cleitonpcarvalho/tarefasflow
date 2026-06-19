import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./ButtonLink.module.css";

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  children: ReactNode;
  href: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
}

export function ButtonLink({
  children,
  className = "",
  href,
  icon,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${styles.button} ${styles[variant]} ${className}`.trim()}
      href={href}
      {...props}
    >
      <span>{children}</span>
      {icon}
    </Link>
  );
}

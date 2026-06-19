import { CheckIcon } from "@/components/ui/CheckIcon";
import styles from "./TrustBadge.module.css";

export function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className={styles.badge}>
      <span className={styles.icon}>
        <CheckIcon />
      </span>
      {children}
    </span>
  );
}

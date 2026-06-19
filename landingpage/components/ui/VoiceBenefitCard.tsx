import styles from "./VoiceBenefitCard.module.css";

interface VoiceBenefitCardProps {
  description: string;
  index: number;
  title: string;
}

export function VoiceBenefitCard({
  description,
  index,
  title
}: VoiceBenefitCardProps) {
  return (
    <article className={styles.card}>
      <span aria-hidden="true" className={styles.index}>
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

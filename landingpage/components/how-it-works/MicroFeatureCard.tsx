import styles from "./MicroFeatureCard.module.css";

export function MicroFeatureCard({
  children,
  description
}: {
  children: React.ReactNode;
  description: string;
}) {
  return (
    <article className={styles.card}>
      <span aria-hidden="true" className={styles.sparkle}>
        ✦
      </span>
      <div>
        <h3>{children}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

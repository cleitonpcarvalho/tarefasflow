import styles from "./VoiceFlow.module.css";

const steps = [
  { icon: "🎤", label: "Áudio" },
  { icon: "🧠", label: "IA" },
  { icon: "✅", label: "Tarefa" },
  { icon: "📅", label: "Agenda" }
];

export function VoiceFlow() {
  return (
    <div aria-label="Fluxo do áudio até a agenda" className={styles.flow}>
      {steps.map((step, index) => (
        <div className={styles.group} key={step.label}>
          <div className={styles.step}>
            <span aria-hidden="true" className={styles.icon}>
              {step.icon}
            </span>
            <span>{step.label}</span>
          </div>
          {index < steps.length - 1 ? (
            <span aria-hidden="true" className={styles.arrow}>
              ↓
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

import styles from "./ProcessFlow.module.css";

const processSteps = [
  { detail: "Você fala do seu jeito", label: "Mensagem" },
  { detail: "Datas e contexto fazem sentido", label: "IA entende" },
  { detail: "Tudo ganha lugar e horário", label: "Tarefa criada" },
  { detail: "O aviso chega na hora certa", label: "Lembrete enviado" }
];

export function ProcessFlow() {
  return (
    <div aria-label="Como uma mensagem vira uma tarefa" className={styles.flow}>
      {processSteps.map((step, index) => (
        <div className={styles.stepGroup} key={step.label}>
          <div className={styles.step}>
            <span className={styles.number}>{index + 1}</span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
          </div>
          {index < processSteps.length - 1 ? (
            <span aria-hidden="true" className={styles.arrow}>
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

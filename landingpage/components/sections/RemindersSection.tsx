"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./RemindersSection.module.css";

const benefits = [
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M9 1.5A4.5 4.5 0 0 1 13.5 6v3.5L15 12H3l1.5-2.5V6A4.5 4.5 0 0 1 9 1.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path d="M7.5 12a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M9 1.5v-1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    title: "Lembretes automáticos",
    description:
      "Receba avisos antes de compromissos importantes sem precisar configurar tudo manualmente."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <circle cx="9" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M6.5 7.5h5M6.5 10h3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M9 13.5v3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M6.5 16.5h5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    title: "Menos carga mental",
    description: "Pare de gastar energia tentando lembrar de tudo o tempo inteiro."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M9 2 3 4.5V9c0 3.5 2.5 6 6 7 3.5-1 6-3.5 6-7V4.5L9 2Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path
          d="M6.5 9l2 2 3-3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    title: "Mais tranquilidade",
    description:
      "Confie que suas tarefas estão registradas e que você será lembrado quando necessário."
  }
];

const timelineItems = ["15 min antes", "30 min antes", "1 hora antes", "1 dia antes"];

export function RemindersSection() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, scale: 0.98, y: 16 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.15, once: true },
        whileInView: { opacity: 1, scale: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="lembretes-title"
      className={styles.section}
      id="lembretes"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.content} {...reveal}>
            <header>
              <p className={styles.badge}>
                <span aria-hidden="true" className={styles.badgeDot} />
                Lembretes que realmente chegam até você
              </p>
              <h2 id="lembretes-title">
                Pare de depender da memória para lembrar o que é importante.
              </h2>
              <p className={styles.subheadline}>
                Compromissos, reuniões, prazos e tarefas não precisam mais ocupar
                espaço na sua cabeça. O TarefasFlow envia lembretes diretamente
                pelo WhatsApp para que você possa se concentrar no presente,
                sabendo que será avisado na hora certa.
              </p>
            </header>

            <ul className={styles.cards} role="list">
              {benefits.map((benefit) => (
                <li className={styles.card} key={benefit.title}>
                  <span aria-hidden="true" className={styles.cardIcon}>
                    {benefit.icon}
                  </span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.timeline} role="list">
              <p className={styles.timelineLabel}>Avise-me com antecedência de</p>
              <div className={styles.timelinePills}>
                {timelineItems.map((item, index) => (
                  <div className={styles.timelineItem} key={item} role="listitem">
                    <span className={styles.pill}>{item}</span>
                    {index < timelineItems.length - 1 && (
                      <span aria-hidden="true" className={styles.pillConnector}>
                        ↓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.article>

          <motion.figure className={styles.visual} {...reveal}>
            <div aria-hidden="true" className={styles.glow} />
            <div className={styles.imageFrame}>
              <Image
                alt="Central de lembretes automáticos do TarefasFlow integrada ao WhatsApp."
                className={styles.image}
                height={941}
                loading="lazy"
                priority={false}
                quality={92}
                sizes="(max-width: 799px) calc(100vw - 32px), (max-width: 1199px) 56vw, 740px"
                src="/images/05-reminders.png"
                width={1672}
              />

              <div className={`${styles.floatingCard} ${styles.reminderCard}`}>
                <span aria-hidden="true" className={styles.floatingIcon}>
                  🔔
                </span>
                <span>
                  <small>Próximo lembrete</small>
                  <strong>Consulta médica</strong>
                  <small className={styles.detail}>Hoje • 14:30</small>
                </span>
              </div>

              <div className={`${styles.floatingCard} ${styles.sentCard}`}>
                <span aria-hidden="true" className={styles.successDot}>
                  ✓
                </span>
                <span>
                  <strong>Lembrete enviado</strong>
                </span>
              </div>
            </div>
            <figcaption className="sr-only">
              Central de lembretes automáticos do TarefasFlow mostrando notificações
              enviadas pelo WhatsApp com antecedência configurável.
            </figcaption>
          </motion.figure>
        </div>
      </Container>
    </section>
  );
}

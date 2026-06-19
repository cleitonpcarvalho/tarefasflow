"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./RecurringTasksSection.module.css";

const benefits = [
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M9 2a7 7 0 0 1 6.06 3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M15.5 4.5 15 6.5l-2-.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path
          d="M9 16a7 7 0 0 1-6.06-3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M2.5 13.5 3 11.5l2 .5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    title: "Todos os dias",
    description: "Perfeito para hábitos, exercícios e tarefas de rotina."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect fill="currentColor" fillOpacity="0.28" height="9" rx="1" width="2.5" x="0.75" y="7" />
        <rect fill="currentColor" height="13" rx="1" width="2.5" x="4" y="3" />
        <rect fill="currentColor" fillOpacity="0.62" height="11" rx="1" width="2.5" x="7.75" y="5" />
        <rect fill="currentColor" fillOpacity="0.42" height="12" rx="1" width="2.5" x="11.5" y="4" />
        <rect fill="currentColor" fillOpacity="0.22" height="8" rx="1" width="2.5" x="15.25" y="8" />
      </svg>
    ),
    title: "Toda semana",
    description: "Organize reuniões, consultas e compromissos recorrentes."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect height="13" rx="2" stroke="currentColor" strokeWidth="1.4" width="15" x="1.5" y="2.5" />
        <line stroke="currentColor" strokeWidth="1.4" x1="1.5" x2="16.5" y1="6.5" y2="6.5" />
        <path
          d="M8.4 11.5h1.4V7.8H8.5M5 1v3M13 1v3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    title: "Todo mês",
    description: "Lembre-se automaticamente de pagamentos e eventos importantes."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M2 5h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <circle
          cx="6"
          cy="5"
          fill="white"
          r="2.2"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M2 13h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <circle
          cx="12"
          cy="13"
          fill="white"
          r="2.2"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    ),
    title: "Controle total",
    description: "Edite apenas uma ocorrência ou toda a série quando precisar."
  }
];

const frequencies = ["Diário", "Semanal", "Mensal", "Personalizado"];

export function RecurringTasksSection() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, scale: 0.98, y: 16 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.14, once: true },
        whileInView: { opacity: 1, scale: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="recorrencias-title"
      className={styles.section}
      id="recorrencias"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.content} {...reveal}>
            <header>
              <p className={styles.badge}>
                <span aria-hidden="true" className={styles.badgeDot} />
                Automatize sua rotina
              </p>
              <h2 id="recorrencias-title">
                Crie uma tarefa uma única vez e deixe o TarefasFlow cuidar das
                repetições.
              </h2>
              <p className={styles.subheadline}>
                Atividades que fazem parte da sua rotina não precisam ser
                recriadas toda semana. Configure uma vez e o TarefasFlow cuida
                automaticamente de recorrências diárias, semanais ou mensais
                para que você mantenha constância sem esforço.
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

            <div className={styles.flow}>
              <p className={styles.flowLabel}>Frequência disponível</p>
              <div className={styles.flowPills}>
                {frequencies.map((freq, index) => (
                  <div className={styles.flowItem} key={freq}>
                    <span className={styles.pill}>{freq}</span>
                    {index < frequencies.length - 1 && (
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
                alt="Tarefas recorrentes inteligentes do TarefasFlow para atividades diárias, semanais e mensais."
                className={styles.image}
                height={941}
                loading="lazy"
                priority={false}
                quality={92}
                sizes="(max-width: 799px) calc(100vw - 32px), (max-width: 1199px) 56vw, 740px"
                src="/images/06-recurring-tasks.png"
                width={1672}
              />

              <div className={`${styles.floatingCard} ${styles.gymCard}`}>
                <span aria-hidden="true" className={styles.floatingIcon}>
                  🔁
                </span>
                <span>
                  <small>Toda terça • 07:00</small>
                  <strong>🏋 Academia</strong>
                </span>
              </div>

              <div className={`${styles.floatingCard} ${styles.medCard}`}>
                <span aria-hidden="true" className={styles.floatingIcon}>
                  🔁
                </span>
                <span>
                  <small>Todo dia • 08:00</small>
                  <strong>💊 Medicamento</strong>
                </span>
              </div>
            </div>
            <figcaption className="sr-only">
              Painel de tarefas recorrentes do TarefasFlow mostrando atividades
              configuradas para repetição diária, semanal e mensal.
            </figcaption>
          </motion.figure>
        </div>
      </Container>
    </section>
  );
}

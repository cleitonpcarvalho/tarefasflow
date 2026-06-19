"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./SpecialDatesSection.module.css";

const benefits = [
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" width="14" x="2" y="9" />
        <path
          d="M5.5 9V6M9 9V5M12.5 9V6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <circle cx="5.5" cy="5.5" fill="currentColor" r="1" />
        <circle cx="9" cy="4.5" fill="currentColor" r="1" />
        <circle cx="12.5" cy="5.5" fill="currentColor" r="1" />
      </svg>
    ),
    title: "Aniversários",
    description:
      "Receba lembretes para nunca mais esquecer o aniversário de alguém importante."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect height="13" rx="2" stroke="currentColor" strokeWidth="1.4" width="15" x="1.5" y="2.5" />
        <line stroke="currentColor" strokeWidth="1.4" x1="1.5" x2="16.5" y1="6.5" y2="6.5" />
        <path
          d="M5 1v3M13 1v3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <path
          d="M9 13S6 11 6 9.5a1.5 1.5 0 0 1 3-.7 1.5 1.5 0 0 1 3 .7C12 11 9 13 9 13Z"
          fill="currentColor"
        />
      </svg>
    ),
    title: "Datas especiais",
    description:
      "Casamento, namoro, comemorações e momentos marcantes sempre ao seu alcance."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path
          d="M9 2v2.5M9 13.5V16M2 9h2.5M13.5 9H16M4.2 4.2l1.7 1.7M12.1 12.1l1.7 1.7M13.8 4.2 12.1 5.9M5.9 12.1l-1.7 1.7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    title: "Sugestões com IA",
    description:
      "Gere mensagens calorosas e humanizadas quando não souber o que escrever."
  }
];

const reminderIntervals = ["Hoje", "1 dia antes", "1 semana antes", "1 mês antes"];

export function SpecialDatesSection() {
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
      aria-labelledby="datas-title"
      className={styles.section}
      id="datas"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.content} {...reveal}>
            <header>
              <p className={styles.badge}>
                <span aria-hidden="true" className={styles.badgeDot} />
                Mais do que produtividade
              </p>
              <h2 id="datas-title">
                Lembre-se das pessoas importantes, não apenas das tarefas.
              </h2>
              <p className={styles.subheadline}>
                Aniversários, datas especiais e momentos importantes também fazem
                parte da sua rotina. O TarefasFlow ajuda você a se lembrar de
                quem realmente importa e ainda pode sugerir mensagens carinhosas
                para tornar cada ocasião mais especial.
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

            <div className={styles.timeline}>
              <p className={styles.timelineLabel}>Avise-me com antecedência</p>
              <div className={styles.timelinePills}>
                {reminderIntervals.map((interval, index) => (
                  <div className={styles.timelineItem} key={interval}>
                    <span className={styles.pill}>{interval}</span>
                    {index < reminderIntervals.length - 1 && (
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
                alt="Datas especiais e sugestões de mensagens inteligentes do TarefasFlow."
                className={styles.image}
                height={941}
                loading="lazy"
                priority={false}
                quality={92}
                sizes="(max-width: 799px) calc(100vw - 32px), (max-width: 1199px) 56vw, 740px"
                src="/images/07-special-dates.png"
                width={1672}
              />

              <div className={`${styles.floatingCard} ${styles.birthdayCard}`}>
                <span aria-hidden="true" className={`${styles.floatingIcon} ${styles.iconWarm}`}>
                  🎂
                </span>
                <span>
                  <strong>Aniversário da mãe</strong>
                  <small>Hoje</small>
                </span>
              </div>

              <div className={`${styles.floatingCard} ${styles.suggestionCard}`}>
                <span aria-hidden="true" className={`${styles.floatingIcon} ${styles.iconPrimary}`}>
                  ❤️
                </span>
                <span>
                  <strong>Sugestão pronta</strong>
                  <small>Mensagem gerada</small>
                </span>
              </div>
            </div>
            <figcaption className="sr-only">
              Painel de datas especiais do TarefasFlow com lembretes de
              aniversários e sugestão de mensagem gerada por inteligência
              artificial.
            </figcaption>
          </motion.figure>
        </div>
      </Container>
    </section>
  );
}

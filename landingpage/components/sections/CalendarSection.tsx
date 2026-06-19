"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./CalendarSection.module.css";

const views = [
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect height="13" rx="2" stroke="currentColor" strokeWidth="1.4" width="15" x="1.5" y="2.5" />
        <line stroke="currentColor" strokeWidth="1.4" x1="1.5" x2="16.5" y1="6.5" y2="6.5" />
        <circle cx="5" cy="10" fill="currentColor" r="1" />
        <circle cx="9" cy="10" fill="currentColor" r="1" />
        <circle cx="13" cy="10" fill="currentColor" r="1" />
        <circle cx="5" cy="13.5" fill="currentColor" r="1" />
        <circle cx="9" cy="13.5" fill="currentColor" r="1" />
        <path d="M5 1v3M13 1v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
    title: "Visão mensal",
    description:
      "Tenha uma visão ampla dos seus compromissos e identifique rapidamente os dias mais importantes."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect fill="currentColor" fillOpacity="0.3" height="9" rx="1" width="2.5" x="0.75" y="7" />
        <rect fill="currentColor" height="13" rx="1" width="2.5" x="4" y="3" />
        <rect fill="currentColor" fillOpacity="0.65" height="11" rx="1" width="2.5" x="7.75" y="5" />
        <rect fill="currentColor" fillOpacity="0.45" height="12" rx="1" width="2.5" x="11.5" y="4" />
        <rect fill="currentColor" fillOpacity="0.25" height="8" rx="1" width="2.5" x="15.25" y="8" />
      </svg>
    ),
    title: "Visão semanal",
    description:
      "Entenda como sua semana está distribuída e organize melhor sua rotina."
  },
  {
    icon: (
      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
        <rect fill="currentColor" height="2.5" rx="1" width="14" x="2" y="2" />
        <rect fill="currentColor" fillOpacity="0.65" height="2.5" rx="1" width="10" x="2" y="7" />
        <rect fill="currentColor" fillOpacity="0.35" height="2.5" rx="1" width="12" x="2" y="12.5" />
      </svg>
    ),
    title: "Visão diária",
    description:
      "Concentre-se apenas no que precisa ser feito hoje, com horários e prioridades bem definidos."
  }
];

export function CalendarSection() {
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
      aria-labelledby="calendario-title"
      className={styles.section}
      id="calendario"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.content} {...reveal}>
            <header>
              <p className={styles.badge}>
                <span aria-hidden="true" className={styles.badgeDot} />
                Visão completa da sua rotina
              </p>
              <h2 id="calendario-title">
                Veja seu dia, sua semana e seu mês com total clareza.
              </h2>
              <p className={styles.subheadline}>
                Converse pelo WhatsApp quando precisar de rapidez e utilize o
                calendário inteligente quando quiser visualizar tudo de forma
                organizada. O TarefasFlow reúne tarefas, compromissos,
                recorrências e lembretes em uma única visão simples e intuitiva.
              </p>
            </header>

            <ul className={styles.cards} role="list">
              {views.map((view) => (
                <li className={styles.card} key={view.title}>
                  <span aria-hidden="true" className={styles.cardIcon}>
                    {view.icon}
                  </span>
                  <div>
                    <h3>{view.title}</h3>
                    <p>{view.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.figure className={styles.visual} {...reveal}>
            <div aria-hidden="true" className={styles.glow} />
            <div className={styles.imageFrame}>
              <Image
                alt="Calendário inteligente do TarefasFlow com visualizações mensal, semanal e diária."
                className={styles.image}
                height={941}
                loading="lazy"
                priority={false}
                quality={92}
                sizes="(max-width: 799px) calc(100vw - 32px), (max-width: 1199px) 56vw, 740px"
                src="/images/04-calendar.png"
                width={1672}
              />
            </div>
            <figcaption className="sr-only">
              Calendário inteligente do TarefasFlow mostrando visualizações
              mensal, semanal e diária com tarefas e compromissos organizados.
            </figcaption>
          </motion.figure>
        </div>
      </Container>
    </section>
  );
}

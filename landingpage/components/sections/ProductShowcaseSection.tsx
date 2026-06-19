"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./ProductShowcaseSection.module.css";

const benefits = [
  {
    title: "Converse naturalmente",
    description:
      "Crie tarefas e compromissos pelo WhatsApp sem interromper o que está fazendo."
  },
  {
    title: "Visualize tudo com clareza",
    description:
      "Tenha uma visão completa da sua rotina com calendário e listas organizadas."
  },
  {
    title: "Não esqueça o que importa",
    description:
      "Receba lembretes automáticos e acompanhe suas próximas atividades."
  },
  {
    title: "Menos carga mental",
    description:
      "Registre tudo uma vez e tenha a tranquilidade de saber que sua agenda está organizada."
  }
];

export function ProductShowcaseSection() {
  const reduceMotion = useReducedMotion();

  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.1, once: true },
        whileInView: { opacity: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="produto-title"
      className={styles.section}
      id="produto"
    >
      <Container>
        {/* ── Header ───────────────────────────────── */}
        <motion.div className={styles.header} {...reveal}>
          <p className={styles.badge}>
            <span aria-hidden="true" className={styles.badgeDot} />
            Tudo em um só lugar
          </p>
          <h2 id="produto-title">
            Sua agenda no WhatsApp.
            <br />
            Sua organização completa na web.
          </h2>
          <p className={styles.paragraph}>
            Crie tarefas por mensagem ou áudio, receba lembretes
            automaticamente e acompanhe compromissos, recorrências e datas
            importantes em uma interface simples e organizada.
          </p>
        </motion.div>

        {/* ── Product image ────────────────────────── */}
        <motion.div className={styles.imageContainer} {...reveal}>
          <div aria-hidden="true" className={styles.glow} />
          <div className={styles.imageWrapper}>
            <div className={styles.imageFrame}>
              <Image
                alt="Interface completa do TarefasFlow com calendário, lista de tarefas e integração com WhatsApp."
                className={styles.image}
                height={941}
                loading="lazy"
                priority={false}
                quality={92}
                sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1239px) calc(100vw - 48px), 1192px"
                src="/images/09-dashboard-mobile.png"
                width={1672}
              />
            </div>

            {/* Floating chips — positioned at corners, away from central content */}
            <div className={`${styles.chip} ${styles.chipAgenda}`}>
              <span aria-hidden="true" className={styles.chipDotPurple} />
              Agenda
            </div>
            <div className={`${styles.chip} ${styles.chipWhatsApp}`}>
              <span aria-hidden="true" className={styles.chipDotGreen} />
              WhatsApp
            </div>
            <div className={`${styles.chip} ${styles.chipTarefas}`}>
              <span aria-hidden="true" className={styles.chipDotPurple} />
              Tarefas
            </div>
          </div>
        </motion.div>

        {/* ── Benefit cards ────────────────────────── */}
        <motion.ul className={styles.cards} role="list" {...reveal}>
          {benefits.map((benefit) => (
            <li className={styles.card} key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </li>
          ))}
        </motion.ul>

        {/* ── Mini statement ───────────────────────── */}
        <motion.p className={styles.statement} {...reveal}>
          Menos coisas na cabeça. Mais controle do seu dia.
        </motion.p>
      </Container>
    </section>
  );
}

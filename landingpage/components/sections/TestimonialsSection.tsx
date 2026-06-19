"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./TestimonialsSection.module.css";

const testimonials = [
  {
    initials: "MC",
    name: "Mariana Costa",
    role: "Consultora de Marketing",
    text: "Eu anotava tarefas em vários lugares diferentes. Hoje simplesmente mando uma mensagem no WhatsApp e sei que tudo está organizado.",
    avatarColor: "#6c5ce7"
  },
  {
    initials: "FA",
    name: "Felipe Andrade",
    role: "Corretor de Imóveis",
    text: "Os lembretes no WhatsApp mudaram completamente minha rotina. Não perco mais reuniões importantes.",
    avatarColor: "#4f8af5"
  },
  {
    initials: "JR",
    name: "Juliana Ribeiro",
    role: "Psicóloga",
    text: "As datas especiais e os resumos diários me ajudam a lembrar do que realmente importa.",
    avatarColor: "#e8608a"
  },
  {
    initials: "RL",
    name: "Ricardo Lima",
    role: "Empreendedor",
    text: "Parei de depender da memória. O TarefasFlow virou meu assistente pessoal.",
    avatarColor: "#2eb5a8"
  }
];

export function TestimonialsSection() {
  const reduceMotion = useReducedMotion();

  const headerReveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.2, once: true },
        whileInView: { opacity: 1, y: 0 }
      };

  const cardReveal = (index: number) =>
    reduceMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 16 },
          transition: {
            delay: index * 0.07,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const
          },
          viewport: { amount: 0.15, once: true },
          whileInView: { opacity: 1, y: 0 }
        };

  return (
    <section
      aria-labelledby="depoimentos-title"
      className={styles.section}
      id="depoimentos"
    >
      <Container>
        <motion.div className={styles.header} {...headerReveal}>
          <p className={styles.badge}>
            <span aria-hidden="true" className={styles.badgeDot} />
            Quem usa recomenda
          </p>
          <h2 id="depoimentos-title">
            Mais tranquilidade para organizar o dia.
          </h2>
          <p className={styles.paragraph}>
            O TarefasFlow foi criado para pessoas que precisam lembrar menos
            das tarefas e focar mais no que realmente importa.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {testimonials.map((t, index) => (
            <motion.article
              className={styles.card}
              key={t.name}
              {...cardReveal(index)}
            >
              <div
                aria-label="5 de 5 estrelas"
                className={styles.stars}
                role="img"
              >
                ★★★★★
              </div>
              <p className={styles.text}>&ldquo;{t.text}&rdquo;</p>
              <footer className={styles.author}>
                <span
                  aria-hidden="true"
                  className={styles.avatar}
                  style={{ background: t.avatarColor }}
                >
                  {t.initials}
                </span>
                <div>
                  <p className={styles.name}>{t.name}</p>
                  <p className={styles.role}>{t.role}</p>
                </div>
              </footer>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}

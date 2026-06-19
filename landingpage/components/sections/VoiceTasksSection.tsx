"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { VoiceFlow } from "@/components/sections/VoiceFlow";
import { Container } from "@/components/ui/Container";
import { VoiceBenefitCard } from "@/components/ui/VoiceBenefitCard";
import styles from "./VoiceTasksSection.module.css";

const benefits = [
  {
    description:
      "A IA interpreta informações importantes mesmo quando você fala de maneira natural.",
    title: "Entendimento de contexto"
  },
  {
    description:
      "Tarefas, horários e compromissos são identificados sem preenchimento manual.",
    title: "Extração automática"
  },
  {
    description:
      "O que foi dito em um simples áudio se transforma em tarefas prontas para execução.",
    title: "Agenda organizada"
  }
];

export function VoiceTasksSection() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, scale: 0.98, y: 16 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.18, once: true },
        whileInView: { opacity: 1, scale: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="audio-title"
      className={styles.section}
      id="audio"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.content} {...reveal}>
            <header>
              <p className={styles.badge}>
                <span aria-hidden="true" className={styles.badgeDot} />
                Áudios inteligentes
              </p>
              <h2 id="audio-title">
                Fale naturalmente. A IA transforma tudo em tarefas organizadas.
              </h2>
              <p className={styles.subheadline}>
                Não é preciso preencher formulários, abrir telas ou perder
                tempo organizando compromissos manualmente. Basta enviar uma
                mensagem de voz pelo WhatsApp e o TarefasFlow entende o
                contexto, identifica ações importantes e organiza sua agenda
                automaticamente.
              </p>
            </header>

            <div className={styles.benefits}>
              {benefits.map((benefit, index) => (
                <VoiceBenefitCard
                  description={benefit.description}
                  index={index + 1}
                  key={benefit.title}
                  title={benefit.title}
                />
              ))}
            </div>

            <VoiceFlow />
          </motion.article>

          <motion.figure className={styles.visual} {...reveal}>
            <div aria-hidden="true" className={styles.glow} />
            <div className={styles.imageFrame}>
              <Image
                alt="TarefasFlow transformando mensagens de voz do WhatsApp em tarefas e eventos no calendário."
                className={styles.image}
                height={941}
                loading="lazy"
                quality={92}
                sizes="(max-width: 799px) calc(100vw - 32px), (max-width: 1199px) 56vw, 740px"
                src="/images/03-voice-tasks.png"
                width={1672}
              />

              <div className={`${styles.floatingCard} ${styles.audioCard}`}>
                <span aria-hidden="true" className={styles.floatingIcon}>
                  🎤
                </span>
                <span>
                  <strong>Áudio compreendido</strong>
                  <small>Contexto e horários identificados</small>
                </span>
              </div>

              <div className={`${styles.floatingCard} ${styles.taskCard}`}>
                <span aria-hidden="true" className={styles.successDot}>
                  ✓
                </span>
                <span>
                  <strong>3 tarefas organizadas</strong>
                  <small>Prontas no calendário</small>
                </span>
              </div>
            </div>
            <figcaption className="sr-only">
              Um áudio enviado pelo WhatsApp é interpretado pelo TarefasFlow e
              convertido em tarefas distribuídas no calendário.
            </figcaption>
          </motion.figure>
        </div>
      </Container>
    </section>
  );
}

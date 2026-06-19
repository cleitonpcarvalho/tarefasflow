"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { MicroFeatureCard } from "@/components/how-it-works/MicroFeatureCard";
import { ProcessFlow } from "@/components/how-it-works/ProcessFlow";
import { Container } from "@/components/ui/Container";
import styles from "./HowItWorksSection.module.css";

const microFeatures = [
  {
    description: "Fale como você já fala. Não existem comandos para decorar.",
    title: "Escreva ou envie áudio"
  },
  {
    description: "Datas, horários e contexto viram uma tarefa clara no seu painel.",
    title: "Organize tudo automaticamente"
  },
  {
    description: "O aviso aparece no canal que você realmente acompanha durante o dia.",
    title: "Receba lembretes no WhatsApp"
  }
];

export function HowItWorksSection() {
  const reduceMotion = useReducedMotion();
  const entrance = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 18 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.2, once: true },
        whileInView: { opacity: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="como-funciona-title"
      className={styles.section}
      id="como-funciona"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.copy} {...entrance}>
            <p className={styles.eyebrow}>
              Simples como conversar no WhatsApp
            </p>
            <h2 id="como-funciona-title">
              Você fala. Sua rotina se organiza.
            </h2>

            <div className={styles.body}>
              <p>
                Você não precisa aprender mais um aplicativo complicado nem
                parar o que está fazendo para preencher campos.
              </p>
              <p>
                Escreva como falaria com uma pessoa ou mande um áudio. O
                TarefasFlow entende datas, horários e o contexto da conversa.
              </p>
              <p>
                Em segundos, tudo fica organizado e o lembrete chega pelo
                WhatsApp na hora certa.
              </p>
            </div>
          </motion.article>

          <motion.figure className={styles.visual} {...entrance}>
            <div className={styles.visualGlow} />
            <div className={styles.imageFrame}>
              <Image
                alt="Conversa no WhatsApp com o assistente de inteligência artificial TarefasFlow transformando mensagens em tarefas e lembretes"
                className={styles.image}
                height={941}
                loading="lazy"
                quality={92}
                sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1199px) 54vw, 680px"
                src="/images/02-whatsapp-ai.png"
                width={1672}
              />
            </div>
            <ProcessFlow />
            <figcaption className="sr-only">
              A mensagem enviada pelo usuário é interpretada pela IA,
              transformada em tarefa e acompanhada por um lembrete.
            </figcaption>
          </motion.figure>
        </div>

        <motion.div className={styles.features} {...entrance}>
          {microFeatures.map((feature) => (
            <MicroFeatureCard
              description={feature.description}
              key={feature.title}
            >
              {feature.title}
            </MicroFeatureCard>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

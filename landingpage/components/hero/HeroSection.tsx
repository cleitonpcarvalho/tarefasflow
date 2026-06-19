"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeroVideoEmbed } from "@/components/hero/HeroVideoEmbed";
import { TrustBadge } from "@/components/hero/TrustBadge";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { seoConfig } from "@/lib/seo";
import styles from "./HeroSection.module.css";

const trustItems = [
  "Sem curva de aprendizado",
  "Funciona pelo WhatsApp",
  "Áudio, texto e lembretes"
];

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="hero-title" className={styles.hero}>
      <div aria-hidden="true" className={styles.backgroundOrb} />
      <Container className={styles.grid}>
        <motion.article
          className={styles.content}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.52,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.08
              }
            }
          }}
        >
          <motion.p
            className={styles.eyebrow}
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <span aria-hidden="true" className={styles.eyebrowDot} />
            IA + WhatsApp para organizar sua rotina
          </motion.p>

          <motion.h1
            className={styles.title}
            id="hero-title"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Seu novo assistente de produtividade pessoal, direto no WhatsApp.
          </motion.h1>

          <motion.p
            className={styles.description}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Envie uma mensagem ou um áudio. O TarefasFlow transforma o que
            você disser em tarefas organizadas, acompanha seus compromissos e
            lembra você na hora certa. Sem formulários complicados e sem
            precisar guardar tudo na cabeça.
          </motion.p>

          <motion.div
            className={styles.actions}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <ButtonLink
              href={`${seoConfig.appUrl}/signup`}
              icon={<ArrowIcon />}
            >
              Testar agente grátis
            </ButtonLink>
          </motion.div>

          <motion.div
            aria-label="Benefícios rápidos"
            className={styles.trust}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
          >
            {trustItems.map((item) => (
              <TrustBadge key={item}>{item}</TrustBadge>
            ))}
          </motion.div>

          <motion.div
            className={styles.setupInfo}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
          >
            <span className={styles.setupItem}>
              <span aria-hidden="true">📱</span>
              Requer um segundo número de WhatsApp
            </span>
            <span className={styles.setupItem}>
              <span aria-hidden="true">🔗</span>
              Conexão simples via QR Code
            </span>
          </motion.div>
        </motion.article>

        <HeroVideoEmbed />
      </Container>
    </section>
  );
}

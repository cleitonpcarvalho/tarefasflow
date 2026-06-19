"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { PlayIcon } from "@/components/ui/PlayIcon";
import styles from "./HeroVisual.module.css";

interface HeroVisualProps {
  onPlay: () => void;
}

export function HeroVisual({ onPlay }: HeroVisualProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.figure
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={styles.figure}
      initial={{ opacity: 0, scale: 0.985, y: 18 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
        className={styles.float}
        transition={{
          duration: 7,
          ease: "easeInOut",
          repeat: Infinity
        }}
      >
        <div className={styles.glow} />
        <div className={styles.frame}>
          <Image
            alt="Painel do TarefasFlow com calendário, lista de tarefas e conversa com o agente no WhatsApp"
            className={styles.image}
            fetchPriority="high"
            height={941}
            priority
            quality={92}
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 54vw, 760px"
            src="/images/01-hero.png"
            width={1672}
          />
          <button
            aria-label="Assistir à demonstração do TarefasFlow"
            className={styles.playButton}
            onClick={onPlay}
            type="button"
          >
            <span className={styles.playIcon}>
              <PlayIcon />
            </span>
            <span>
              <strong>Ver o produto em ação</strong>
              <small>Demonstração rápida</small>
            </span>
          </button>
        </div>
      </motion.div>
      <figcaption className="sr-only">
        Uma visão integrada do calendário, das tarefas e do agente de
        produtividade no WhatsApp.
      </figcaption>
    </motion.figure>
  );
}

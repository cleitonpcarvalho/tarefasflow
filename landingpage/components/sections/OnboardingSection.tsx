"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./OnboardingSection.module.css";

const steps = [
  {
    title: "Crie sua primeira tarefa",
    description: "Experimente rapidamente como o TarefasFlow organiza compromissos."
  },
  {
    title: "Adicione uma data especial",
    description: "Cadastre pessoas e momentos importantes para receber lembretes."
  },
  {
    title: "Confirme seu WhatsApp",
    description: "Defina o número que poderá conversar com seu assistente."
  },
  {
    title: "Conecte o agente",
    description: "Escaneie o QR Code e comece a conversar."
  }
];

const benefits = [
  "Sem instalação complicada",
  "Configuração guiada",
  "Pronto em poucos minutos"
];

export function OnboardingSection() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, scale: 0.98, y: 16 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.13, once: true },
        whileInView: { opacity: 1, scale: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="onboarding-title"
      className={styles.section}
      id="onboarding"
    >
      <Container>
        <div className={styles.grid}>
          <motion.article className={styles.content} {...reveal}>
            <header>
              <p className={styles.badge}>
                <span aria-hidden="true" className={styles.badgeDot} />
                Configuração simples
              </p>
              <h2 id="onboarding-title">
                Comece em poucos minutos e deixe seu assistente pronto para
                ajudar.
              </h2>
              <p className={styles.subheadline}>
                O TarefasFlow acompanha você em cada etapa da configuração.
                Crie sua primeira tarefa, conecte seu assistente e comece a
                organizar sua rotina de forma simples e intuitiva.
              </p>
            </header>

            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li className={styles.step} key={step.title}>
                  <div className={styles.stepTrack}>
                    <span aria-hidden="true" className={styles.stepNumber}>
                      {index + 1}
                    </span>
                    {index < steps.length - 1 && (
                      <span aria-hidden="true" className={styles.stepLine} />
                    )}
                  </div>
                  <div className={styles.stepContent}>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <ul className={styles.benefits} role="list">
              {benefits.map((benefit) => (
                <li className={styles.benefit} key={benefit}>
                  <span aria-hidden="true" className={styles.benefitCheck}>
                    <svg fill="none" height="8" viewBox="0 0 9 8" width="9">
                      <path
                        d="M1.5 4l2 2 4-4"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.figure className={styles.visual} {...reveal}>
            <div aria-hidden="true" className={styles.glow} />
            <div className={styles.imageFrame}>
              <Image
                alt="Onboarding guiado do TarefasFlow para configuração do assistente de WhatsApp."
                className={styles.image}
                height={941}
                loading="lazy"
                priority={false}
                quality={92}
                sizes="(max-width: 799px) calc(100vw - 32px), (max-width: 1199px) 56vw, 740px"
                src="/images/08-onboarding.png"
                width={1672}
              />

              <div className={`${styles.floatingCard} ${styles.agentCard}`}>
                <span aria-hidden="true" className={styles.successDot}>✓</span>
                <span>
                  <strong>Agente ativo</strong>
                </span>
              </div>

              <div className={`${styles.floatingCard} ${styles.whatsappCard}`}>
                <span aria-hidden="true" className={styles.floatingIcon}>
                  📱
                </span>
                <span>
                  <strong>WhatsApp conectado</strong>
                  <small>Pronto para conversar</small>
                </span>
              </div>
            </div>
            <figcaption className="sr-only">
              Tela de onboarding do TarefasFlow mostrando as etapas de
              configuração do assistente de inteligência artificial no WhatsApp.
            </figcaption>
          </motion.figure>
        </div>
      </Container>
    </section>
  );
}

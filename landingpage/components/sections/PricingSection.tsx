"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@/components/ui/CheckIcon";
import { Container } from "@/components/ui/Container";
import { seoConfig } from "@/lib/seo";
import styles from "./PricingSection.module.css";

const benefits = [
  "Assistente de IA no WhatsApp",
  "Criação de tarefas por texto e áudio",
  "Lembretes automáticos",
  "Calendário mensal, semanal e diário",
  "Tarefas recorrentes avançadas",
  "Datas especiais e mensagens sugeridas",
  "Resumo diário pelo WhatsApp",
  "Painel web completo",
  "Números autorizados e permissões"
];

const setupRequirements = [
  "Requer um segundo número de WhatsApp",
  "Conexão simples via QR Code",
  "Configuração em poucos minutos"
];

export function PricingSection() {
  const reduceMotion = useReducedMotion();

  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.1, once: true },
        whileInView: { opacity: 1, y: 0 }
      };

  const cardReveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, scale: 0.97, y: 24 },
        transition: {
          delay: 0.1,
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1] as const
        },
        viewport: { amount: 0.1, once: true },
        whileInView: { opacity: 1, scale: 1, y: 0 }
      };

  return (
    <section
      aria-labelledby="precos-title"
      className={styles.section}
      id="precos"
    >
      <Container>
        <motion.div className={styles.header} {...reveal}>
          <p className={styles.badge}>
            <span aria-hidden="true" className={styles.badgeDot} />
            14 dias grátis
          </p>
          <h2 id="precos-title">
            Tudo o que você precisa para organizar sua rotina.
          </h2>
          <p className={styles.paragraph}>
            Crie tarefas pelo WhatsApp, receba lembretes automáticos e tenha
            uma visão completa da sua agenda em um único lugar.
          </p>
        </motion.div>

        <div className={styles.cardArea}>
          <div aria-hidden="true" className={styles.cardGlow} />

          <motion.div className={styles.cardWrapper} {...cardReveal}>
            <div className={styles.card}>
              {/* Trial badge */}
              <div className={styles.trialBadge}>
                <span aria-hidden="true" className={styles.trialDot} />
                14 dias grátis — sem cartão de crédito
              </div>

              {/* Price */}
              <div className={styles.priceRow}>
                <span aria-hidden="true" className={styles.currency}>R$</span>
                <span className={styles.amount}>29,97</span>
                <span className={styles.period}>/mês</span>
              </div>
              <p className={styles.noCard}>Sem cartão de crédito para começar.</p>

              <hr className={styles.divider} />

              {/* Benefits */}
              <ul className={styles.benefits} role="list">
                {benefits.map((benefit) => (
                  <li className={styles.benefitItem} key={benefit}>
                    <span aria-hidden="true" className={styles.checkCircle}>
                      <CheckIcon />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>

              {/* Setup requirements */}
              <div className={styles.setupGroup}>
                <p className={styles.setupGroupTitle}>Para começar, você vai precisar de:</p>
                <ul className={styles.setupList} role="list">
                  {setupRequirements.map((req) => (
                    <li className={styles.setupItem} key={req}>
                      <span aria-hidden="true" className={styles.setupDot} />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <hr className={styles.divider} />

              {/* CTA */}
              <a
                className={styles.cta}
                href={`${seoConfig.appUrl}/signup`}
              >
                Começar meus 14 dias grátis
              </a>
              <p className={styles.subtext}>
                Cancele quando quiser.{" "}
                <span className={styles.subtextAccent}>Sem compromisso.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

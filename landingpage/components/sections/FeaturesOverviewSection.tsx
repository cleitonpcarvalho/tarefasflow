"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { seoConfig } from "@/lib/seo";
import styles from "./FeaturesOverviewSection.module.css";

function IconWhatsApp() {
  return (
    <svg aria-hidden="true" fill="none" height={22} viewBox="0 0 22 22" width={22}>
      <path
        d="M11 2a9 9 0 0 1 7.794 13.525L20 20l-4.475-1.206A9 9 0 1 1 11 2z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
      <path
        d="M7.5 9.5h7M7.5 12.5h4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg aria-hidden="true" fill="none" height={22} viewBox="0 0 22 22" width={22}>
      <path
        d="M11 3a6 6 0 0 0-6 6v2.5L3.5 14h15L17 11.5V9a6 6 0 0 0-6-6z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.6}
      />
      <path
        d="M9 17a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.6}
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg aria-hidden="true" fill="none" height={22} viewBox="0 0 22 22" width={22}>
      <rect height={15} rx={2} stroke="currentColor" strokeWidth={1.6} width={17} x={2.5} y={4.5} />
      <path
        d="M2.5 8.5h17M7 2.5v4M15 2.5v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.6}
      />
      <circle cx={7.5} cy={13} fill="currentColor" r={1} />
      <circle cx={11} cy={13} fill="currentColor" r={1} />
      <circle cx={14.5} cy={13} fill="currentColor" r={1} />
    </svg>
  );
}

function IconGift() {
  return (
    <svg aria-hidden="true" fill="none" height={22} viewBox="0 0 22 22" width={22}>
      <rect height={10} rx={1.5} stroke="currentColor" strokeWidth={1.6} width={16} x={3} y={9} />
      <rect height={3} rx={1} stroke="currentColor" strokeWidth={1.6} width={14} x={4} y={6} />
      <path
        d="M11 6v13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.6}
      />
      <path
        d="M11 6c0 0-1.5-3.5-4-2.5S6 6 11 6z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
      <path
        d="M11 6c0 0 1.5-3.5 4-2.5S16 6 11 6z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
    </svg>
  );
}

function IconQrCode() {
  return (
    <svg aria-hidden="true" fill="none" height={22} viewBox="0 0 22 22" width={22}>
      {/* Top-left finder square */}
      <rect height={7} rx={1} stroke="currentColor" strokeWidth={1.6} width={7} x={2} y={2} />
      <rect fill="currentColor" height={3} width={3} x={4} y={4} />
      {/* Top-right finder square */}
      <rect height={7} rx={1} stroke="currentColor" strokeWidth={1.6} width={7} x={13} y={2} />
      <rect fill="currentColor" height={3} width={3} x={15} y={4} />
      {/* Bottom-left finder square */}
      <rect height={7} rx={1} stroke="currentColor" strokeWidth={1.6} width={7} x={2} y={13} />
      <rect fill="currentColor" height={3} width={3} x={4} y={15} />
      {/* QR data area (simplified dots) */}
      <rect fill="currentColor" height={2} width={2} x={13} y={13} />
      <rect fill="currentColor" height={2} width={2} x={17} y={13} />
      <rect fill="currentColor" height={2} width={2} x={15} y={15} />
      <rect fill="currentColor" height={2} width={2} x={13} y={17} />
      <rect fill="currentColor" height={2} width={2} x={17} y={17} />
    </svg>
  );
}

const features = [
  {
    description: "Converse naturalmente com a IA usando mensagens ou áudios.",
    Icon: IconWhatsApp,
    iconBg: "rgba(37, 211, 102, 0.1)",
    iconColor: "#1a9e54",
    title: "IA no WhatsApp"
  },
  {
    description: "Receba avisos na hora certa e acompanhe suas prioridades.",
    Icon: IconBell,
    iconBg: "rgba(79, 70, 229, 0.1)",
    iconColor: "var(--color-primary)",
    title: "Lembretes Inteligentes"
  },
  {
    description: "Visualize tarefas e compromissos em um painel simples e intuitivo.",
    Icon: IconCalendar,
    iconBg: "rgba(79, 70, 229, 0.1)",
    iconColor: "var(--color-primary)",
    title: "Agenda Organizada"
  },
  {
    description: "Nunca esqueça aniversários, compromissos ou momentos importantes.",
    Icon: IconGift,
    iconBg: "rgba(255, 127, 80, 0.1)",
    iconColor: "#c0522a",
    title: "Datas Especiais"
  },
  {
    description:
      "O TarefasFlow funciona em um segundo número de WhatsApp conectado por QR Code. Em poucos minutos seu agente já está pronto para conversar.",
    Icon: IconQrCode,
    iconBg: "rgba(79, 70, 229, 0.08)",
    iconColor: "var(--color-primary)",
    title: "Número dedicado para o agente"
  }
];

export function FeaturesOverviewSection() {
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
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1] as const
          },
          viewport: { amount: 0.15, once: true },
          whileInView: { opacity: 1, y: 0 }
        };

  return (
    <section
      aria-labelledby="recursos-title"
      className={styles.section}
      id="recursos"
    >
      <Container>
        <motion.div className={styles.header} {...headerReveal}>
          <h2 id="recursos-title">
            Tudo o que você precisa para organizar sua rotina em um só lugar.
          </h2>
          <p className={styles.subheadline}>
            Converse com a IA pelo WhatsApp, receba lembretes, acompanhe suas
            tarefas e nunca mais esqueça compromissos importantes.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <motion.article
              className={styles.card}
              key={feature.title}
              {...cardReveal(index)}
            >
              <span
                aria-hidden="true"
                className={styles.iconWrap}
                style={{
                  background: feature.iconBg,
                  color: feature.iconColor
                }}
              >
                <feature.Icon />
              </span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
            </motion.article>
          ))}
        </div>

        <motion.div className={styles.ctaWrap} {...headerReveal}>
          <ButtonLink
            href={`${seoConfig.appUrl}/signup`}
            icon={<ArrowIcon />}
          >
            Começar gratuitamente
          </ButtonLink>
        </motion.div>
      </Container>
    </section>
  );
}

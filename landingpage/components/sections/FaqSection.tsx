"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import styles from "./FaqSection.module.css";

const faqs = [
  {
    answer:
      "Você cria tarefas enviando mensagens de texto ou áudio para o assistente pelo WhatsApp. A IA interpreta o que você disse, organiza suas tarefas e envia lembretes no momento certo. Tudo em linguagem natural, sem comandos para decorar.",
    question: "Como o TarefasFlow funciona?"
  },
  {
    answer:
      "Não. O TarefasFlow funciona diretamente pelo WhatsApp, que você já usa. O painel web complementar está disponível em qualquer navegador, sem instalação ou configuração extra.",
    question: "Preciso baixar algum aplicativo?"
  },
  {
    answer:
      "Sim. Os primeiros 14 dias são completamente gratuitos, sem precisar informar cartão de crédito. Você só assina se gostar do produto.",
    question: "O período de teste é realmente grátis?"
  },
  {
    answer:
      "Qualquer tipo: compromissos, lembretes pontuais, tarefas recorrentes, datas especiais, listas de afazeres. Basta descrever em linguagem natural, como faria com uma pessoa.",
    question: "Quais tipos de tarefas posso criar?"
  },
  {
    answer:
      "Sim, sem burocracia. Cancele pelo painel a qualquer momento. O acesso segue disponível até o fim do período pago. Nenhuma multa ou carência.",
    question: "Posso cancelar quando quiser?"
  },
  {
    answer:
      "Sim. Seus dados são armazenados com segurança e nunca compartilhados com terceiros. Você pode solicitar a exclusão completa da sua conta a qualquer momento pelo painel.",
    question: "Meus dados estão seguros?"
  }
];

function ChevronIcon() {
  return (
    <svg aria-hidden="true" fill="none" height={18} viewBox="0 0 18 18" width={18}>
      <path
        d="M4.5 6.75 9 11.25l4.5-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </svg>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const headerReveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        viewport: { amount: 0.2, once: true },
        whileInView: { opacity: 1, y: 0 }
      };

  function handleToggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <section
      aria-labelledby="faq-title"
      className={styles.section}
      id="faq"
    >
      <Container>
        <motion.div className={styles.header} {...headerReveal}>
          <p className={styles.badge}>
            <span aria-hidden="true" className={styles.badgeDot} />
            Perguntas frequentes
          </p>
          <h2 id="faq-title">Ficou alguma dúvida?</h2>
          <p className={styles.paragraph}>
            Se precisar de mais ajuda, fale com a gente pelo WhatsApp ou por
            e-mail.
          </p>
        </motion.div>

        <div className={styles.list} role="list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div className={styles.item} key={faq.question} role="listitem">
                <button
                  aria-controls={`faq-answer-${index}`}
                  aria-expanded={isOpen}
                  className={styles.trigger}
                  onClick={() => handleToggle(index)}
                  type="button"
                >
                  <span className={styles.question}>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                  >
                    <ChevronIcon />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                      }
                    >
                      <p className={styles.answer}>{faq.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

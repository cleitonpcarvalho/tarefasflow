import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { seoConfig } from "@/lib/seo";
import styles from "./PreFaqCtaSection.module.css";

export function PreFaqCtaSection() {
  return (
    <section
      aria-labelledby="pre-faq-cta-title"
      className={styles.section}
    >
      <Container>
        <div className={styles.card}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Comece sem compromisso</p>
            <h2 id="pre-faq-cta-title">
              Sua rotina pode ficar mais leve a partir de hoje.
            </h2>
          </div>

          <ButtonLink
            className={styles.button}
            href={`${seoConfig.appUrl}/signup`}
            icon={<ArrowIcon />}
          >
            Criar minha conta grátis
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

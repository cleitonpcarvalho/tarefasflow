import { BrandLogo } from "@/components/brand/BrandLogo";
import { Container } from "@/components/ui/Container";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <BrandLogo />
        <p>© 2026 TarefasFlow. Produtividade sem atrito.</p>
      </Container>
    </footer>
  );
}

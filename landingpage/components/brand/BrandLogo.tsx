import Image from "next/image";
import Link from "next/link";
import styles from "./BrandLogo.module.css";

interface BrandLogoProps {
  linked?: boolean;
}

export function BrandLogo({ linked = true }: BrandLogoProps) {
  const content = (
    <>
      <Image
        alt=""
        className={styles.icon}
        height={26}
        priority
        src="/brand/favicon.png"
        width={32}
      />
      <span className={styles.wordmark}>TarefasFlow</span>
    </>
  );

  if (!linked) {
    return (
      <span aria-label="TarefasFlow" className={styles.logo}>
        {content}
      </span>
    );
  }

  return (
    <Link aria-label="Página inicial do TarefasFlow" className={styles.logo} href="/">
      {content}
    </Link>
  );
}

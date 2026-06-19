"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Container } from "@/components/ui/Container";
import { seoConfig } from "@/lib/seo";
import styles from "./SiteHeader.module.css";

const navigationItems = [
  { href: "#como-funciona", id: "como-funciona", label: "Como funciona" },
  { href: "#produto", id: "produto", label: "Produto" },
  { href: "#depoimentos", id: "depoimentos", label: "Depoimentos" },
  { href: "#precos", id: "precos", label: "Preços" },
  { href: "#faq", id: "faq", label: "FAQ" }
] as const;

export function SiteHeader() {
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = navigationItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return;
    }

    let frameId = 0;

    function updateActiveSection() {
      const probePosition = window.innerHeight * 0.32;
      const currentSection = sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= probePosition && bounds.bottom > probePosition;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    }

    function handleScroll() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateActiveSection);
    }

    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleNavigation(id: string) {
    if (document.getElementById(id)) {
      setActiveSection(id);
    }
    setMenuOpen(false);
  }

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
    >
      <Container className={styles.inner}>
        <BrandLogo />

        <nav aria-label="Navegação principal" className={styles.desktopNav}>
          {navigationItems.map((item) => (
            <NavigationLink
              active={activeSection === item.id}
              item={item}
              key={item.id}
              onNavigate={handleNavigation}
            />
          ))}
        </nav>

        <div className={styles.actions}>
          <a className={styles.login} href={`${seoConfig.appUrl}/login`}>
            Entrar
          </a>
          <a className={styles.tryButton} href={`${seoConfig.appUrl}/signup`}>
            Testar grátis
          </a>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            className={styles.menuButton}
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <span className={menuOpen ? styles.menuLineTopOpen : styles.menuLine} />
            <span className={menuOpen ? styles.menuLineMiddleOpen : styles.menuLine} />
            <span className={menuOpen ? styles.menuLineBottomOpen : styles.menuLine} />
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Fechar menu"
              className={styles.mobileBackdrop}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              transition={{ duration: 0.2 }}
              type="button"
            />
            <motion.nav
              animate={{ opacity: 1, y: 0, scale: 1 }}
              aria-label="Navegação mobile"
              className={styles.mobileNav}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              id="mobile-navigation"
              initial={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {navigationItems.map((item) => (
                <NavigationLink
                  active={activeSection === item.id}
                  item={item}
                  key={item.id}
                  mobile
                  onNavigate={handleNavigation}
                />
              ))}
              <div className={styles.mobileActions}>
                <a href={`${seoConfig.appUrl}/login`}>Entrar</a>
                <a href={`${seoConfig.appUrl}/signup`}>Testar agente grátis</a>
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function NavigationLink({
  active,
  item,
  mobile = false,
  onNavigate
}: {
  active: boolean;
  item: (typeof navigationItems)[number];
  mobile?: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <a
      aria-current={active ? "location" : undefined}
      className={[
        styles.navLink,
        active ? styles.navLinkActive : "",
        mobile ? styles.mobileNavLink : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-nav-id={item.id}
      href={item.href}
      onClick={() => onNavigate(item.id)}
    >
      {item.label}
    </a>
  );
}

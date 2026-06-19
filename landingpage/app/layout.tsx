import type { Metadata, Viewport } from "next";
import { Josefin_Sans, Nunito } from "next/font/google";
import { StructuredData } from "@/components/seo/StructuredData";
import { seoConfig } from "@/lib/seo";
import "./globals.css";

const headingFont = Josefin_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["600", "700"]
});

const bodyFont = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.title,
    template: `%s | ${seoConfig.name}`
  },
  description: seoConfig.description,
  applicationName: seoConfig.name,
  authors: [{ name: seoConfig.name, url: seoConfig.siteUrl }],
  creator: seoConfig.name,
  publisher: seoConfig.name,
  category: "productivity",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: seoConfig.name,
    title: seoConfig.title,
    description: seoConfig.description,
    images: [
      {
        url: "/images/01-hero.png",
        width: 1672,
        height: 941,
        alt: "TarefasFlow no calendário web e no WhatsApp"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.title,
    description: seoConfig.description,
    images: ["/images/01-hero.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${headingFont.variable} ${bodyFont.variable}`}
      lang="pt-BR"
    >
      <body>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}

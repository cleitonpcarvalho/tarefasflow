export const seoConfig = {
  name: "TarefasFlow",
  siteUrl: "https://tarefasflow.com.br",
  appUrl: "https://app.tarefasflow.com.br",
  title: "TarefasFlow | Assistente de produtividade no WhatsApp",
  description:
    "Crie tarefas por texto ou áudio, organize lembretes e acompanhe sua rotina com um assistente pessoal de IA direto no WhatsApp."
} as const;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: seoConfig.name,
  url: seoConfig.siteUrl,
  logo: `${seoConfig.siteUrl}/icon.svg`,
  email: "contato@tarefasflow.com.br"
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: seoConfig.name,
  url: seoConfig.siteUrl,
  inLanguage: "pt-BR",
  description: seoConfig.description,
  publisher: {
    "@type": "Organization",
    name: seoConfig.name,
    url: seoConfig.siteUrl
  }
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: seoConfig.name,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web, WhatsApp",
  inLanguage: "pt-BR",
  description: seoConfig.description,
  url: seoConfig.siteUrl,
  offers: {
    "@type": "Offer",
    price: "29.97",
    priceCurrency: "BRL",
    description: "14 dias de avaliação gratuita incluídos. Sem cartão de crédito."
  }
};

// Placeholder deliberadamente não publicado. O FAQ schema deve entrar apenas
// quando as perguntas e respostas também estiverem visíveis na página.
export const faqSchemaPlaceholder = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: []
};

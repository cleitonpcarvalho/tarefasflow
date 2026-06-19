"use client";

import Image from "next/image";

const collectedData = [
  "Nome completo",
  "Endereço de e-mail",
  "Número de WhatsApp",
  "Tarefas, lembretes e compromissos cadastrados",
  "Data e horário de acesso à plataforma"
];

const dataUses = [
  "Operar e personalizar o serviço de gerenciamento de tarefas",
  "Enviar lembretes automáticos de compromissos via WhatsApp",
  "Enviar resumos diários de tarefas via WhatsApp",
  "Enviar comunicações de ativação e suporte durante o período de avaliação por WhatsApp e e-mail",
  "Enviar avisos sobre renovação e vencimento do plano por WhatsApp e e-mail"
];

const services = [
  "Supabase — armazenamento de dados",
  "OpenAI — processamento de linguagem natural pelo agente IA",
  "Resend — envio de e-mails transacionais",
  "Evolution API — envio de mensagens via WhatsApp"
];

const rights = [
  "Confirmar a existência de tratamento dos seus dados",
  "Acessar seus dados",
  "Corrigir dados incompletos ou desatualizados",
  "Solicitar a exclusão dos seus dados",
  "Revogar o consentimento a qualquer momento"
];

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-[#6B7280] marker:text-[#534AB7] dark:text-tf-dark-text-muted dark:marker:text-tf-dark-text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main
      className="min-h-screen bg-[#F8F7FF] px-4 py-8 dark:bg-tf-dark-bg-page sm:py-12"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <article
        className="mx-auto w-full max-w-[720px] rounded-2xl bg-white p-12 dark:bg-tf-dark-bg-card"
        style={{ boxShadow: "0 12px 40px rgba(15,23,42,0.08)" }}
      >
        <div className="mb-8 flex justify-center dark:text-tf-dark-text-primary">
          <Image src="/logo-light.png" width={140} height={42} alt="TarefasFlow" priority />
        </div>

        <button
          className="mb-8 border-0 bg-transparent p-0 text-sm font-medium text-[#534AB7] transition hover:underline dark:text-tf-dark-text-muted"
          onClick={() => window.history.back()}
          type="button"
        >
          ← Voltar
        </button>

        <header className="mb-8 border-b border-[#E5E7EB] pb-6 dark:border-tf-dark-border">
          <h1 className="text-2xl font-bold text-[#534AB7] dark:text-tf-dark-text-primary sm:text-3xl">
            TarefasFlow — Política de Privacidade
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] dark:text-tf-dark-text-muted">
            Última atualização: junho de 2026
          </p>
        </header>

        <div className="space-y-7 text-[15px] leading-[1.7] text-[#6B7280] dark:text-tf-dark-text-muted">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              1. Introdução
            </h2>
            <p>
              Esta política descreve como o TarefasFlow coleta, usa, armazena e protege seus dados
              pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
              13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              2. Dados que Coletamos
            </h2>
            <TextList items={collectedData} />
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              3. Como Usamos seus Dados
            </h2>
            <p>Seus dados são utilizados exclusivamente para:</p>
            <TextList items={dataUses} />
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              4. Comunicações por WhatsApp e E-mail
            </h2>
            <p>
              Ao se cadastrar no TarefasFlow, você autoriza o recebimento de mensagens automáticas
              pelo número de WhatsApp e e-mail informados no cadastro. Essas comunicações incluem
              lembretes de tarefas, resumos diários, mensagens de suporte durante a ativação e avisos
              sobre seu plano.
            </p>
            <p className="mt-4">
              Para interromper o recebimento dessas comunicações a qualquer momento, envie um e-mail
              para contato@tarefasflow.com.br com o assunto &quot;Cancelar comunicações&quot;. Seu
              pedido será processado em até 48 horas.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              5. Base Legal
            </h2>
            <p>
              O tratamento dos seus dados está fundamentado no consentimento explícito fornecido no
              momento do cadastro (Art. 7º, I da LGPD) e na execução do contrato de prestação de
              serviços (Art. 7º, V da LGPD).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              6. Compartilhamento de Dados
            </h2>
            <p>
              Seus dados não são vendidos ou compartilhados com terceiros para fins comerciais.
              Utilizamos os seguintes serviços para operação da plataforma:
            </p>
            <TextList items={services} />
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              7. Segurança
            </h2>
            <p>
              Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não
              autorizado, perda ou alteração, incluindo criptografia de senhas e comunicações via
              HTTPS.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              8. Seus Direitos
            </h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <TextList items={rights} />
            <p className="mt-4">
              Para exercer esses direitos, entre em contato pelo e-mail contato@tarefasflow.com.br.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              9. Retenção de Dados
            </h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento, os dados
              são excluídos em até 30 dias.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              10. Contato
            </h2>
            <p>Responsável pelos dados: contato@tarefasflow.com.br</p>
          </section>
        </div>
      </article>
    </main>
  );
}

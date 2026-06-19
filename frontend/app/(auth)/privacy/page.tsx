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
  "Supabase: armazenamento de dados",
  "OpenAI: processamento de linguagem natural pelo agente IA",
  "Resend: envio de e-mails transacionais",
  "Evolution API: envio de mensagens via WhatsApp"
];

const rights = [
  "Confirmar a existência de tratamento dos seus dados",
  "Acessar seus dados",
  "Corrigir dados incompletos ou desatualizados",
  "Solicitar a exclusão dos seus dados",
  "Revogar o consentimento a qualquer momento"
];

const sectionTitleClass = "text-base font-semibold text-[#534AB7]";
const bodyClass = "mt-3 text-[15px] leading-[1.8] text-[#4B5563]";

function TextList({ items }: { items: string[] }) {
  return (
    <ul
      className="mt-3 list-disc space-y-1 text-[15px] leading-[1.8] text-[#4B5563] marker:text-[#534AB7]"
      style={{ paddingLeft: 20 }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF]">
      <div className="mx-auto max-w-[740px] px-6 py-[60px]">
        <header>
          <div className="flex justify-center">
            <Image src="/logo-light.png" width={140} height={42} alt="TarefasFlow" priority />
          </div>

          <div className="my-8 h-px bg-[#E5E7EB]" />

          <button
            onClick={() => window.history.back()}
            style={{
              color: "#534AB7",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              padding: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
            type="button"
          >
            ← Voltar
          </button>

          <h1 className="text-[28px] font-bold leading-tight text-[#1A1A2E]">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-[13px] text-[#9CA3AF]">
            Última atualização: junho de 2026
          </p>
        </header>

        <div className="mt-10">
          <section>
            <h2 className={sectionTitleClass}>1. Introdução</h2>
            <p className={bodyClass}>
              Esta política descreve como o TarefasFlow coleta, usa, armazena e protege seus dados
              pessoais, em conformidade com a Lei Geral de Proteção de Dados, LGPD, Lei nº
              13.709/2018.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>2. Dados que Coletamos</h2>
            <TextList items={collectedData} />
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>3. Como Usamos seus Dados</h2>
            <p className={bodyClass}>Seus dados são utilizados exclusivamente para:</p>
            <TextList items={dataUses} />
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>4. Comunicações por WhatsApp e E-mail</h2>
            <p className={bodyClass}>
              Ao se cadastrar no TarefasFlow, você autoriza o recebimento de mensagens automáticas
              pelo número de WhatsApp e e-mail informados no cadastro. Essas comunicações incluem
              lembretes de tarefas, resumos diários, mensagens de suporte durante a ativação e avisos
              sobre seu plano.
            </p>
            <p className={bodyClass}>
              Para interromper o recebimento dessas comunicações a qualquer momento, envie um e-mail
              para contato@tarefasflow.com.br com o assunto &quot;Cancelar comunicações&quot;. Seu
              pedido será processado em até 48 horas.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>5. Base Legal</h2>
            <p className={bodyClass}>
              O tratamento dos seus dados está fundamentado no consentimento explícito fornecido no
              momento do cadastro (Art. 7º, I da LGPD) e na execução do contrato de prestação de
              serviços (Art. 7º, V da LGPD).
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>6. Compartilhamento de Dados</h2>
            <p className={bodyClass}>
              Seus dados não são vendidos ou compartilhados com terceiros para fins comerciais.
              Utilizamos os seguintes serviços para operação da plataforma:
            </p>
            <TextList items={services} />
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>7. Segurança</h2>
            <p className={bodyClass}>
              Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não
              autorizado, perda ou alteração, incluindo criptografia de senhas e comunicações via
              HTTPS.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>8. Seus Direitos</h2>
            <p className={bodyClass}>De acordo com a LGPD, você tem direito a:</p>
            <TextList items={rights} />
            <p className={bodyClass}>
              Para exercer esses direitos, entre em contato pelo e-mail contato@tarefasflow.com.br.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>9. Retenção de Dados</h2>
            <p className={bodyClass}>
              Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento, os dados
              são excluídos em até 30 dias.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>10. Contato</h2>
            <p className={bodyClass}>Responsável pelos dados: contato@tarefasflow.com.br</p>
          </section>
        </div>

        <footer className="mt-12 border-t border-[#E5E7EB] pt-6 text-center text-xs text-[#9CA3AF]">
          © 2026 TarefasFlow · contato@tarefasflow.com.br
        </footer>
      </div>
    </main>
  );
}

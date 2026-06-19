"use client";

import Image from "next/image";

export default function TermsPage() {
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
            TarefasFlow — Termos de Uso
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] dark:text-tf-dark-text-muted">
            Última atualização: junho de 2026
          </p>
        </header>

        <div className="space-y-7 text-[15px] leading-[1.7] text-[#6B7280] dark:text-tf-dark-text-muted">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao criar uma conta no TarefasFlow, você concorda com estes Termos de Uso. Se não
              concordar, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              2. O Serviço
            </h2>
            <p>
              O TarefasFlow é uma plataforma de gerenciamento de tarefas e compromissos com agente
              de inteligência artificial integrado ao WhatsApp. O serviço permite criar tarefas,
              configurar lembretes e receber notificações automáticas.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              3. Conta e Responsabilidades
            </h2>
            <p>
              Você é responsável por manter a confidencialidade de suas credenciais de acesso e por
              todas as atividades realizadas em sua conta. Informe-nos imediatamente sobre qualquer
              uso não autorizado em contato@tarefasflow.com.br.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              4. Período Gratuito
            </h2>
            <p>
              O TarefasFlow oferece um período de avaliação gratuita de 14 dias a partir da data do
              cadastro. Após esse período, a continuidade do serviço está condicionada à contratação
              de um plano pago.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              5. Uso Aceitável
            </h2>
            <p>
              Você concorda em utilizar o serviço apenas para fins lícitos e pessoais. É proibido
              utilizar o TarefasFlow para envio de spam, atividades ilegais ou qualquer uso que
              prejudique outros usuários ou o funcionamento da plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              6. Disponibilidade
            </h2>
            <p>
              O TarefasFlow se esforça para manter o serviço disponível continuamente, mas não
              garante disponibilidade ininterrupta. Podemos realizar manutenções programadas ou não
              programadas sem aviso prévio.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              7. Cancelamento
            </h2>
            <p>
              Você pode cancelar sua conta a qualquer momento enviando um e-mail para
              contato@tarefasflow.com.br. Após o cancelamento, seus dados serão excluídos em até 30
              dias.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              8. Modificações
            </h2>
            <p>
              Podemos atualizar estes termos a qualquer momento. Alterações significativas serão
              comunicadas por e-mail com antecedência mínima de 7 dias.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#1A1A2E] dark:text-tf-dark-text-primary">
              9. Contato
            </h2>
            <p>Dúvidas sobre estes termos: contato@tarefasflow.com.br</p>
          </section>
        </div>
      </article>
    </main>
  );
}

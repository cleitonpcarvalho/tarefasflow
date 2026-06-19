"use client";

import Image from "next/image";
import Link from "next/link";

const sectionTitleClass = "text-base font-semibold text-[#534AB7]";
const bodyClass = "mt-3 text-[15px] leading-[1.8] text-[#4B5563]";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF]">
      <div className="mx-auto max-w-[740px] px-6 py-[60px]">
        <header>
          <div className="flex justify-center">
            <Image src="/logo-light.png" width={140} height={42} alt="TarefasFlow" priority />
          </div>

          <div className="my-8 h-px bg-[#E5E7EB]" />

          <Link
            href="/signup"
            style={{
              color: "#534AB7",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 24,
              textDecoration: "none"
            }}
          >
            ← Voltar para o cadastro
          </Link>

          <h1 className="text-[28px] font-bold leading-tight text-[#1A1A2E]">Termos de Uso</h1>
          <p className="mt-2 text-[13px] text-[#9CA3AF]">
            Última atualização: junho de 2026
          </p>
        </header>

        <div className="mt-10">
          <section>
            <h2 className={sectionTitleClass}>1. Aceitação dos Termos</h2>
            <p className={bodyClass}>
              Ao criar uma conta no TarefasFlow, você concorda com estes Termos de Uso. Se não
              concordar, não utilize o serviço.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>2. O Serviço</h2>
            <p className={bodyClass}>
              O TarefasFlow é uma plataforma de gerenciamento de tarefas e compromissos com agente
              de inteligência artificial integrado ao WhatsApp. O serviço permite criar tarefas,
              configurar lembretes e receber notificações automáticas.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>3. Conta e Responsabilidades</h2>
            <p className={bodyClass}>
              Você é responsável por manter a confidencialidade de suas credenciais de acesso e por
              todas as atividades realizadas em sua conta. Informe-nos imediatamente sobre qualquer
              uso não autorizado em contato@tarefasflow.com.br.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>4. Período Gratuito</h2>
            <p className={bodyClass}>
              O TarefasFlow oferece um período de avaliação gratuita de 14 dias a partir da data do
              cadastro. Após esse período, a continuidade do serviço está condicionada à contratação
              de um plano pago.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>5. Uso Aceitável</h2>
            <p className={bodyClass}>
              Você concorda em utilizar o serviço apenas para fins lícitos e pessoais. É proibido
              utilizar o TarefasFlow para envio de spam, atividades ilegais ou qualquer uso que
              prejudique outros usuários ou o funcionamento da plataforma.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>6. Disponibilidade</h2>
            <p className={bodyClass}>
              O TarefasFlow se esforça para manter o serviço disponível continuamente, mas não
              garante disponibilidade ininterrupta. Podemos realizar manutenções programadas ou não
              programadas sem aviso prévio.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>7. Cancelamento</h2>
            <p className={bodyClass}>
              Você pode cancelar sua conta a qualquer momento enviando um e-mail para
              contato@tarefasflow.com.br. Após o cancelamento, seus dados serão excluídos em até 30
              dias.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>8. Modificações</h2>
            <p className={bodyClass}>
              Podemos atualizar estes termos a qualquer momento. Alterações significativas serão
              comunicadas por e-mail com antecedência mínima de 7 dias.
            </p>
          </section>

          <hr className="my-10 border-0 border-t border-[#F3F4F6]" />

          <section>
            <h2 className={sectionTitleClass}>9. Contato</h2>
            <p className={bodyClass}>Dúvidas sobre estes termos: contato@tarefasflow.com.br</p>
          </section>
        </div>

        <footer className="mt-12 border-t border-[#E5E7EB] pt-6 text-center text-xs text-[#9CA3AF]">
          © 2026 TarefasFlow · contato@tarefasflow.com.br
        </footer>
      </div>
    </main>
  );
}

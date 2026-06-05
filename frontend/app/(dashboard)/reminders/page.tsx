import { BellRing, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const reminderRows = [
  { id: "1", task: "Revisar agenda da semana", time: "15 min antes" },
  { id: "2", task: "Confirmar lembretes automaticos", time: "30 min antes" }
];

export default function RemindersPage() {
  return (
    <section className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Lembretes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configuracoes iniciais para avisos programados.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEEDFE] text-[#534AB7]">
            <BellRing className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-950">
            Padrao de envio
          </h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              WhatsApp
              <input className="h-4 w-4 accent-[#534AB7]" type="checkbox" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              Email
              <input className="h-4 w-4 accent-[#534AB7]" type="checkbox" />
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {reminderRows.map((row) => (
            <div
              className="flex items-center justify-between border-b border-slate-100 px-4 py-4 last:border-b-0"
              key={row.id}
            >
              <div>
                <p className="text-sm font-medium text-slate-950">{row.task}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {row.time}
                </p>
              </div>
              <Badge variant="teal">Ativo</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

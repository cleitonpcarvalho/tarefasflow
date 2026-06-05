import { Badge } from "@/components/ui/Badge";

const users = [
  {
    id: "1",
    name: "Admin TaskFlow",
    email: "admin@taskflow.local",
    role: "admin"
  },
  {
    id: "2",
    name: "Usuario Demo",
    email: "user@taskflow.local",
    role: "user"
  }
];

export default function AdminUsersPage() {
  return (
    <section className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Area reservada para administradores.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="grid min-w-[640px] grid-cols-[1fr_1.2fr_120px] border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Nome</span>
          <span>Email</span>
          <span>Role</span>
        </div>
        {users.map((user) => (
          <div
            className="grid min-w-[640px] grid-cols-[1fr_1.2fr_120px] items-center border-b border-slate-100 px-4 py-4 text-sm last:border-b-0"
            key={user.id}
          >
            <span className="font-medium text-slate-950">{user.name}</span>
            <span className="text-slate-500">{user.email}</span>
            <Badge variant={user.role === "admin" ? "purple" : "slate"}>
              {user.role}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

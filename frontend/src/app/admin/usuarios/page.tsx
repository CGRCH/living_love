"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/Button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<{ id: number; email: string; role: string; first_name: string }[]>([]);
  const [form, setForm] = useState({ email: "", password: "", role: "store", first_name: "", last_name: "" });

  const load = () => adminFetch("/api/admin/users/").then((r) => r.json()).then((d) => setUsers(d.results ?? d));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Usuarios y permisos</h1>
      <form
        className="mt-6 grid gap-2 bg-blanco p-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await adminFetch("/api/admin/users/", { method: "POST", body: JSON.stringify(form) });
          load();
        }}
      >
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border border-arena px-2 py-2 text-sm" placeholder="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="border border-arena px-2 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="store">Tienda</option>
          <option value="admin">Administración</option>
        </select>
        <Button type="submit">Crear usuario</Button>
      </form>
      <table className="mt-8 w-full bg-blanco text-sm">
        <thead className="text-[10px] uppercase tracking-label text-taupe">
          <tr>
            <th className="p-2 text-left">Email</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-arena/30">
              <td className="p-2">{u.email}</td>
              <td className="uppercase">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

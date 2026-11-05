"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";
import { formatCLP } from "@/lib/api";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<
    { number: string; status: string; quoted_amount?: number; created_at: string }[]
  >([]);

  useEffect(() => {
    authFetch("/api/me/quotes/").then((r) => r.json()).then((d) => setQuotes(d.results ?? d));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Mis cotizaciones</h1>
      <ul className="mt-8 divide-y divide-arena/40">
        {quotes.map((q) => (
          <li key={q.number} className="flex justify-between py-4 text-sm">
            <span>{q.number}</span>
            <span className="uppercase text-taupe">{q.status}</span>
            <span>{q.quoted_amount ? formatCLP(q.quoted_amount) : "—"}</span>
          </li>
        ))}
        {!quotes.length && <li className="py-4 text-taupe">Sin cotizaciones.</li>}
      </ul>
    </div>
  );
}

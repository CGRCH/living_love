"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { quoteStatusLabel } from "@/lib/quote-status";

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<{ id: number; number: string; status: string; email: string }[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/quotes/").then((r) => r.json()).then((d) => setQuotes(d.results ?? d));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl">Cotizaciones</h1>
      <ul className="mt-8 divide-y bg-blanco">
        {quotes.map((q) => (
          <li key={q.id} className="flex justify-between px-4 py-4 text-sm">
            <span>{q.number}</span>
            <span>{q.email}</span>
            <span>{quoteStatusLabel(q.status)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

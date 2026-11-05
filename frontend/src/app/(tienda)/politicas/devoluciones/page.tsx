import { fetchPublicSettings } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ReturnsPolicyPage() {
  let md = "";
  try {
    const s = await fetchPublicSettings();
    md = s.return_policy_md;
  } catch {
    md = "Política no disponible.";
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral">
      <h1 className="font-serif text-4xl">Políticas</h1>
      <pre className="mt-8 whitespace-pre-wrap font-sans text-sm text-taupe">{md}</pre>
    </div>
  );
}

export function adminFetch(apiPath: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`/api/proxy?path=${encodeURIComponent(apiPath)}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export function adminUpload(apiPath: string, formData: FormData) {
  return fetch(`/api/proxy?path=${encodeURIComponent(apiPath)}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
}

/** Descarga CSV u otro archivo vía proxy autenticado */
export async function adminDownload(apiPath: string, filename: string) {
  const res = await fetch(`/api/proxy?path=${encodeURIComponent(apiPath)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo descargar");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

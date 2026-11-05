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

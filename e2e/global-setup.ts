import { assertNextCssHealthy } from "./helpers/wait-for-styles";

export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await assertNextCssHealthy(baseURL);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(
    "Next.js no sirve CSS válido en " +
      baseURL +
      ". En CI: ejecute build y luego start. Local: reinicie next start tras cada build.",
  );
}

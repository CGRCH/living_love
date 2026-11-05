import { expect, type Page } from "@playwright/test";

async function waitForTailwindSheet(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(
    () => {
      const sheet = [...document.styleSheets].find((s) => s.href?.includes("/_next/static/css/"));
      if (!sheet) return false;
      try {
        return sheet.cssRules.length > 10;
      } catch {
        return false;
      }
    },
    { timeout: 20000 },
  );
}

/** Falla si Tailwind/CSS de Next no cargó (p. ej. next start desactualizado tras build). */
export async function waitForV3Styles(page: Page, opts?: { storeHome?: boolean }) {
  await waitForTailwindSheet(page);
  const bar = page.locator(".bg-onix").first();
  await expect(bar).toHaveCSS("background-color", "rgb(11, 11, 11)");

  if (opts?.storeHome !== false && (await page.getByRole("heading", { name: /living que/i }).count())) {
    await expect(page.getByRole("heading", { name: /living que/i })).toHaveCSS(
      "font-family",
      /Bodoni|Georgia|serif/i,
    );
  }
}

export async function assertNextCssHealthy(baseURL: string) {
  const html = await fetch(baseURL).then((r) => r.text());
  const match = html.match(/\/_next\/static\/css\/([a-f0-9]+\.css)/);
  if (!match) {
    throw new Error("No se encontró hoja de estilos en el HTML de Next.js");
  }
  const cssUrl = `${baseURL}/_next/static/css/${match[1]}`;
  const css = await fetch(cssUrl);
  if (!css.ok) {
    throw new Error(
      `CSS devolvió ${css.status} (${cssUrl}). Reinicie 'npm run start' después de 'npm run build'.`,
    );
  }
  const text = await css.text();
  if (!text.includes(".bg-onix")) {
    throw new Error("La hoja CSS no contiene utilidades Tailwind esperadas");
  }
}

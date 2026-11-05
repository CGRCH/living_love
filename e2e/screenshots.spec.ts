import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import { waitForV3Styles } from "./helpers/wait-for-styles";

const SHOT_DIR = "test-results/screenshots";
const ARTIFACT_DIR = "/opt/cursor/artifacts/screenshots";

async function setAuthCookies(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  email: string,
  password: string,
) {
  const tokenRes = await request.post("http://localhost:8000/api/auth/token/", {
    data: { email, password },
  });
  expect(tokenRes.ok()).toBeTruthy();
  const tokens = await tokenRes.json();
  await page.context().addCookies([
    {
      name: "ll_access",
      value: tokens.access,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "ll_refresh",
      value: tokens.refresh,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

async function waitAdminShell(page: import("@playwright/test").Page) {
  await expect(page.locator('[data-admin-shell="ready"]')).toBeVisible({ timeout: 20000 });
}

async function snap(page: import("@playwright/test").Page, filename: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOT_DIR}/${filename}`, fullPage: true });
}

const storePages = [
  ["/", "store-home"],
  ["/categoria/livings", "store-category"],
  ["/producto/sofa-nube-boucle", "store-product"],
  ["/carro", "store-cart"],
  ["/checkout", "store-checkout"],
  ["/cotizar", "store-quote"],
  ["/cuenta/ingresar", "store-login"],
  ["/admin/login", "admin-login"],
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

for (const [route, name] of storePages) {
  test(`screenshot ${name}`, async ({ page }) => {
    await page.goto(route);
    await waitForV3Styles(page, { storeHome: route === "/" });
    await snap(page, `${name}-desktop.png`);
  });
}

test("screenshot home mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await waitForV3Styles(page);
  await snap(page, "store-home-mobile.png");
});

test("screenshot admin suite", async ({ page, request }) => {
  await setAuthCookies(page, request, "admin@livinglove.cl", "admin12345");

  await page.goto("/admin");
  await waitAdminShell(page);
  await waitForV3Styles(page, { storeHome: false });
  await expect(page.getByTestId("admin-dashboard-ready")).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /Buenos días/i })).toBeVisible();
  await snap(page, "admin-dashboard.png");

  await page.goto("/admin/pedidos");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
  await expect(page.getByText("LL-DEMO-0001")).toBeVisible({ timeout: 10000 });
  await snap(page, "admin-orders.png");

  const orderRow = page.getByRole("row", { name: /LL-DEMO-0001/ });
  await expect(orderRow).toBeVisible({ timeout: 10000 });
  await orderRow.getByRole("link", { name: "Detalle" }).click();
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: /Pedido LL-DEMO-0001/i })).toBeVisible({
    timeout: 10000,
  });
  await snap(page, "admin-order-detail.png");

  await page.goto("/admin/productos");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  await expect(page.getByText("Sofá Nube Bouclé")).toBeVisible();
  await snap(page, "admin-products.png");

  await page.goto("/admin/productos/sofa-nube-boucle");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: "Sofá Nube Bouclé" })).toBeVisible({
    timeout: 10000,
  });
  await snap(page, "admin-product-edit.png");

  await page.goto("/admin/telas");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: /Telas/i })).toBeVisible();
  await snap(page, "admin-fabrics.png");

  await page.goto("/admin/despachos");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: "Despachos" })).toBeVisible();
  await snap(page, "admin-shipping.png");

  await page.goto("/admin/pagos");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: "Pagos" })).toBeVisible();
  await snap(page, "admin-payments.png");

  await page.goto("/admin/ajustes");
  await waitAdminShell(page);
  await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();
  await snap(page, "admin-settings.png");
});

test.afterAll(() => {
  if (!fs.existsSync(SHOT_DIR)) return;
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  for (const file of fs.readdirSync(SHOT_DIR)) {
    if (file.endsWith(".png")) {
      fs.copyFileSync(path.join(SHOT_DIR, file), path.join(ARTIFACT_DIR, file));
    }
  }
  const artifactRoot = "/opt/cursor/artifacts";
  fs.mkdirSync(artifactRoot, { recursive: true });
  const adminDash = path.join(SHOT_DIR, "admin-dashboard.png");
  if (fs.existsSync(adminDash)) {
    fs.copyFileSync(adminDash, path.join(artifactRoot, "artifact-admin.png"));
  }
  const home = path.join(SHOT_DIR, "store-home-desktop.png");
  if (fs.existsSync(home)) {
    fs.copyFileSync(home, path.join(artifactRoot, "artifact-home.png"));
  }
});

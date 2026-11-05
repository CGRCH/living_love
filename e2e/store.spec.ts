import { test, expect } from "@playwright/test";
import { waitForV3Styles } from "./helpers/wait-for-styles";

async function setAuthCookies(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext, email: string, password: string) {
  const tokenRes = await request.post("http://localhost:8000/api/auth/token/", {
    data: { email, password },
  });
  const tokens = await tokenRes.json();
  await page.context().addCookies([
    { name: "ll_access", value: tokens.access, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "ll_refresh", value: tokens.refresh, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}

test.describe("Living Love tienda", () => {
  test("home carga titular editorial", async ({ page }) => {
    await page.goto("/");
    await waitForV3Styles(page);
    await expect(page.getByRole("heading", { name: /living que/i })).toBeVisible();
    await expect(page.getByText("Compra por categoría")).toBeVisible();
    await page.screenshot({ path: "test-results/artifact-home.png", fullPage: true });
  });

  test("categoría livings lista productos", async ({ page }) => {
    await page.goto("/categoria/livings");
    await expect(page.getByRole("heading", { name: /livings/i })).toBeVisible();
    await page.screenshot({ path: "test-results/artifact-category.png", fullPage: true });
  });

  test("checkout simulado flujo", async ({ page, request }) => {
    const session = "e2e-cart-session-2";
    await request.post("http://localhost:8000/api/cart/items/", {
      headers: { "X-Cart-Session": session },
      data: { product_id: 1, options: {}, qty: 1 },
    });
    const checkout = await request.post("http://localhost:8000/api/checkout/", {
      headers: { "X-Cart-Session": session, "Content-Type": "application/json" },
      data: {
        email: "francisca@test.cl",
        phone: "+56987654321",
        shipping_method: "delivery",
        commune_id: 15,
        region_id: 1,
        doc_type: "boleta",
        payment_provider: "simulated",
        session_key: session,
        shipping_address: { name: "Francisca Morales", street: "Av. Vitacura 4380" },
      },
    });
    expect(checkout.ok()).toBeTruthy();
    const payload = await checkout.json();
    const redirect = payload.payment_redirect as string;
    await page.goto(redirect.replace("http://localhost:3000", ""));
    await page.getByRole("button", { name: /aprobar/i }).click();
    await expect(page.getByText(/procesado/i)).toBeVisible();
    await page.screenshot({ path: "test-results/artifact-checkout.png", fullPage: true });
  });

  test("admin login dashboard", async ({ page, request }) => {
    const tokenRes = await request.post("http://localhost:8000/api/auth/token/", {
      data: { email: "admin@livinglove.cl", password: "admin12345" },
    });
    const { access } = await tokenRes.json();
    const dash = await request.get("http://localhost:8000/api/admin/dashboard/", {
      headers: { Authorization: `Bearer ${access}` },
    });
    expect(dash.ok()).toBeTruthy();
    await setAuthCookies(page, request, "admin@livinglove.cl", "admin12345");
    await page.goto("/admin");
    await expect(page.locator('[data-admin-shell="ready"]')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("admin-dashboard-ready")).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "test-results/artifact-admin.png", fullPage: true });
  });
});

import { test } from "@playwright/test";

async function setAuthCookies(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext, email: string, password: string) {
  const tokenRes = await request.post("http://localhost:8000/api/auth/token/", {
    data: { email, password },
  });
  const tokens = await tokenRes.json();
  await page.context().addCookies([
    { name: "ll_access", value: tokens.access, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}

const pages = [
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

for (const [path, name] of pages) {
  test(`screenshot ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/screenshots/${name}-desktop.png`, fullPage: true });
  });
}

test("screenshot home mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/screenshots/store-home-mobile.png", fullPage: true });
});

test("screenshot admin dashboard", async ({ page, request }) => {
  await setAuthCookies(page, request, "admin@livinglove.cl", "admin12345");
  await page.goto("/admin");
  await page.screenshot({ path: "test-results/screenshots/admin-dashboard.png", fullPage: true });
  await page.goto("/admin/productos");
  await page.screenshot({ path: "test-results/screenshots/admin-products.png", fullPage: true });
});

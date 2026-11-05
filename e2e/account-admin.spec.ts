import { test, expect } from "@playwright/test";

async function setAuthCookies(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext, email: string, password: string) {
  const tokenRes = await request.post("http://localhost:8000/api/auth/token/", {
    data: { email, password },
  });
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

async function loginAdmin(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  await setAuthCookies(page, request, "admin@livinglove.cl", "admin12345");
  await page.goto("/admin");
}

test.describe("Cuenta cliente", () => {
  test("registro e ingreso", async ({ page }) => {
    const email = `cliente${Date.now()}@test.cl`;
    await page.request.post("/api/auth/register", {
      data: {
        email,
        password: "test12345",
        first_name: "Ana",
        last_name: "Pérez",
        phone: "+56911112222",
      },
    });
    await page.request.post("/api/auth/session", {
      data: { email, password: "test12345" },
    });
    await page.goto("/cuenta");
    await expect(page.getByText(/Mi cuenta/i)).toBeVisible();
  });
});

test.describe("Admin CRUD", () => {
  test("login y crear categoría", async ({ page, request }) => {
    const tokenRes = await request.post("http://localhost:8000/api/auth/token/", {
      data: { email: "admin@livinglove.cl", password: "admin12345" },
    });
    const { access } = await tokenRes.json();
    const slug = `demo-${Date.now()}`;
    const create = await request.post("http://localhost:8000/api/admin/categories/", {
      headers: { Authorization: `Bearer ${access}` },
      data: { name: "Demo Cat", slug, order: 0, is_active: true },
    });
    expect(create.ok()).toBeTruthy();
    const list = await request.get("http://localhost:8000/api/admin/categories/", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const items = await list.json();
    const rows = items.results ?? items;
    expect(rows.some((c: { slug: string }) => c.slug === slug)).toBeTruthy();
  });
});

import { expect, test } from "@playwright/test";

test("home, legal pages and public assets are available", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(await page.request.get("/privacy")).toBeOK();
  await expect(await page.request.get("/terms")).toBeOK();
  await expect(await page.request.get("/favicon.ico")).toBeOK();
  await expect(await page.request.get("/og-image.png")).toBeOK();
});

test("unauthenticated content writes are rejected", async ({ request }) => {
  const opportunity = await request.post("/api/opportunities");
  const upload = await request.post("/api/upload");
  expect(opportunity.status()).toBe(401);
  expect(await opportunity.json()).toEqual({ success: false, error: "unauthorized" });
  expect(upload.status()).toBe(401);
  expect(await upload.json()).toEqual({ success: false, error: "unauthorized" });
});

test("invalid pages default to one and regex metacharacters are treated as text", async ({ request }) => {
  const response = await request.get("/api/opportunities", { params: { page: "abc", q: "(a+)+$" } });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.meta.page).toBe(1);
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// These need no Supabase backend: signed-out behaviour only.

for (const path of ["/clients", "/clients/new", "/clients/00000000-0000-0000-0000-000000000000/progress", "/api/export"]) {
  test(`${path} is not available when signed out`, async ({ page, request }) => {
    if (path.startsWith("/api")) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect([307, 401]).toContain(res.status());
      return;
    }
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  });
}

test("open redirects are ignored after sign-in links", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/");
});

for (const scheme of ["light", "dark"] as const) {
  for (const path of ["/login", "/forgot-password"]) {
    test(`${path} has no accessibility violations (${scheme})`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
      await context.close();
    });
  }
}

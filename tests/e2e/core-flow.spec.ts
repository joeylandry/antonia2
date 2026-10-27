import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run against a test Supabase project");

const name = `E2E Client ${Date.now()}`;

test("sign in, create a client, log sessions, see progress, persist after reload, delete", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);

  await page.goto("/clients/new");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Primary goal / focus").fill("squat 180 by end of October");
  await page.getByRole("button", { name: "Add client" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

  for (const [date, weight] of [["2026-10-06", "24"], ["2026-10-20", "32"]]) {
    await page.getByRole("link", { name: "Log session" }).click();
    await page.getByLabel("Date").fill(date);
    await page.getByLabel("Workout focus").fill("Lower body");
    await page.getByLabel("Exercise 1", { exact: true }).fill("Goblet Squat");
    await page.getByLabel("Reps, set 1").fill("12");
    await page.getByLabel("Weight in pounds, set 1").fill(weight);
    await page.getByLabel("Reps, set 2").fill("12");
    await page.getByLabel("Weight in pounds, set 2").fill(weight);
    await page.getByLabel("Notes for exercise 1").fill("felt easy");
    await page.getByRole("button", { name: "Save session" }).click();
    await expect(page.getByText("Goblet Squat").first()).toBeVisible();
    await page.getByRole("link", { name: "Overview" }).click();
  }

  await page.getByRole("link", { name: "Progress" }).click();
  await page.getByRole("button", { name: "All" }).click();
  await expect(page.getByText("+8")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Goblet Squat").first()).toBeVisible();

  await page.getByRole("link", { name: "Overview" }).click();
  await page.getByRole("button", { name: "Archive" }).click();
  await page.getByRole("button", { name: "Archive client" }).click();
  await page.goto("/clients?view=archived");
  await page.getByRole("link", { name }).click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await page.getByLabel("Type the client's name to confirm").fill(name);
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL(/\/clients$/);
});

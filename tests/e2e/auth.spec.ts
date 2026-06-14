import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const isLocalApp =
      url.hostname === "127.0.0.1" ||
      url.hostname === "localhost" ||
      url.protocol === "data:" ||
      url.protocol === "blob:";

    return isLocalApp ? route.continue() : route.abort();
  });
});

test("비인증 사용자는 루트 진입 후 로그인 화면을 볼 수 있다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\/?$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "우리뭐해" })).toBeVisible();
  await expect(page.getByText("우리 둘의 일정과 결혼 준비를 함께 관리하는 캘린더")).toBeVisible();
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByLabel("비밀번호")).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
});

const protectedRoutes = ["/home", "/calendar", "/budget", "/guests", "/vendors", "/settings", "/invite", "/onboarding"];

for (const route of protectedRoutes) {
  test(`비인증 사용자는 ${route} 접근 시 로그인으로 보호된다`, async ({ page }) => {
    await page.goto(route);

    await expect(page).toHaveURL(/\/login\/?$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "우리뭐해" })).toBeVisible();
  });
}

test("로그인 폼은 필수 입력과 비밀번호 길이 validation을 브라우저에서 수행한다", async ({ page }) => {
  await page.goto("/login");

  const emailInput = page.getByLabel("이메일");
  const passwordInput = page.getByLabel("비밀번호");

  await page.getByRole("button", { name: "로그인" }).click();
  await expect(emailInput).toBeFocused();
  await expect(emailInput).toHaveJSProperty("validity.valueMissing", true);

  await emailInput.fill("user@example.com");
  await passwordInput.fill("12345");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(passwordInput).toHaveJSProperty("validity.tooShort", true);
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
});

test("회원가입 진입점은 이름 입력과 가입 버튼으로 전환된다", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "처음이에요. 계정 만들기" }).click();

  await expect(page.getByLabel("이름")).toBeVisible();
  await expect(page.getByLabel("이메일")).toBeVisible();
  await expect(page.getByLabel("비밀번호")).toBeVisible();
  await expect(page.getByRole("button", { name: "회원가입" })).toBeVisible();

  await page.getByRole("button", { name: "이미 계정이 있어요" }).click();
  await expect(page.getByLabel("이름")).toBeHidden();
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
});

test("회원가입 폼도 이메일과 비밀번호 브라우저 validation을 유지한다", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "처음이에요. 계정 만들기" }).click();

  const emailInput = page.getByLabel("이메일");
  const passwordInput = page.getByLabel("비밀번호");

  await emailInput.fill("not-an-email");
  await passwordInput.fill("12345");
  await page.getByRole("button", { name: "회원가입" }).click();

  await expect(emailInput).toHaveJSProperty("validity.typeMismatch", true);
  await expect(passwordInput).toHaveJSProperty("validity.tooShort", true);
  await expect(page.getByRole("button", { name: "회원가입" })).toBeVisible();
});

test("비밀번호 재설정 다이얼로그는 초기 이메일, validation, 닫기 동작을 제공한다", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("이메일").fill("reset@example.com");
  await page.getByRole("button", { name: "비밀번호를 잊으셨나요?" }).click();

  const dialog = page.getByRole("dialog", { name: "비밀번호 재설정" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("가입 이메일")).toHaveValue("reset@example.com");
  await expect(dialog.getByRole("button", { name: "재설정 메일 받기" })).toBeVisible();

  await dialog.getByLabel("가입 이메일").fill("");
  await dialog.getByRole("button", { name: "재설정 메일 받기" }).click();
  await expect(dialog.getByLabel("가입 이메일")).toHaveJSProperty("validity.valueMissing", true);

  await dialog.getByLabel("가입 이메일").fill("invalid-email");
  await dialog.getByRole("button", { name: "재설정 메일 받기" }).click();
  await expect(dialog.getByLabel("가입 이메일")).toHaveJSProperty("validity.typeMismatch", true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "비밀번호를 잊으셨나요?" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "비밀번호 재설정 닫기" }).click();
  await expect(dialog).toBeHidden();
});

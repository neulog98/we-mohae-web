import { expect, test, type Page } from "@playwright/test";
import { e2eSeed, e2eUsers } from "./global-setup";

test.skip(process.env.E2E_USE_FIREBASE_EMULATOR !== "true", "Firebase Emulator seed가 필요한 QA입니다.");
test.describe.configure({ mode: "serial" });

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(e2eSeed.password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/home\/?$/);
}

test("예비부부 seed 사용자는 홈에서 파트너와 예산 탭을 확인할 수 있다", async ({ page }) => {
  await login(page, e2eUsers.weddingOwner.email);

  await expect(page.getByText("예비부부 모드").first()).toBeVisible();
  await expect(page.getByText("웨딩 파트너님과 함께 일정을 보고 있어요.")).toBeVisible();
  await expect(page.getByRole("link", { name: /예산관리/ })).toBeVisible();
  await expect(page.getByText("결혼 준비 예산")).toBeVisible();
  await expect(page.getByRole("heading", { name: "웨딩홀 계약" })).toBeVisible();
});

test("커플 모드 seed 사용자는 예산 탭이 숨겨지고 /budget 직접 접근 시 홈으로 이동한다", async ({ page }) => {
  await login(page, e2eUsers.coupleOwner.email);

  await expect(page.getByText("커플 모드").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /예산관리/ })).toHaveCount(0);

  await page.goto("/budget");
  await expect(page).toHaveURL(/\/home\/?$/);
});

test("예비부부 캘린더는 일정 타입 필터를 분리하고 커플 일정 CRUD를 수행한다", async ({ page }) => {
  await login(page, e2eUsers.weddingOwner.email);
  await page.getByRole("link", { name: /캘린더/ }).click();

  await expect(page.getByRole("button", { name: "커플 일정", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "결혼 준비 일정", exact: true })).toBeVisible();

  const weddingTitle = "QA 웨딩 일정";
  await page.getByRole("button", { name: "결혼 준비 일정", exact: true }).click();
  await page.getByLabel("일정 제목").fill(weddingTitle);
  await page.getByLabel("설명").fill("필터 분리 검증");
  await page.getByRole("button", { name: "결혼 준비 일정 추가" }).click();
  await expect(page.getByText(weddingTitle)).toBeVisible();

  await page.getByRole("button", { name: "커플 일정", exact: true }).click();
  await expect(page.getByText(weddingTitle)).toHaveCount(0);
  await expect(page.getByText("QA 데이트 일정")).toBeVisible();

  const title = "QA 데이트 일정";
  const updatedTitle = "QA 데이트 일정 수정";
  const createdArticle = page.locator("article").filter({ hasText: title });
  await createdArticle.getByLabel("일정 수정").click();
  await page.getByLabel("일정 제목").fill(updatedTitle);
  await page.locator("form").getByRole("button", { name: "일정 수정" }).click();
  await expect(page.getByText(updatedTitle)).toBeVisible();

  const updatedArticle = page.locator("article").filter({ hasText: updatedTitle });
  await updatedArticle.getByLabel("일정 삭제").click();
  const deleteDialog = page.getByRole("dialog", { name: "일정을 삭제할까요?" });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText(updatedTitle)).toHaveCount(0);
});

test("예비부부 예산 화면은 금액 콤마, 초과 경고, 저장 후 목록 반영을 검증한다", async ({ page }) => {
  await login(page, e2eUsers.weddingOwner.email);
  await page.getByRole("link", { name: /예산관리/ }).click();
  const budgetTable = page.getByRole("table");

  await expect(budgetTable.getByText("웨딩홀 계약")).toBeVisible();
  await page.getByRole("button", { name: "예산 항목 추가" }).click();

  const dialog = page.getByRole("dialog", { name: "예산 항목 추가" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("항목명").fill("QA 초과 예산");
  await dialog.getByRole("textbox", { name: /^예상 예산 원/ }).fill("1000000");
  await expect(dialog.getByRole("textbox", { name: /^예상 예산 원/ })).toHaveValue("1,000,000");
  await dialog.getByRole("textbox", { name: /^계약금 원/ }).fill("300000");
  await dialog.getByRole("textbox", { name: /^현재까지 결제 금액 원/ }).fill("100000");
  await dialog.getByRole("button", { name: "예산 항목 저장" }).click();
  await expect(dialog.getByText("계약금은 현재까지 결제 금액보다 클 수 없어요.")).toBeVisible();

  await dialog.getByRole("textbox", { name: /^현재까지 결제 금액 원/ }).fill("1200000");
  await expect(dialog.getByText("예산 초과 금액")).toBeVisible();
  await expect(dialog.getByText("₩200,000")).toBeVisible();
  await dialog.getByLabel("잔금 결제일").fill("2026-07-01");
  await dialog.getByRole("button", { name: "예산 항목 저장" }).click();

  await expect(dialog).toBeHidden();
  await expect(budgetTable.getByText("QA 초과 예산")).toBeVisible();
  await expect(budgetTable.getByRole("cell", { name: "₩1,200,000" })).toBeVisible();

  await expect(page.getByRole("columnheader", { name: "항목명" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "QA 초과 예산", exact: true })).toBeVisible();

  await page.getByLabel("예산 검색").fill("초과");
  await expect(page.getByText("표시 항목 1건")).toBeVisible();
  await expect(budgetTable.getByText("QA 초과 예산")).toBeVisible();
  await expect(budgetTable.getByText("웨딩홀 계약")).toHaveCount(0);

  await page.getByLabel("상태").selectOption("초과");
  await expect(budgetTable.getByRole("row", { name: /QA 초과 예산/ }).getByText("예산초과")).toBeVisible();
  await page.getByRole("button", { name: "필터 초기화" }).click();
  await expect(budgetTable.getByText("웨딩홀 계약")).toBeVisible();
});

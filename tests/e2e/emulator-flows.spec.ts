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
  await expect(page.getByText("결혼 준비 체크리스트")).toBeVisible();
  await expect(page.getByText("웨딩홀 후보 비교")).toBeVisible();
  await expect(page.getByText("미완료 준비")).toBeVisible();
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

test("예비부부 하객 관리 화면은 하객 요약과 추가 저장을 제공한다", async ({ page }) => {
  await login(page, e2eUsers.weddingOwner.email);
  await page.getByRole("link", { name: /하객관리/ }).click();

  await expect(page.getByText("QA 하객")).toBeVisible();
  await expect(page.getByText("총 하객")).toBeVisible();
  await page.getByLabel("이름").fill("QA 추가 하객");
  await page.getByLabel("구분").selectOption("bride");
  await page.getByLabel("참석").selectOption("attending");
  await page.getByLabel("관계").fill("직장");
  await page.getByLabel("축의금").fill("50000");
  await page.getByRole("button", { name: "하객 추가" }).click();
  await expect(page.getByText("QA 추가 하객")).toBeVisible();
});

test("예비부부 업체 관리 화면은 계약/견적/첨부 정보를 관리한다", async ({ page }) => {
  await login(page, e2eUsers.weddingOwner.email);
  await page.getByRole("link", { name: /업체관리/ }).click();

  await expect(page.getByText("QA 웨딩홀").first()).toBeVisible();
  await expect(page.getByText("기본 견적")).toBeVisible();
  const vendorForm = page.locator("form");
  await vendorForm.getByLabel("업체명").fill("QA 스냅");
  await vendorForm.getByLabel("카테고리").selectOption("사진");
  await vendorForm.getByLabel("상태").selectOption("quoted");
  await vendorForm.getByLabel("계약 금액").fill("800000");
  await vendorForm.getByPlaceholder("견적명").fill("본식 스냅 견적");
  await vendorForm.getByPlaceholder("금액").fill("800000");
  await vendorForm.getByPlaceholder("포함 항목").fill("원본 제공");
  await vendorForm.getByPlaceholder("추가금").fill("앨범 별도");
  await vendorForm.getByRole("button", { name: "견적 추가" }).click();
  await vendorForm.getByPlaceholder("계약서, 견적서, 사진명").fill("견적서");
  await vendorForm.getByPlaceholder("https://...").fill("https://example.com/quote");
  await vendorForm.getByRole("button", { name: "첨부 추가" }).click();
  await vendorForm.getByRole("button", { name: "업체 추가" }).click();
  await expect(page.getByText("QA 스냅")).toBeVisible();
  await expect(page.getByRole("cell", { name: "본식 스냅 견적" })).toBeVisible();
});

test("예비부부 캘린더는 일정 타입 필터를 분리하고 커플 일정 CRUD를 수행한다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, e2eUsers.weddingOwner.email);
  await page.getByRole("link", { name: /캘린더/ }).click();

	  await expect(page.locator("aside").getByRole("link", { name: /캘린더/ })).toBeVisible();
	  await expect(page.locator("nav.fixed")).toBeHidden();
	  const calendarBox = await page.getByLabel("월간 캘린더").boundingBox();
	  const addButtonBox = await page.getByRole("button", { name: "일정 추가" }).boundingBox();
	  expect(calendarBox).not.toBeNull();
	  expect(addButtonBox).not.toBeNull();
	  expect(calendarBox!.x).toBeLessThan(addButtonBox!.x);
	  expect(calendarBox!.width).toBeLessThanOrEqual(590);
	  await expect(page.getByRole("form", { name: "커플 일정 추가" })).toHaveCount(0);

	  await expect(page.getByRole("button", { name: "커플 일정", exact: true })).toBeVisible();
	  await expect(page.getByRole("button", { name: "결혼 준비 일정", exact: true })).toBeVisible();

	  const weddingTitle = "QA 웨딩 일정";
	  await page.getByRole("button", { name: "결혼 준비 일정", exact: true }).click();
  await page.getByRole("button", { name: "일정 추가" }).click();
  const addDialog = page.getByRole("dialog", { name: "일정 추가" });
  await expect(addDialog).toBeVisible();
  const scheduleDialogPanelBox = await addDialog.locator("> div").boundingBox();
  expect(scheduleDialogPanelBox).not.toBeNull();
  expect(scheduleDialogPanelBox!.width).toBeLessThan(700);
  expect(scheduleDialogPanelBox!.height).toBeLessThan(900);
  await addDialog.getByLabel("일정 제목").fill(weddingTitle);
	  await addDialog.getByLabel("설명").fill("필터 분리 검증");
	  await addDialog.getByLabel("담당").selectOption("bride");
	  await addDialog.getByLabel("업체명").fill("QA 스튜디오");
	  await addDialog.getByLabel("업체 연락처").fill("010-1234-5678");
	  await addDialog.getByLabel("종료일").fill("2000-01-01T09:00");
	  await addDialog.getByRole("button", { name: "결혼 준비 일정 추가" }).click();
	  await expect(addDialog.getByText("종료일은 시작일보다 빠를 수 없어요.")).toBeVisible();
	  await addDialog.getByLabel("종료일").fill("");
	  await addDialog.getByRole("button", { name: "결혼 준비 일정 추가" }).click();
	  await expect(addDialog).toBeHidden();
	  await expect(page.getByText(weddingTitle)).toBeVisible();
	  await expect(page.getByText("담당 신부 · QA 스튜디오 · 010-1234-5678")).toBeVisible();

	  await page.getByRole("button", { name: "커플 일정", exact: true }).click();
  await expect(page.getByText(weddingTitle)).toHaveCount(0);
  await expect(page.getByText("QA 데이트 일정")).toBeVisible();

	  const title = "QA 데이트 일정";
	  const updatedTitle = "QA 데이트 일정 수정";
	  const createdArticle = page.locator("article").filter({ hasText: title });
	  await createdArticle.getByLabel("일정 수정").click();
	  const editDialog = page.getByRole("dialog", { name: "일정 수정" });
	  await expect(editDialog).toBeVisible();
	  await editDialog.getByLabel("일정 제목").fill(updatedTitle);
	  await editDialog.getByRole("button", { name: "일정 수정" }).click();
	  await expect(editDialog).toBeHidden();
	  await expect(page.getByText(updatedTitle)).toBeVisible();

	  const copyTarget = await page.evaluate(() => {
	    const target = new Date();
	    target.setDate(target.getDate() + 1);
	    target.setHours(10, 0, 0, 0);
	    const pad = (value: number) => String(value).padStart(2, "0");
	    const date = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
	    return { input: `${date}T10:00`, label: `${date} 날짜 선택` };
	  });
	  const copiedTitle = "QA 데이트 일정 복사";
	  const updatedArticle = page.locator("article").filter({ hasText: updatedTitle });
	  await updatedArticle.getByLabel("일정 복사").click();
	  const copyDialog = page.getByRole("dialog", { name: "일정 복사" });
	  await expect(copyDialog).toBeVisible();
	  await copyDialog.getByLabel("일정 제목").fill(copiedTitle);
	  await copyDialog.getByLabel("시작일").fill(copyTarget.input);
	  await copyDialog.getByRole("button", { name: "일정 복사" }).click();
	  await expect(copyDialog).toBeHidden();
	  await page.getByLabel(copyTarget.label).click();
	  await expect(page.getByText(copiedTitle)).toBeVisible();

	  const copiedArticle = page.locator("article").filter({ hasText: copiedTitle });
	  await copiedArticle.getByLabel("일정 삭제").click();
	  const deleteDialog = page.getByRole("dialog", { name: "일정을 삭제할까요?" });
	  await expect(deleteDialog).toBeVisible();
	  await deleteDialog.getByRole("button", { name: "삭제" }).click();
	  await expect(page.getByText(copiedTitle)).toHaveCount(0);
	});

test("예비부부 예산 화면은 금액 콤마, 초과 경고, 저장 후 목록 반영을 검증한다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 620 });
  await login(page, e2eUsers.weddingOwner.email);
  await page.getByRole("link", { name: /예산관리/ }).click();
  const budgetTable = page.getByRole("table");

  await expect(budgetTable.getByText("웨딩홀 계약")).toBeVisible();
  await expect(page.getByText("예산 리포트")).toBeVisible();
  await expect(budgetTable.getByText("QA 웨딩홀")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const pageScrollBeforeDialog = await page.evaluate(() => window.scrollY);
  expect(pageScrollBeforeDialog).toBeGreaterThan(0);
  const addBudgetButton = page.getByRole("button", { name: "예산 항목 추가" });
  await addBudgetButton.scrollIntoViewIfNeeded();
  await addBudgetButton.click();

  const dialog = page.getByRole("dialog", { name: "예산 항목 추가" });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe("fixed");
  await expect.poll(() => page.evaluate(() => document.body.style.top)).toBe(`-${pageScrollBeforeDialog}px`);
  const pageScrollBeforeWheel = await page.evaluate(() => window.scrollY);
  await page.mouse.move(20, 300);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(pageScrollBeforeWheel);
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBe(0);
  const dialogFormBox = await dialog.locator("form").boundingBox();
  expect(dialogFormBox).not.toBeNull();
  expect(dialogFormBox!.width).toBeGreaterThan(650);
  await dialog.locator("form").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => dialog.locator("form").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await dialog.getByLabel("항목명").scrollIntoViewIfNeeded();
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
  await dialog.getByRole("textbox", { name: /^신랑 부담액 원/ }).fill("600000");
  await expect(dialog.getByRole("textbox", { name: /^신부 부담액 원/ })).toHaveValue("600,000");
  await dialog.getByLabel("직접 수정").check();
  await dialog.getByRole("textbox", { name: /^신부 부담액 원/ }).fill("500000");
  await dialog.getByRole("button", { name: "예산 항목 저장" }).click();
  await expect(dialog.getByText("공동 결제의 신랑/신부 부담액 합계는 현재까지 결제 금액과 같아야 해요.")).toBeVisible();
  await dialog.getByRole("textbox", { name: /^신부 부담액 원/ }).fill("600000");
  await expect(dialog.getByText("부담액 합계", { exact: true })).toBeVisible();
  await expect(dialog.getByText("₩1,200,000", { exact: true })).toBeVisible();
  await dialog.getByLabel("업체명").fill("QA 플래너");
  await dialog.getByLabel("업체 연락처").fill("02-1111-2222");
  await dialog.getByLabel("입금 계좌/결제 정보").fill("QA은행 111-222");
  await dialog.getByLabel("잔금 결제일").fill("2026-07-01");
  await dialog.getByRole("button", { name: "예산 항목 저장" }).click();

  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe("");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(pageScrollBeforeDialog);
  await expect(budgetTable.getByText("QA 초과 예산")).toBeVisible();
  await expect(budgetTable.getByText("QA 플래너 · 02-1111-2222 · QA은행 111-222")).toBeVisible();
  await expect(budgetTable.getByRole("cell", { name: "₩1,200,000" })).toBeVisible();
  await expect(budgetTable.getByText("신랑 ₩600,000 · 신부 ₩600,000")).toBeVisible();

  await expect(page.getByRole("columnheader", { name: "항목명" })).toBeVisible();
  await expect(budgetTable.getByRole("row", { name: /QA 초과 예산/ })).toBeVisible();

  await page.getByLabel("예산 검색").fill("초과");
  await expect(page.getByText("표시 항목 1건")).toBeVisible();
  await expect(budgetTable.getByText("QA 초과 예산")).toBeVisible();
  await expect(budgetTable.getByText("웨딩홀 계약")).toHaveCount(0);

  await page.getByLabel("상태").selectOption("초과");
  await expect(budgetTable.getByRole("row", { name: /QA 초과 예산/ }).getByText("예산초과")).toBeVisible();
  await page.getByRole("button", { name: "필터 초기화" }).click();
  await expect(budgetTable.getByText("웨딩홀 계약")).toBeVisible();
});

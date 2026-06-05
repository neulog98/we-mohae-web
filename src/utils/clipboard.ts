export async function copyTextToClipboard(text: string) {
  const trimmedText = text.trim();
  if (!trimmedText) throw new Error("복사할 내용이 없어요.");

  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API를 사용할 수 없어요.");
    await withTimeout(navigator.clipboard.writeText(trimmedText), 2000);
    return;
  } catch {
    if (copyWithTextarea(trimmedText)) return;
    throw new Error("클립보드 복사에 실패했어요.");
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Clipboard write timed out.")), timeoutMs);
    })
  ]);
}

function copyWithTextarea(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

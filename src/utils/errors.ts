const firebaseErrorMessages: Record<string, string> = {
  "auth/invalid-credential": "이메일/패스워드가 다릅니다. 확인 후, 다시 시도해주세요.",
  "auth/wrong-password": "이메일/패스워드가 다릅니다. 확인 후, 다시 시도해주세요.",
  "auth/user-not-found": "이메일/패스워드가 다릅니다. 확인 후, 다시 시도해주세요.",
  "auth/email-already-in-use": "이미 가입된 이메일이에요. 로그인해주세요.",
  "auth/invalid-email": "올바른 이메일 주소를 입력해주세요.",
  "auth/weak-password": "비밀번호는 6자 이상 입력해주세요.",
  "auth/requires-recent-login": "보안을 위해 다시 로그인한 후 비밀번호를 변경해주세요.",
  "auth/too-many-requests": "로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.",
  "auth/network-request-failed": "네트워크 연결을 확인한 후 다시 시도해주세요.",
  "permission-denied": "접근 권한이 없어요. 로그인 상태와 연결 정보를 확인해주세요.",
  "not-found": "요청한 정보를 찾지 못했어요.",
  "unavailable": "서버에 일시적으로 연결할 수 없어요. 잠시 후 다시 시도해주세요.",
  "deadline-exceeded": "요청 시간이 초과됐어요. 네트워크 상태를 확인해주세요.",
  "resource-exhausted": "요청이 너무 많아요. 잠시 후 다시 시도해주세요.",
  "failed-precondition": "요청을 처리할 준비가 되지 않았어요. 잠시 후 다시 시도해주세요.",
  "cancelled": "요청이 취소됐어요. 다시 시도해주세요."
};

const englishErrorPatterns: Array<[RegExp, string]> = [
  [/failed to fetch|networkerror|network request failed/i, "네트워크 연결을 확인한 후 다시 시도해주세요."],
  [/missing or insufficient permissions|permission[-_ ]?denied/i, "접근 권한이 없어요. 로그인 상태와 연결 정보를 확인해주세요."],
  [/quota|resource.*exhausted/i, "요청이 너무 많아요. 잠시 후 다시 시도해주세요."],
  [/timeout|timed out|deadline/i, "요청 시간이 초과됐어요. 네트워크 상태를 확인해주세요."],
  [/clipboard/i, "클립보드 복사에 실패했어요."]
];

export function getErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null) return null;
  if ("code" in error && typeof error.code === "string") return error.code;
  return null;
}

export function getUserFacingErrorMessage(error: unknown, fallback: string) {
  const code = getErrorCode(error);
  if (code && firebaseErrorMessages[code]) return firebaseErrorMessages[code];

  if (error instanceof Error) {
    const message = error.message.trim();
    if (isKoreanMessage(message)) return message;
    const matchedPattern = englishErrorPatterns.find(([pattern]) => pattern.test(message));
    if (matchedPattern) return matchedPattern[1];
  }

  return fallback;
}

function isKoreanMessage(message: string) {
  return /[가-힣]/.test(message);
}

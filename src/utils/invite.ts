export function createInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 8; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase().replaceAll(" ", "");
}

import { createHmac } from "crypto";

export function verifyInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  return hash === expected;
}

export function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const userStr = params.get("user");
  if (!userStr) return { user: null };
  try {
    return { user: JSON.parse(userStr) as { id: number; first_name: string; last_name?: string; username?: string } };
  } catch {
    return { user: null };
  }
}

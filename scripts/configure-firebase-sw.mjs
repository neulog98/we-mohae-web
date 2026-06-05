import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env.local");
const serviceWorkerPath = resolve(root, "out/firebase-messaging-sw.js");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator);
        const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

const fileEnv = parseEnvFile(envPath);
const env = { ...fileEnv, ...process.env };
const replacements = {
  REPLACE_WITH_FIREBASE_API_KEY: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  REPLACE_WITH_FIREBASE_AUTH_DOMAIN: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  REPLACE_WITH_FIREBASE_PROJECT_ID: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  REPLACE_WITH_FIREBASE_STORAGE_BUCKET: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  REPLACE_WITH_FIREBASE_APP_ID: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const missing = Object.entries(replacements)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  throw new Error(`Firebase service worker config is missing: ${missing.join(", ")}`);
}

let contents = readFileSync(serviceWorkerPath, "utf8");
for (const [placeholder, value] of Object.entries(replacements)) {
  contents = contents.replaceAll(placeholder, value);
}
writeFileSync(serviceWorkerPath, contents);

console.log("Configured out/firebase-messaging-sw.js");

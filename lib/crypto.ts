import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function key(): Buffer {
  const b = Buffer.from(process.env.TOKEN_ENC_KEY ?? "", "base64");
  if (b.length !== 32) throw new Error("TOKEN_ENC_KEY must be 32 bytes (base64)");
  return b;
}

/** Returns "v1:<iv>:<tag>:<ciphertext>" (all base64). Unique random IV per call. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv, { authTagLength: 16 });
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptToken(payload: string): string {
  const [v, ivB, tagB, ctB] = payload.split(":");
  if (v !== "v1") throw new Error("unsupported token version");
  const iv = Buffer.from(ivB, "base64");
  const tag = Buffer.from(tagB, "base64");
  if (iv.length !== 12) throw new Error("invalid IV length");
  if (tag.length !== 16) throw new Error("invalid auth tag length");
  const d = createDecipheriv("aes-256-gcm", key(), iv, { authTagLength: 16 });
  d.setAuthTag(tag);
  return Buffer.concat([d.update(Buffer.from(ctB, "base64")), d.final()]).toString("utf8");
}

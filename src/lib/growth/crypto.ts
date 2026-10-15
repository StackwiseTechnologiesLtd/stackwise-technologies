import { getAppSecret } from "@/lib/secrets";

function secretKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAppSecret().slice(0, 32)),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Copy bytes so Web Crypto gets a plain ArrayBuffer-backed view. */
function bufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

export async function encryptJson(payload: unknown): Promise<{
  ciphertext: string;
  iv: string;
}> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await secretKey();
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: bufferSource(iv) },
    key,
    encoded,
  );
  return {
    ciphertext: toBase64(new Uint8Array(cipher)),
    iv: toBase64(iv),
  };
}

export async function decryptJson<T>(
  ciphertext: string,
  iv: string,
): Promise<T> {
  const key = await secretKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bufferSource(fromBase64(iv)) },
    key,
    bufferSource(fromBase64(ciphertext)),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

import { createHash } from "node:crypto";

export async function sha256FromBuffer(buffer: Buffer | Uint8Array | ArrayBuffer) {
  const normalized =
    buffer instanceof ArrayBuffer ? Buffer.from(buffer) : Buffer.from(buffer);

  return createHash("sha256").update(normalized).digest("hex");
}

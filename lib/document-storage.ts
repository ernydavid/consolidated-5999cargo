import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function storeInvoiceOriginalFile(input: {
  organizationId: string;
  consolidationId: string;
  filename: string;
  buffer: Buffer;
}) {
  const baseDir = path.join(
    process.cwd(),
    ".storage",
    "invoice-documents",
    sanitizePathSegment(input.organizationId),
    sanitizePathSegment(input.consolidationId),
  );

  await mkdir(baseDir, { recursive: true });

  const targetPath = path.join(
    baseDir,
    `${Date.now()}-${sanitizeFilename(input.filename)}`,
  );

  await writeFile(targetPath, input.buffer);

  return targetPath;
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

import { put } from "@vercel/blob";

export const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

export async function uploadEventFile(path: string, file: File) {
  return put(path, file, {
    access: "public",
    addRandomSuffix: true,
  });
}

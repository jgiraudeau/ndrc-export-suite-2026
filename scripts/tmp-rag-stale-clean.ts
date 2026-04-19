import fs from "fs/promises";
import path from "path";
import { deleteStoreDocument, listGlobalStoreDocuments } from "../src/lib/ai/file-search";

const root = "/Users/imac2jacques/Desktop/antigravity/integration/knowledge";
const allowed = new Set([
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".html",
  ".htm",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function collectFiles(dir: string, base: string, out: Set<string>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(abs, base, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (/^readme(\..+)?$/i.test(entry.name)) continue;
    if (entry.name.startsWith(".") || entry.name.startsWith("~$")) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!allowed.has(ext)) continue;

    const rel = path.relative(base, abs).replace(/\\/g, "/");
    out.add(rel);
  }
}

async function main() {
  const keep = new Set<string>();
  await collectFiles(root, root, keep);

  const before = await listGlobalStoreDocuments();
  const knowledgeDocs = before.documents.filter(
    (d) => d.sourceType === "knowledge_folder" && typeof d.sourcePath === "string"
  );
  const stale = knowledgeDocs.filter((d) => !keep.has(d.sourcePath!));

  console.log(
    JSON.stringify(
      {
        phase: "stale-clean-start",
        store: before.storeName,
        totalBefore: before.documents.length,
        knowledgeDocs: knowledgeDocs.length,
        keepPaths: keep.size,
        staleCount: stale.length,
      },
      null,
      2
    )
  );

  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < stale.length; i++) {
    const doc = stale[i];
    let ok = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await withTimeout(deleteStoreDocument(doc.name), 15000);
        ok = true;
        break;
      } catch (err) {
        if (attempt < 3) {
          await sleep(1000 * attempt);
          continue;
        }
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${doc.sourcePath ?? "(unknown)"}: ${msg}`);
      }
    }

    if (ok) deleted++;
    else failed++;

    if ((i + 1) % 20 === 0 || i === stale.length - 1) {
      console.log(`progress ${i + 1}/${stale.length} deleted=${deleted} failed=${failed}`);
    }
  }

  const after = await listGlobalStoreDocuments();
  console.log(
    JSON.stringify(
      {
        phase: "stale-clean-done",
        totalAfter: after.documents.length,
        deleted,
        failed,
        errorCount: errors.length,
        errorSamples: errors.slice(0, 10),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("stale-clean failed:", err);
  process.exit(1);
});

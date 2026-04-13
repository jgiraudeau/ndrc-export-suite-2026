import "dotenv/config";
import { syncKnowledgeFolderToGlobalStore } from "../src/lib/ai/file-search";

async function main() {
  const folderPathArg = process.argv[2];
  const folderPath = folderPathArg && folderPathArg.trim().length > 0 ? folderPathArg : undefined;

  console.log("RAG sync start...");
  if (folderPath) {
    console.log(`Folder: ${folderPath}`);
  }

  const result = await syncKnowledgeFolderToGlobalStore({
    folderPath,
    removeMissing: true,
  });

  console.log("RAG sync completed.");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("RAG sync failed:", err);
  process.exit(1);
});

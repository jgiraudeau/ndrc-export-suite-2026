import { del } from "@vercel/blob";

type BlobCleanupResult = {
    requested: number;
    deleted: number;
    failed: number;
    errors: string[];
};

function normalizeBlobReference(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("proofs/")) return trimmed;

    try {
        const url = new URL(trimmed);
        if (url.pathname.includes("/proofs/")) return trimmed;
    } catch {
        return null;
    }

    return null;
}

export async function deleteBlobReferences(references: Array<string | null | undefined>): Promise<BlobCleanupResult> {
    const uniqueReferences = Array.from(
        new Set(
            references
                .filter((value): value is string => typeof value === "string")
                .map(normalizeBlobReference)
                .filter((value): value is string => Boolean(value))
        )
    );

    if (uniqueReferences.length === 0) {
        return { requested: 0, deleted: 0, failed: 0, errors: [] };
    }

    try {
        await del(uniqueReferences);
        return {
            requested: uniqueReferences.length,
            deleted: uniqueReferences.length,
            failed: 0,
            errors: [],
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Suppression Blob impossible";
        console.error("[blob-cleanup]", message);
        return {
            requested: uniqueReferences.length,
            deleted: 0,
            failed: uniqueReferences.length,
            errors: [message],
        };
    }
}

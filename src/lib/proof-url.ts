const BLOB_HOST_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/proofs\//;

export function isProofBlobUrl(value: string): boolean {
    return BLOB_HOST_PATTERN.test(value);
}

export function proxyProofUrl(blobUrl: string): string {
    if (!isProofBlobUrl(blobUrl)) return blobUrl;
    return `/api/proof?url=${encodeURIComponent(blobUrl)}`;
}

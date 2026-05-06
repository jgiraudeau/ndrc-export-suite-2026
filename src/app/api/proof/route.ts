import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";

const BLOB_HOST_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/proofs\//;

export async function GET(request: NextRequest) {
    const auth = await requireAuth(request, ["STUDENT", "TEACHER", "ADMIN"]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(request.url);
    const blobUrl = searchParams.get("url");

    if (!blobUrl || !BLOB_HOST_PATTERN.test(blobUrl)) {
        return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    try {
        const upstream = await fetch(blobUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!upstream.ok) {
            return NextResponse.json({ error: "Fichier introuvable" }, { status: upstream.status });
        }

        const contentType = upstream.headers.get("Content-Type") ?? "application/octet-stream";

        return new NextResponse(upstream.body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=3600",
                "Content-Disposition": "inline",
            },
        });
    } catch (error) {
        console.error("[api/proof]", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

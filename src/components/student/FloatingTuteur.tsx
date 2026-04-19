"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "model";
  content: string;
};

type PageContext = {
  label: string;
  context: string;
  suggestions: string[];
};

const PAGE_CONTEXTS: { prefix: string; ctx: PageContext }[] = [
  {
    prefix: "/student/wordpress",
    ctx: {
      label: "WordPress",
      context:
        "L'étudiant est actuellement sur la page WordPress. Oriente tes réponses sur la configuration WordPress, les pages, articles, plugins, thèmes, menus et YoastSEO dans le cadre du BTS NDRC.",
      suggestions: [
        "Comment créer une page ?",
        "Comment installer un plugin ?",
        "Comment configurer YoastSEO ?",
        "Comment créer un menu de navigation ?",
      ],
    },
  },
  {
    prefix: "/student/prestashop",
    ctx: {
      label: "PrestaShop",
      context:
        "L'étudiant est actuellement sur la page PrestaShop. Oriente tes réponses sur la gestion d'une boutique e-commerce : catalogue produits, catégories, commandes et SEO PrestaShop dans le cadre du BTS NDRC.",
      suggestions: [
        "Comment ajouter un produit ?",
        "Comment gérer les commandes ?",
        "Comment créer une catégorie ?",
        "Comment optimiser le référencement ?",
      ],
    },
  },
  {
    prefix: "/student/missions",
    ctx: {
      label: "Épreuve E5B",
      context:
        "L'étudiant travaille sur ses missions E5B (épreuve pratique CMS). Oriente tes réponses sur les missions WordPress et PrestaShop du BTS NDRC E5B.",
      suggestions: [
        "Quel est le format de l'E5B ?",
        "Comment se préparer à l'épreuve ?",
        "Quelles fonctionnalités WordPress maîtriser ?",
        "Comment gérer une boutique PrestaShop ?",
      ],
    },
  },
  {
    prefix: "/student/evaluations/e4",
    ctx: {
      label: "Épreuve E4",
      context:
        "L'étudiant prépare l'épreuve E4 (négociation et relation client BTS NDRC). Aide-le sur les techniques de vente, la relation client et les critères d'évaluation E4.",
      suggestions: [
        "Comment structurer une négociation ?",
        "Quels sont les critères d'évaluation E4 ?",
        "Comment préparer ma fiche produit ?",
        "Comment gérer les objections client ?",
      ],
    },
  },
  {
    prefix: "/student/evaluations/e6",
    ctx: {
      label: "Épreuve E6",
      context:
        "L'étudiant prépare l'épreuve E6 (projet commercial BTS NDRC). Aide-le sur la stratégie commerciale et la présentation du projet.",
      suggestions: [
        "Comment structurer mon projet E6 ?",
        "Quels indicateurs commerciaux présenter ?",
        "Comment analyser un marché ?",
        "Comment préparer la présentation orale ?",
      ],
    },
  },
  {
    prefix: "/student/journal",
    ctx: {
      label: "Journal de Bord",
      context:
        "L'étudiant remplit son journal de bord (suivi des activités et compétences BTS NDRC).",
      suggestions: [
        "Comment rédiger une activité ?",
        "Quelles compétences valoriser ?",
        "Comment lier mes activités au référentiel ?",
      ],
    },
  },
  {
    prefix: "/student/portfolio",
    ctx: {
      label: "Passeport Pro",
      context:
        "L'étudiant travaille sur son Passeport Pro (portfolio de compétences professionnelles BTS NDRC).",
      suggestions: [
        "Comment présenter mes compétences ?",
        "Quelles preuves inclure dans mon portfolio ?",
        "Comment valoriser mes expériences ?",
      ],
    },
  },
];

const DEFAULT_CONTEXT: PageContext = {
  label: "BTS NDRC",
  context: "L'étudiant est sur le tableau de bord BTS NDRC.",
  suggestions: [
    "Comment fonctionnent mes épreuves ?",
    "Qu'est-ce que le BTS NDRC ?",
    "Comment utiliser WordPress pour l'E5B ?",
    "Comment préparer l'épreuve E4 ?",
  ],
};

function getPageContext(pathname: string): PageContext {
  for (const { prefix, ctx } of PAGE_CONTEXTS) {
    if (pathname.startsWith(prefix)) return ctx;
  }
  return DEFAULT_CONTEXT;
}

export function FloatingTuteur() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Don't show on the full tutor page (already has the full-screen chat)
  const isOnChatPage = pathname.startsWith("/student/chat");

  useEffect(() => {
    if (isOpen && !isStreaming) {
      inputRef.current?.focus();
    }
  }, [isOpen, isStreaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pageCtx = getPageContext(pathname);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const token = localStorage.getItem("ndrc_token");
      if (!token) return;

      const userMessage = text.trim();
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsStreaming(true);
      // Placeholder for streaming model response
      setMessages((prev) => [...prev, { role: "model", content: "" }]);

      // Enrich the message with page context (invisible to the user in the UI)
      const enrichedMessage = `[Contexte: ${pageCtx.context}]\n\n${userMessage}`;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: enrichedMessage, sessionId }),
        });

        if (!res.ok || !res.body) throw new Error("Erreur réseau");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.sessionId) setSessionId(parsed.sessionId);
              if (parsed.chunk) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    role: "model",
                    content: last.content + parsed.chunk,
                  };
                  return updated;
                });
              }
            } catch {
              // ignore SSE parse errors
            }
          }
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "model",
            content: "Désolé, une erreur est survenue. Réessaie dans un moment.",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, sessionId, pageCtx.context]
  );

  if (isOnChatPage) return null;

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
            right: "1rem",
            width: "min(360px, calc(100vw - 2rem))",
            height: "min(520px, calc(100dvh - 9rem))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={16} />
              <span className="font-bold text-sm">Tuteur IA</span>
              <span className="text-[11px] bg-indigo-500 rounded-full px-2 py-0.5 font-medium">
                {pageCtx.label}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-500 rounded-lg p-1 transition-colors"
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles size={14} />
                  <p className="text-xs">
                    Questions suggérées pour{" "}
                    <span className="font-semibold text-indigo-600">{pageCtx.label}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pageCtx.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl px-3 py-1.5 transition-colors text-left leading-tight"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    )}
                  >
                    {msg.role === "model" ? (
                      msg.content ? (
                        <div className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-xs leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      )
                    ) : (
                      <span className="text-sm">{msg.content}</span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 p-3 border-t border-slate-100 shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pose ta question…"
              disabled={isStreaming}
              className="flex-1 text-sm bg-slate-50 rounded-xl px-3 py-2 outline-none border border-slate-200 focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2 transition-colors shrink-0"
            >
              {isStreaming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Button ──────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center",
          "bottom-20 right-4 md:bottom-6 md:right-6",
          isOpen
            ? "bg-slate-700 hover:bg-slate-800 rotate-0"
            : "bg-indigo-600 hover:bg-indigo-700"
        )}
        aria-label={isOpen ? "Fermer le tuteur IA" : "Ouvrir le tuteur IA"}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
      </button>
    </>
  );
}

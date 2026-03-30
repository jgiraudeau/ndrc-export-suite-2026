"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  History,
  Loader2,
  Sparkles,
  ChevronRight,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  _count: { messages: number };
}

const SUGGESTIONS = [
  "Comment réussir l'E4 ?",
  "Explique-moi le SEO en NDRC",
  "C'est quoi un tunnel de vente ?",
  "Aide pour mon E5B WordPress",
];

export default function StudentChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const loadSessionMessages = async (sid: string) => {
    setCurrentSessionId(sid);
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions/${sid}`);
      const data = await res.json();
      setMessages(
        (data.messages ?? []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const deleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette conversation ?")) return;
    setDeletingId(sid);
    try {
      await fetch(`/api/chat/sessions/${sid}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sid));
      if (currentSessionId === sid) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Placeholder pour la réponse en streaming
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: "model",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId: currentSessionId }),
      });

      if (!res.ok || !res.body) throw new Error("Erreur réseau");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sessionSet = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;

          try {
            const parsed = JSON.parse(raw);

            if (parsed.sessionId && !sessionSet) {
              setCurrentSessionId(parsed.sessionId);
              sessionSet = true;
              // Rafraîchir la liste des sessions
              setTimeout(fetchSessions, 500);
            }

            if (parsed.chunk) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? { ...m, content: m.content + parsed.chunk }
                    : m
                )
              );
            }

            if (parsed.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? { ...m, content: "Désolé, une erreur est survenue. Réessaie." }
                    : m
                )
              );
            }
          } catch {
            // chunk non-JSON, ignorer
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, content: "Désolé, j'ai rencontré une erreur technique. Peux-tu réessayer ?" }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Sidebar Historique ─────────────────────────────── */}
      <aside
        className={cn(
          "bg-white border-r border-slate-100 flex flex-col transition-all duration-300 relative z-20",
          isSidebarOpen ? "w-80" : "w-0 overflow-hidden border-none"
        )}
      >
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-indigo-600" size={18} />
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Historique</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden"
          >
            <ChevronRight className="rotate-180" size={20} />
          </Button>
        </div>

        <div className="p-4">
          <Button
            onClick={createNewSession}
            className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 shadow-lg shadow-indigo-100"
          >
            <Plus size={18} /> Nouvelle Discussion
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {sessionsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2 border border-slate-50 rounded-2xl">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSessionMessages(session.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border group relative",
                    currentSessionId === session.id
                      ? "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm"
                      : "bg-white border-slate-50 hover:border-indigo-100 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <p className="font-bold text-xs truncate mb-1 pr-6">{session.title}</p>
                  <div className="flex items-center gap-2 text-[10px] opacity-60">
                    <MessageSquare size={10} /> {session._count.messages} messages
                    <span>•</span>
                    {new Date(session.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    disabled={deletingId === session.id}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    {deletingId === session.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </button>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 text-xs font-bold">Aucune conversation</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Bouton toggle sidebar */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-indigo-600 text-white rounded-r-xl shadow-xl flex items-center justify-center z-30 hover:pl-2 transition-all"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* ── Chat Main Area ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative bg-[#fcfdff] min-w-0">

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 relative shrink-0">
              <Bot size={24} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-lg tracking-tight">
                Tuteur IA <span className="text-indigo-600">NDRC</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En ligne</span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="text-slate-400 text-[10px] font-medium">Spécialiste E4, E5B, E6</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-white border-slate-200 text-slate-500 font-bold px-3 py-1 rounded-full gap-2"
            >
              <Sparkles size={12} className="text-indigo-500" /> Intelligence Gemini
            </Badge>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10"
        >
          <div className="max-w-3xl mx-auto space-y-8">

            {/* État vide — suggestions */}
            {messages.length === 0 && !loading && (
              <div className="py-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 mx-auto rotate-6 scale-110">
                  <Bot size={40} />
                </div>
                <div className="max-w-sm mx-auto">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bonjour ! 👋</h2>
                  <p className="text-slate-400 font-medium text-sm mt-3 leading-relaxed">
                    Je suis ton tuteur IA spécialisé dans le BTS NDRC. Pose-moi n&apos;importe quelle question sur tes cours, tes épreuves ou WordPress / PrestaShop.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-4">
                  {SUGGESTIONS.map((tip) => (
                    <button
                      key={tip}
                      onClick={() => handleSendMessage(tip)}
                      className="p-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 hover:border-indigo-200 hover:text-indigo-600 transition-all text-left flex items-center justify-between group"
                    >
                      {tip}
                      <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4 animate-in fade-in duration-300",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <Avatar
                  className={cn(
                    "w-10 h-10 rounded-2xl shrink-0 border",
                    msg.role === "model"
                      ? "bg-indigo-600 text-white border-transparent"
                      : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                  <AvatarFallback className="font-bold bg-transparent">
                    {msg.role === "model" ? <Bot size={20} /> : <User size={20} />}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[85%]",
                    msg.role === "user" ? "items-end" : ""
                  )}
                >
                  <div
                    className={cn(
                      "p-4 md:p-5 rounded-[24px] shadow-sm",
                      msg.role === "model"
                        ? "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        : "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100"
                    )}
                  >
                    {msg.content === "" && msg.role === "model" ? (
                      // Indicateur de frappe
                      <div className="flex gap-1 items-center h-5">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "text-sm leading-relaxed prose prose-sm max-w-none",
                          msg.role === "user"
                            ? "text-white prose-invert"
                            : "text-slate-600 prose-slate"
                        )}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="p-6 md:p-10 pt-0">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-2xl shadow-indigo-500/5 flex items-center gap-2 pr-3 pl-4 focus-within:border-indigo-200 transition-all">
              <div className="p-2 text-indigo-400">
                <Sparkles size={18} />
              </div>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Pose ta question au tuteur..."
                className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-slate-600 font-bold placeholder:text-slate-300 placeholder:font-medium"
                disabled={loading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || loading}
                size="icon"
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-100 shrink-0"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </Button>
            </div>
            <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-4">
              Le tuteur peut commettre des erreurs. Vérifie toujours tes cours officiels.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

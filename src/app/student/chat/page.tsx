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
  BookOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function StudentChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charger les sessions au démarrage
  useEffect(() => {
    fetchSessions();
  }, []);

  // Déclencher le scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages, loading]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        // Optionnel : On ne charge pas de session par défaut pour inciter à en créer une nouvelle
      }
    } catch (err) {
      console.error("Erreur lors du chargement des sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (sid: string) => {
    setCurrentSessionId(sid);
    setLoading(true);
    try {
      // Pour l'instant, on n'a pas d'API spécifique pour loader les messages d'une session
      // On pourrait la créer ou simplement modifier /api/chat pour gérer le GET
      // Mais pour simplifier, on reset les messages et on attend le premier échange pour cette démo
      setMessages([]);
      // Simulation : on pourrait fetch /api/chat/sessions/${sid}/messages
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input, 
      createdAt: new Date().toISOString() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    const userText = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText, 
          sessionId: currentSessionId 
        }),
      });
      
      const data = await res.json();
      
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        fetchSessions(); // Rafraîchir la liste pour voir la nouvelle session
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.content,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: "error", 
        role: "model", 
        content: "Désolé, j'ai rencontré une erreur technique. Peux-tu réessayer ?", 
        createdAt: new Date().toISOString() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* ── Sidebar d'Historique ─────────────────────────────── */}
      <aside className={cn(
        "bg-white border-r border-slate-100 flex flex-col transition-all duration-300 relative z-20",
        isSidebarOpen ? "w-80" : "w-0 overflow-hidden border-none"
      )}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-indigo-600" size={18} />
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">Historique</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="md:hidden">
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
              sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSessionMessages(session.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border group",
                    currentSessionId === session.id 
                      ? "bg-indigo-50 border-indigo-100 text-indigo-700 active-shadow" 
                      : "bg-white border-slate-50 hover:border-indigo-100 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <p className="font-bold text-xs truncate mb-1">{session.title}</p>
                  <div className="flex items-center gap-2 text-[10px] opacity-60">
                    <MessageSquare size={10} /> {session._count.messages} messages
                    <span>•</span>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
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

      {/* Bouton Toggle Sidebar mobile/collapsed */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-indigo-600 text-white rounded-r-xl shadow-xl flex items-center justify-center z-30 hover:pl-2 transition-all"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* ── Chat Main Area ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative bg-[#fcfdff]">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 relative">
              <Bot size={24} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-lg tracking-tight">Tuteur IA <span className="text-indigo-600">NDRC</span></h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En ligne</span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="text-slate-400 text-[10px] font-medium">Spécialiste E4, E5B, E6</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold px-3 py-1 rounded-full gap-2">
              <Sparkles size={12} className="text-indigo-500" /> Intelligence Gemini
            </Badge>
          </div>
        </header>

        {/* Messages List */}
        <ScrollArea className="flex-1 p-6 md:p-10" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.length === 0 && !loading && (
              <div className="py-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 mx-auto transform rotate-6 scale-110">
                  <Bot size={40} />
                </div>
                <div className="max-w-sm mx-auto">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bonjour ! 👋</h2>
                  <p className="text-slate-400 font-medium text-sm mt-3 leading-relaxed">
                    Je suis ton tuteur IA spécialisé dans le BTS NDRC. Je peux t'aider pour tes cours, tes épreuves officielles ou l'utilisation de WordPress et PrestaShop. 
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-4">
                   {[
                     "Comment réussir l'E4 ?",
                     "Explique-moi le SEO en NDRC",
                     "C'est quoi un tunnel de vente ?",
                     "Aide pour mon E5B"
                   ].map(tip => (
                     <button 
                       key={tip} 
                       onClick={() => setInput(tip)}
                       className="p-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 hover:border-indigo-200 hover:text-indigo-600 transition-all text-left flex items-center justify-between group"
                     >
                       {tip} <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                     </button>
                   ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 group animate-in fade-in duration-300",
                  msg.role === "user" ? "flex-reverse" : ""
                )}
              >
                <Avatar className={cn(
                   "w-10 h-10 rounded-2xl shrink-0 border duration-500 hover:rotate-6",
                   msg.role === "model" ? "bg-indigo-600 text-white border-transparent" : "bg-white border-slate-100 text-slate-400"
                )}>
                  <AvatarFallback className="font-bold">
                    {msg.role === "model" ? <Bot size={20} /> : <User size={20} />}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "flex flex-col gap-2 max-w-[85%]",
                  msg.role === "user" ? "items-end ml-auto" : ""
                )}>
                  <div className={cn(
                    "p-4 md:p-5 rounded-[24px] shadow-sm relative",
                    msg.role === "model" 
                      ? "bg-white text-slate-700 border border-slate-50 rounded-tl-none" 
                      : "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100"
                  )}>
                    <div className="prose prose-sm prose-slate prose-invert max-w-none">
                      <div className={cn(
                          "text-sm leading-relaxed",
                          msg.role === "user" ? "text-indigo-50" : "text-slate-600 font-medium"
                        )}>
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

            {loading && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <Avatar className="w-10 h-10 rounded-2xl bg-indigo-600 text-white shrink-0 border border-transparent animate-pulse">
                  <AvatarFallback><Bot size={20} /></AvatarFallback>
                </Avatar>
                <div className="p-5 bg-white border border-slate-50 rounded-[24px] rounded-tl-none min-w-[120px] flex items-center justify-center h-14">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Floating Input Zone */}
        <div className="p-6 md:p-10 pt-0">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-2xl shadow-indigo-500/5 flex items-center gap-2 pr-3 pl-4 group focus-within:border-indigo-200 transition-all">
               <div className="p-2 text-indigo-400">
                  <Sparkles size={18} />
               </div>
               <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Pose ta question au tuteur..."
                className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-slate-600 font-bold placeholder:text-slate-300 placeholder:font-medium"
                disabled={loading}
               />
               <Button 
                onClick={handleSendMessage}
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

      <style jsx global>{`
        .prose p { margin-bottom: 0.5rem; }
        .prose p:last-child { margin-bottom: 0; }
        .flex-reverse { flex-direction: row-reverse; }
        .active-shadow { box-shadow: 0 10px 20px -5px rgba(81, 72, 215, 0.1); }
      `}</style>
    </div>
  );
}

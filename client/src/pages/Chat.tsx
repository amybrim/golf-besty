import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Send, MessageSquare, LogIn, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Who's your pick to win the next major?",
  "What do you think of Rory McIlroy's recent form?",
  "Break down Scottie Scheffler's dominance this season.",
  "Who's the greatest golfer of all time — Tiger or Jack?",
  "What's the toughest hole on the PGA Tour right now?",
];

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = trpc.golf.chatHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const chatMutation = trpc.golf.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
      setIsLoading(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Apologies — I lost my train of thought on that one. Try again?",
        },
      ]);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (history && history.length > 0 && messages.length === 0) {
      setMessages(
        history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      );
    }
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    chatMutation.mutate({
      message: text,
      history: messages.slice(-10),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-16 h-16 rounded-full club-header flex items-center justify-center">
          <MessageSquare size={28} className="text-brass" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Wally's Ready</h2>
          <p className="text-muted-foreground max-w-sm">
            Sign in and Wally will be right there.
          </p>
        </div>
        <a
          href={getLoginUrl()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg brass-badge font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <LogIn size={16} />
          Sign in to talk to Wally
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="w-10 h-10 rounded-full club-header flex items-center justify-center flex-shrink-0">
          <Flag size={18} className="text-brass" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-foreground text-lg">Wally</h1>
          <p className="text-muted-foreground text-xs font-mono">Jamie's Golf Bestie</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-light font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
          Ready
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 py-4"
          >
            <div className="text-center">
              <p className="text-muted-foreground text-sm italic font-serif">
                "The most important shot in golf is the next one."
              </p>
              <p className="text-muted-foreground/50 text-xs mt-1 font-mono">— Ben Hogan</p>
            </div>
            <div className="brass-divider opacity-30" />
            <div>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
                Start a conversation
              </p>
              <div className="grid grid-cols-1 gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 rounded-lg border border-border hover:border-brass/40 hover:bg-muted/50 transition-all text-sm text-foreground/80 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full club-header flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Flag size={12} className="text-brass" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "chat-user" : "chat-ai"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Streamdown>{msg.content}</Streamdown>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="w-7 h-7 rounded-full club-header flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <Flag size={12} className="text-brass" />
            </div>
            <div className="chat-ai px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brass animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-border mt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about golf, players, tournaments..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-deep/30 focus:border-green-deep/40 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 rounded-xl brass-badge disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

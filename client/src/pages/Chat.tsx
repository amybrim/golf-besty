import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestId } from "@/hooks/useGuestId";
import { Send, MessageSquare, Flag, Volume2, VolumeX, Mic, MicOff, Zap, ChevronDown } from "lucide-react";
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

const QUICK_REACTIONS = [
  { label: "Tell me something good", emoji: "⛳" },
  { label: "Who's hot right now?", emoji: "🔥" },
  { label: "What did I miss?", emoji: "📰" },
  { label: "Trash talk me", emoji: "😤" },
  { label: "This week's tournament", emoji: "🏆" },
  { label: "LIV drama update", emoji: "🎭" },
];

// Speak text using browser Web Speech API
function speakText(text: string, onEnd?: () => void, voiceName?: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  // Strip markdown for cleaner speech
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, ". ")
    .trim();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.88;
  utterance.pitch = 0.92;
  utterance.volume = 1.0;

  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    if (voiceName) {
      // User-selected voice by name
      const picked = voices.find((v) => v.name === voiceName);
      if (picked) { utterance.voice = picked; return; }
    }
    // Default priority: warm natural male voices
    const priority = [
      "Daniel", "Arthur", "Gordon", "Fred", "Alex",
      "Google UK English Male", "Google US English",
      "Microsoft Guy", "Microsoft David",
      "en-US-GuyNeural", "en-GB-RyanNeural",
    ];
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    let chosen: SpeechSynthesisVoice | undefined;
    for (const name of priority) {
      chosen = enVoices.find((v) => v.name.includes(name));
      if (chosen) break;
    }
    if (!chosen) {
      chosen = enVoices.find((v) => !v.name.toLowerCase().includes("female") && !v.name.includes("Samantha") && !v.name.includes("Karen") && !v.name.includes("Victoria")) ?? enVoices[0];
    }
    if (chosen) utterance.voice = chosen;
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = () => { setVoice(); window.speechSynthesis.onvoiceschanged = null; };
  }
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

function SpeakerButton({ text, autoPlay, voiceName }: { text: string; autoPlay: boolean; voiceName?: string }) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (autoPlay && text) {
      setSpeaking(true);
      speakText(text, () => setSpeaking(false), voiceName);
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [autoPlay, text, voiceName]);

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakText(text, () => setSpeaking(false), voiceName);
    }
  };

  if (!("speechSynthesis" in window)) return null;

  return (
    <button
      onClick={toggle}
      title={speaking ? "Stop reading" : "Read aloud"}
      className={`mt-1.5 ml-1 p-1.5 rounded-lg transition-all ${
        speaking
          ? "text-brass bg-brass/10 animate-pulse"
          : "text-muted-foreground hover:text-brass hover:bg-brass/10"
      }`}
    >
      {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
    </button>
  );
}

export default function Chat() {
  const guestId = useGuestId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [latestAiIndex, setLatestAiIndex] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load available voices — retry needed for iOS/Safari
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      if (voices.length > 0) setAvailableVoices(voices);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    // iOS needs a slight delay before voices are available
    const t1 = setTimeout(load, 300);
    const t2 = setTimeout(load, 1000);
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Human-sounding voice labels for display
  const voiceOptions = useMemo(() => {
    if (!availableVoices.length) return [];
    // Preferred warm/natural voices — show all available if fewer than 3 curated found
    const preferred = [
      "Daniel", "Arthur", "Gordon", "Fred", "Alex", "Oliver",
      "Google UK English Male", "Google US English",
      "Microsoft Guy", "Microsoft David", "Microsoft Mark",
      "en-US-GuyNeural", "en-GB-RyanNeural", "en-US-ChristopherNeural",
    ];
    const curated = preferred
      .map((name) => availableVoices.find((v) => v.name.includes(name)))
      .filter(Boolean) as SpeechSynthesisVoice[];
    const rest = availableVoices.filter(
      (v) => !curated.some((c) => c.name === v.name)
    );
    // If fewer than 3 curated voices found, show everything so Jamie always has choices
    return curated.length >= 3 ? [...curated, ...rest] : availableVoices;
  }, [availableVoices]);

  const { data: history } = trpc.golf.chatHistory.useQuery(
    { guestId },
    { enabled: !!guestId }
  );

  const chatMutation = trpc.golf.chat.useMutation({
    onSuccess: (data) => {
      const newIndex = messages.length + 1; // +1 because user msg was added
      setMessages((prev) => {
        const updated = [...prev, { role: "assistant" as const, content: data.content }];
        setLatestAiIndex(updated.length - 1);
        return updated;
      });
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

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;
      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setLatestAiIndex(null);
      chatMutation.mutate({
        message: text,
        guestId,
        history: messages.slice(-10),
      });
    },
    [isLoading, messages, chatMutation]
  );

  // Voice input via Web Speech API
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

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
        <div className="ml-auto flex items-center gap-2">
          {/* Voice picker — always visible */}
          {"speechSynthesis" in window && (
            <div className="relative">
              <button
                onClick={() => {
                  // Force-load voices on first open (needed on Safari/iOS)
                  if (availableVoices.length === 0) {
                    const v = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
                    if (v.length) setAvailableVoices(v);
                    else window.speechSynthesis.onvoiceschanged = () => {
                      setAvailableVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en")));
                      window.speechSynthesis.onvoiceschanged = null;
                    };
                  }
                  setVoicePickerOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-border text-muted-foreground hover:border-brass/30 hover:text-brass transition-all"
                title="Choose Wally's voice"
              >
                <Volume2 size={11} />
                <span className="hidden sm:inline">
                  {selectedVoice
                    ? (voiceOptions.find(v => v.name === selectedVoice)?.name.split(" ")[0] ?? "Voice")
                    : "Voice"}
                </span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {voicePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    className="absolute right-0 top-full mt-1.5 z-30 bg-card border border-border rounded-xl shadow-xl min-w-[220px] max-h-80 overflow-y-auto"
                  >
                    <div className="px-3 py-2 border-b border-border sticky top-0 bg-card">
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Wally's Voice</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">Tap any voice to preview it</p>
                    </div>
                    <button
                      onClick={() => { setSelectedVoice(undefined); setVoicePickerOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 ${
                        !selectedVoice ? "text-brass font-medium" : "text-foreground"
                      }`}
                    >
                      <span className="font-medium">Auto — Best available</span>
                      <span className="block text-xs text-muted-foreground font-mono mt-0.5">Picks the warmest voice on your device</span>
                    </button>
                    {availableVoices.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        Loading voices...
                      </div>
                    ) : (
                      voiceOptions.map((v) => (
                        <button
                          key={v.name}
                          onClick={() => {
                            setSelectedVoice(v.name);
                            setVoicePickerOpen(false);
                            speakText("Hey Jamie. Wally here.", undefined, v.name);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 border-t border-border/40 ${
                            selectedVoice === v.name ? "text-brass font-medium bg-brass/5" : "text-foreground"
                          }`}
                        >
                          <span className="font-medium">{v.name.replace(" (Enhanced)", "").replace(" (Premium)", "")}</span>
                          <span className="block text-xs text-muted-foreground font-mono mt-0.5">
                            {v.lang}{v.localService ? " · On device" : " · Online"}
                          </span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {/* Auto-play TTS toggle */}
          <button
            onClick={() => setAutoPlay((v) => !v)}
            title={autoPlay ? "Auto-read on (tap to turn off)" : "Auto-read off (tap to turn on)"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
              autoPlay
                ? "bg-brass/15 border-brass/40 text-brass"
                : "border-border text-muted-foreground hover:border-brass/30 hover:text-brass"
            }`}
          >
            {autoPlay ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span className="hidden sm:inline">{autoPlay ? "Reading" : "Aloud"}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-light font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-light animate-pulse" />
            Ready
          </div>
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

            {/* Quick Reactions */}
            <div>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap size={11} className="text-brass" /> Quick fire
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_REACTIONS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => sendMessage(r.label)}
                    className="text-left px-4 py-3 rounded-lg border border-border hover:border-brass/40 hover:bg-muted/50 transition-all text-sm text-foreground/80 hover:text-foreground flex items-center gap-2"
                  >
                    <span className="text-base">{r.emoji}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="brass-divider opacity-30" />

            <div>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-3">
                Or ask anything
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
              <div className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user" ? "chat-user" : "chat-ai"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {/* Speaker button on Wally messages */}
                {msg.role === "assistant" && (
                  <SpeakerButton
                    text={msg.content}
                    autoPlay={autoPlay && i === latestAiIndex}
                    voiceName={selectedVoice}
                  />
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
      <div className="pt-4 border-t border-border mt-4 space-y-2">
        {/* Quick reactions when conversation is active */}
        {messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_REACTIONS.map((r) => (
              <button
                key={r.label}
                onClick={() => sendMessage(r.label)}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-brass/40 hover:bg-muted/50 text-xs text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
              >
                <span>{r.emoji}</span>
                <span className="font-mono">{r.label}</span>
              </button>
            ))}
          </div>
        )}

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
            placeholder={isListening ? "Listening..." : "Ask about golf, players, tournaments..."}
            className={`flex-1 px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-green-deep/30 focus:border-green-deep/40 transition-all ${
              isListening ? "border-brass/60 ring-2 ring-brass/20" : "border-border"
            }`}
            disabled={isLoading}
          />

          {/* Mic button */}
          {hasSpeechRecognition && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              title={isListening ? "Stop listening" : "Speak to Wally"}
              className={`px-4 py-3 rounded-xl border transition-all disabled:opacity-40 active:scale-95 ${
                isListening
                  ? "bg-brass/20 border-brass text-brass animate-pulse"
                  : "border-border text-muted-foreground hover:border-brass/40 hover:text-brass"
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

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

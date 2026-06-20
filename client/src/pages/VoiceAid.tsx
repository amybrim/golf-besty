import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Plus, Trash2, Mic } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const DEFAULT_PHRASES = [
  // Immediate needs
  { category: "I Need", phrases: ["Water please", "Pain medication", "Nurse please", "Suction please", "Help me sit up", "I need to rest", "Blanket please", "Phone please"] },
  // How I feel
  { category: "I Feel", phrases: ["I'm okay", "I'm in pain", "I'm tired", "I'm scared", "I'm frustrated", "I love you", "Thank you", "Please stay"] },
  // Yes / No
  { category: "Yes / No", phrases: ["Yes", "No", "Maybe", "Not right now", "I don't know", "Please repeat that"] },
  // Golf (his world)
  { category: "Golf Talk", phrases: ["Let's talk golf", "What's happening on tour?", "Who won?", "Tell me about the tournament", "Nice shot", "That's a gimme", "I'm still beating you when I get out"] },
];

const STORAGE_KEY = "wally_voice_aid_custom";

function speakLoud(text: string, voiceName?: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.82;
  utterance.pitch = 0.9;
  utterance.volume = 1.0;

  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    if (voiceName) {
      const picked = voices.find((v) => v.name === voiceName);
      if (picked) { utterance.voice = picked; return; }
    }
    const priority = ["Daniel", "Arthur", "Gordon", "Google UK English Male", "Google US English", "Microsoft Guy", "Microsoft David"];
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    let chosen: SpeechSynthesisVoice | undefined;
    for (const name of priority) {
      chosen = enVoices.find((v) => v.name.includes(name));
      if (chosen) break;
    }
    if (!chosen) chosen = enVoices.find((v) => !v.name.toLowerCase().includes("female")) ?? enVoices[0];
    if (chosen) utterance.voice = chosen;
  };

  if (window.speechSynthesis.getVoices().length > 0) setVoice();
  else window.speechSynthesis.onvoiceschanged = () => { setVoice(); window.speechSynthesis.onvoiceschanged = null; };

  window.speechSynthesis.speak(utterance);
}

export default function VoiceAid() {
  const guestId = typeof window !== "undefined" ? (localStorage.getItem("wally_guest_id") ?? undefined) : undefined;
  const { track } = useAnalytics(guestId);
  const [typed, setTyped] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [customPhrases, setCustomPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [addingPhrase, setAddingPhrase] = useState(false);
  const [activeCategory, setActiveCategory] = useState(DEFAULT_PHRASES[0].category);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track page view on mount
  useEffect(() => {
    track("page_view", { page: "/voice-aid" });
  }, []);

  // Load custom phrases from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCustomPhrases(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Load voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      if (voices.length > 0) setAvailableVoices(voices);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    const t = setTimeout(load, 800);
    return () => { clearTimeout(t); window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handleSpeak = (text?: string) => {
    const toSpeak = (text ?? typed).trim();
    if (!toSpeak) return;
    setSpeaking(true);
    setLastSpoken(toSpeak);
    // Track typed speak (only when called from the Speak button, not from phrase tap)
    if (!text) track("voice_aid_typed_speak", { label: toSpeak.slice(0, 80) });
    const utterance = new SpeechSynthesisUtterance(toSpeak);
    utterance.rate = 0.82;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      if (selectedVoice) {
        const picked = voices.find((v) => v.name === selectedVoice);
        if (picked) { utterance.voice = picked; return; }
      }
      const priority = ["Daniel", "Arthur", "Gordon", "Google UK English Male", "Google US English", "Microsoft Guy", "Microsoft David"];
      const enVoices = voices.filter((v) => v.lang.startsWith("en"));
      let chosen: SpeechSynthesisVoice | undefined;
      for (const name of priority) {
        chosen = enVoices.find((v) => v.name.includes(name));
        if (chosen) break;
      }
      if (!chosen) chosen = enVoices.find((v) => !v.name.toLowerCase().includes("female")) ?? enVoices[0];
      if (chosen) utterance.voice = chosen;
    };

    window.speechSynthesis.cancel();
    if (window.speechSynthesis.getVoices().length > 0) setVoice();
    else window.speechSynthesis.onvoiceschanged = () => { setVoice(); window.speechSynthesis.onvoiceschanged = null; };
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handlePhraseClick = (phrase: string) => {
    setTyped(phrase);
    track("voice_aid_phrase_tap", { label: phrase });
    handleSpeak(phrase);
  };

  const handleSavePhrase = () => {
    if (!newPhrase.trim()) return;
    const updated = [...customPhrases, newPhrase.trim()];
    setCustomPhrases(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewPhrase("");
    setAddingPhrase(false);
  };

  const handleDeleteCustom = (idx: number) => {
    const updated = customPhrases.filter((_, i) => i !== idx);
    setCustomPhrases(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const currentCategory = DEFAULT_PHRASES.find((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-green-900 border-b border-brass/30 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-cream font-playfair text-2xl font-bold">Voice Aid</h1>
              <p className="text-cream/60 text-sm mt-0.5">Type or tap — Wally speaks for you</p>
            </div>
            {/* Voice selector */}
            {availableVoices.length > 0 && (
              <select
                value={selectedVoice ?? ""}
                onChange={(e) => setSelectedVoice(e.target.value || undefined)}
                className="text-xs bg-green-800 text-cream border border-brass/30 rounded-lg px-2 py-1.5 max-w-[140px] truncate"
              >
                <option value="">Default voice</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name.replace("Microsoft ", "").replace(" Online (Natural)", "")}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* PWA hero — big tap target for home screen launch */}
        {typed.trim() && (
          <button
            onClick={() => handleSpeak()}
            disabled={speaking}
            className="w-full bg-brass hover:bg-brass/90 text-green-950 font-black text-3xl py-6 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ minHeight: '88px' }}
          >
            <Volume2 size={32} />
            SPEAK
          </button>
        )}
        {speaking && (
          <button
            onClick={handleStop}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
            style={{ minHeight: '88px' }}
          >
            <VolumeX size={32} />
            STOP
          </button>
        )}

        {/* Main type-to-speak area */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type what you want to say..."
              className="w-full bg-transparent text-foreground text-2xl font-medium leading-relaxed resize-none outline-none placeholder:text-muted-foreground/40 min-h-[120px]"
              style={{ fontFamily: "'Lato', sans-serif" }}
              rows={4}
            />
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setTyped("")}
              disabled={!typed}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              Clear
            </button>
            <div className="flex-1" />
            {speaking ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl text-lg transition-all active:scale-95"
              >
                <VolumeX size={20} />
                Stop
              </button>
            ) : (
              <button
                onClick={() => handleSpeak()}
                disabled={!typed.trim()}
                className="flex items-center gap-2 bg-brass hover:bg-brass/90 text-green-950 font-bold px-8 py-3 rounded-xl text-xl transition-all active:scale-95 disabled:opacity-30 shadow-md"
              >
                <Volume2 size={22} />
                Speak
              </button>
            )}
          </div>
        </div>

        {/* Last spoken */}
        {lastSpoken && (
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Last said:</span>
            <span className="text-sm font-medium text-foreground flex-1 text-right truncate">{lastSpoken}</span>
            <button
              onClick={() => { track("voice_aid_say_again", { label: lastSpoken.slice(0, 80) }); handleSpeak(lastSpoken); }}
              className="shrink-0 text-brass hover:text-brass/80 transition-colors"
              title="Say again"
            >
              <Volume2 size={16} />
            </button>
          </div>
        )}

        {/* Quick phrase categories */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Phrases</h2>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {DEFAULT_PHRASES.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.category
                    ? "bg-brass text-green-950"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.category}
              </button>
            ))}
            {customPhrases.length > 0 && (
              <button
                onClick={() => setActiveCategory("My Phrases")}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === "My Phrases"
                    ? "bg-brass text-green-950"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                My Phrases
              </button>
            )}
          </div>

          {/* Phrase buttons */}
          <div className="grid grid-cols-2 gap-2">
            {activeCategory === "My Phrases"
              ? customPhrases.map((phrase, idx) => (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => handlePhraseClick(phrase)}
                      className="w-full text-left bg-card border border-border hover:border-brass/50 hover:bg-brass/5 rounded-xl px-4 py-3 text-base font-medium transition-all active:scale-95 pr-8"
                    >
                      {phrase}
                    </button>
                    <button
                      onClick={() => handleDeleteCustom(idx)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              : currentCategory?.phrases.map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => handlePhraseClick(phrase)}
                    className="text-left bg-card border border-border hover:border-brass/50 hover:bg-brass/5 rounded-xl px-4 py-3 text-base font-medium transition-all active:scale-95"
                  >
                    {phrase}
                  </button>
                ))}
          </div>
        </div>

        {/* Add custom phrase */}
        <div className="border border-dashed border-border rounded-xl p-4">
          {addingPhrase ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSavePhrase()}
                placeholder="Type your phrase..."
                autoFocus
                className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brass"
              />
              <button
                onClick={handleSavePhrase}
                disabled={!newPhrase.trim()}
                className="bg-brass text-green-950 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-40 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => { setAddingPhrase(false); setNewPhrase(""); }}
                className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingPhrase(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-brass transition-colors text-sm w-full"
            >
              <Plus size={16} />
              Add your own phrase
            </button>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Tap any phrase to speak it immediately. Type anything in the box above and tap Speak.
          <br />Your custom phrases are saved on this device.
        </p>
      </div>
    </div>
  );
}

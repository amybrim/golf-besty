import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Plus, Trash2, Gauge, Zap, ChevronLeft } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

// ── Jamie's Medical ID ───────────────────────────────────────────────────────

const JAMIE_MEDICAL_ID = {
  name: "Jamie Linskey",
  dob: "June 6, 1966",
  address: "29A Uncus Road, Gloucester, MA 01930",
  condition: "Laryngectomy / Tracheotomy — cannot speak. Communicates via device.",
  allergies: "No known allergies",
  doctor: "Dr. Feng — Mass Eye and Ear, Boston (Cancer / ENT)",
  hospital: "Addison Gilbert Hospital, Gloucester — or Mass Eye and Ear, Boston",
  contacts: [
    { name: "Amy Brimicombe — Sister", phone: "781-808-8061" },
    { name: "Deb Linskey — Mother", phone: "978-223-8538" },
  ],
};

const JAMIE_911_STATEMENT = `This is a medical emergency. My name is Jamie Linskey. I cannot speak — I have had a laryngectomy and tracheotomy. I need emergency assistance immediately. My address is 29A Uncus Road, Gloucester, Massachusetts, 01930. My emergency contacts are my sister Amy Brimicombe at 7 8 1, 8 0 8, 8 0 6 1, and my mother Deb Linskey at 9 7 8, 2 2 3, 8 5 3 8. My doctor is Doctor Feng at Mass Eye and Ear in Boston. I have no known allergies. Please send help now.`;

// ── Situation categories with real-world AAC phrases ─────────────────────────

const SITUATIONS = [
  {
    id: "emergency",
    label: "🚨 Urgent Help",
    color: "bg-red-600 text-white border-red-700",
    activeColor: "bg-red-600 text-white",
    phrases: [
      "I need help — this is urgent",
      "I am having trouble breathing",
      "My airway feels blocked",
      "I need suctioning now — it is urgent",
      "Something is wrong with my stoma",
      "I cannot get air — help me now",
      "Call my doctor immediately",
      "Please do not leave me alone",
      "I need an ambulance",
    ],
  },
  {
    id: "health",
    label: "🏥 Health",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "I am in pain",
      "My pain is getting worse",
      "I feel sick",
      "I feel dizzy",
      "I am having trouble breathing",
      "I need my medication",
      "I need to see the doctor",
      "I need to rest",
      "I am very tired",
      "I feel better today",
      "Please call the nurse",
      "I need suctioning",
    ],
  },
  {
    id: "needs",
    label: "🙏 I Need",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "Water please",
      "Food please",
      "Help me please",
      "Blanket please",
      "My phone please",
      "The TV remote please",
      "Can you sit with me?",
      "I need quiet please",
      "Open the window please",
      "Close the window please",
      "Turn the light on",
      "Turn the light off",
      "I need to use the bathroom",
      "Help me get comfortable",
    ],
  },
  {
    id: "yesno",
    label: "✅ Yes / No",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "Yes",
      "No",
      "Maybe",
      "I don't know",
      "Not right now",
      "Please repeat that",
      "I understand",
      "I don't understand",
      "That's correct",
      "That's not right",
      "Please wait",
      "I agree",
    ],
  },
  {
    id: "feelings",
    label: "❤️ Feelings",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "I love you",
      "Thank you",
      "I am okay",
      "I am happy",
      "I am frustrated",
      "I am scared",
      "I am bored",
      "I am proud of you",
      "I miss you",
      "You mean the world to me",
      "I am grateful",
      "I am having a good day",
      "I am having a hard day",
      "Please don't worry about me",
    ],
  },
  {
    id: "bank",
    label: "🏦 Out & About",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "I cannot speak due to a medical condition",
      "Please be patient with me — I use this device to communicate",
      "I would like to withdraw cash please",
      "Can I write this down for you?",
      "Thank you for your patience",
      "Can you speak more slowly please?",
      "Can you write that down for me?",
      "I would like to pay please",
      "How much does that cost?",
      "I have an appointment",
      "My name is Jamie",
      "I need assistance please",
    ],
  },
  {
    id: "family",
    label: "👨‍👩‍👧 Family",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "I love you all so much",
      "You are doing a great job looking after me",
      "Stop fussing — I am fine",
      "Come and sit with me",
      "Tell me what's been happening",
      "I am so proud of you",
      "Give me a hug",
      "I need some quiet time",
      "Can we watch something together?",
      "You are my world",
      "I couldn't do this without you",
      "Thank you for everything",
    ],
  },
  {
    id: "golf",
    label: "⛳ Golf Talk",
    color: "bg-card border-border text-foreground",
    activeColor: "bg-brass/10 border-brass text-foreground",
    phrases: [
      "What's the score?",
      "Who's leading the tournament?",
      "Put the golf on",
      "That was a terrible shot",
      "I would have made that putt",
      "That's a gimme",
      "He's choking",
      "She's on fire today",
      "I'll be back on the course soon",
      "I'm still beating you when I get out",
      "Let's talk golf",
      "What happened on tour today?",
    ],
  },
];

const STORAGE_KEY = "wally_voice_aid_custom";
const SPEED_KEY = "wally_voice_aid_speed";
const LOUD_KEY = "wally_voice_aid_loud";

export default function VoiceAid() {
  const guestId = typeof window !== "undefined" ? (localStorage.getItem("wally_guest_id") ?? undefined) : undefined;
  const { track } = useAnalytics(guestId);

  const [view, setView] = useState<"home" | "type" | "category" | "medical-id">("home");
  const [speaking911, setSpeaking911] = useState(false);
  const [activeSituation, setActiveSituation] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [customPhrases, setCustomPhrases] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [addingPhrase, setAddingPhrase] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lastSpoken, setLastSpoken] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem(SPEED_KEY) ?? "0.82"); } catch { return 0.82; }
  });
  const [loudMode, setLoudMode] = useState<boolean>(() => {
    try { return localStorage.getItem(LOUD_KEY) === "true"; } catch { return false; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { track("page_view", { page: "/voice-aid" }); }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCustomPhrases(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

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

  useEffect(() => { localStorage.setItem(SPEED_KEY, speechRate.toString()); }, [speechRate]);
  useEffect(() => { localStorage.setItem(LOUD_KEY, loudMode.toString()); }, [loudMode]);

  const buildUtterance = (text: string): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = loudMode ? 1.05 : 0.9;
    utterance.volume = 1.0;
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
    if (window.speechSynthesis.getVoices().length > 0) setVoice();
    else window.speechSynthesis.onvoiceschanged = () => { setVoice(); window.speechSynthesis.onvoiceschanged = null; };
    return utterance;
  };

  const speak = (text: string, source?: string) => {
    const toSpeak = text.trim();
    if (!toSpeak) return;
    setSpeaking(true);
    setLastSpoken(toSpeak);
    if (source) track("voice_aid_phrase_tap", { label: toSpeak.slice(0, 80), metadata: { source } });
    window.speechSynthesis.cancel();
    const utterance = buildUtterance(toSpeak);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setSpeaking(false); setSpeaking911(false); };

  const speak911 = () => {
    setSpeaking911(true);
    setSpeaking(true);
    setLastSpoken("911 Emergency Statement");
    track("voice_aid_911_statement", { label: "911" });
    window.speechSynthesis.cancel();
    const utterance = buildUtterance(JAMIE_911_STATEMENT);
    utterance.rate = 0.75; // Slow and clear for dispatcher
    utterance.onend = () => { setSpeaking(false); setSpeaking911(false); };
    utterance.onerror = () => { setSpeaking(false); setSpeaking911(false); };
    window.speechSynthesis.speak(utterance);
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

  const speedLabel = speechRate <= 0.65 ? "Slow" : speechRate <= 0.9 ? "Normal" : "Fast";
  const currentSituation = SITUATIONS.find((s) => s.id === activeSituation);

  // ── EMERGENCY shortcut — always visible ──────────────────────────────────
  const EmergencyBar = () => (
    <button
      onClick={() => { setActiveSituation("emergency"); setView("category"); }}
      className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xl py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 mb-4"
      style={{ minHeight: "72px" }}
    >
      🚨 URGENT HELP
    </button>
  );

  // ── SPEAK button ─────────────────────────────────────────────────────────
  const SpeakButton = ({ text }: { text: string }) => (
    speaking ? (
      <button
        onClick={stopSpeaking}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        style={{ minHeight: "88px" }}
      >
        <VolumeX size={32} /> STOP
      </button>
    ) : (
      <button
        onClick={() => speak(text, "typed")}
        disabled={!text.trim()}
        className="w-full bg-brass hover:bg-brass/90 text-green-950 font-black text-3xl py-6 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
        style={{ minHeight: "88px" }}
      >
        <Volume2 size={32} /> SPEAK
      </button>
    )
  );

  // ── Settings panel ────────────────────────────────────────────────────────
  const SettingsPanel = () => (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Gauge size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Speech Speed</span>
        <span className="ml-auto text-sm font-mono text-brass">{speedLabel}</span>
      </div>
      <input
        type="range" min={0.5} max={1.3} step={0.05} value={speechRate}
        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
        className="w-full h-2 accent-brass cursor-pointer"
      />
      <div className="flex gap-3">
        <button
          onClick={() => setLoudMode((v) => !v)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
            loudMode ? "bg-brass text-green-950 border-brass" : "border-border text-muted-foreground hover:border-brass/40"
          }`}
        >
          <Zap size={15} /> {loudMode ? "LOUD MODE ON" : "Louder (noisy rooms)"}
        </button>
      </div>
      {availableVoices.length > 0 && (
        <select
          value={selectedVoice ?? ""}
          onChange={(e) => setSelectedVoice(e.target.value || undefined)}
          className="w-full text-sm bg-muted text-foreground border border-border rounded-xl px-3 py-2.5"
        >
          <option value="">Default voice</option>
          {availableVoices.map((v) => (
            <option key={v.name} value={v.name}>{v.name.replace("Microsoft ", "").replace(" Online (Natural)", "")}</option>
          ))}
        </select>
      )}
    </div>
  );

  // ── VIEW: Category phrase list ────────────────────────────────────────────
  if (view === "category" && currentSituation) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="bg-green-900 border-b border-brass/30 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => { setView("home"); setActiveSituation(null); }}
              className="flex items-center gap-1.5 text-cream/70 hover:text-cream transition-colors text-sm font-mono"
            >
              <ChevronLeft size={18} /> Back
            </button>
            <span className="text-cream font-playfair text-xl font-bold flex-1 text-center">{currentSituation.label}</span>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
          {/* Last spoken + say again */}
          {lastSpoken && (
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Last said:</span>
              <span className="text-sm font-medium text-foreground flex-1 text-right truncate">{lastSpoken}</span>
              <button onClick={() => speak(lastSpoken, "say_again")} className="shrink-0 text-brass hover:text-brass/80 transition-colors">
                <Volume2 size={16} />
              </button>
            </div>
          )}

          {/* Phrase buttons — big tap targets */}
          <div className="grid grid-cols-1 gap-3">
            {currentSituation.phrases.map((phrase) => (
              <button
                key={phrase}
                onClick={() => speak(phrase, currentSituation.id)}
                className={`w-full text-left px-5 py-4 rounded-2xl border font-semibold text-lg transition-all active:scale-95 shadow-sm hover:shadow-md ${
                  currentSituation.id === "emergency"
                    ? "bg-red-600 hover:bg-red-700 text-white border-red-700"
                    : "bg-card border-border hover:border-brass/50 hover:bg-brass/5 text-foreground"
                }`}
                style={{ minHeight: "64px" }}
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Stop button if speaking */}
          {speaking && (
            <button
              onClick={stopSpeaking}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-2xl py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-2"
            >
              <VolumeX size={28} /> STOP
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── VIEW: Type to speak ───────────────────────────────────────────────────
  if (view === "type") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="bg-green-900 border-b border-brass/30 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setView("home")} className="flex items-center gap-1.5 text-cream/70 hover:text-cream transition-colors text-sm font-mono">
              <ChevronLeft size={18} /> Back
            </button>
            <span className="text-cream font-playfair text-xl font-bold flex-1 text-center">Type to Speak</span>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          <EmergencyBar />

          {/* Type area */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type what you want to say..."
                className="w-full bg-transparent text-foreground text-2xl font-medium leading-relaxed resize-none outline-none placeholder:text-muted-foreground/40 min-h-[140px]"
                rows={5}
                autoFocus
              />
            </div>
            <div className="border-t border-border px-4 py-3 flex items-center gap-3">
              <button onClick={() => setTyped("")} disabled={!typed} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
                Clear
              </button>
              <div className="flex-1" />
            </div>
          </div>

          <SpeakButton text={typed} />

          {/* Last spoken */}
          {lastSpoken && (
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Last said:</span>
              <span className="text-sm font-medium text-foreground flex-1 text-right truncate">{lastSpoken}</span>
              <button onClick={() => speak(lastSpoken, "say_again")} className="shrink-0 text-brass hover:text-brass/80 transition-colors">
                <Volume2 size={16} />
              </button>
            </div>
          )}

          {/* Settings */}
          <button onClick={() => setShowSettings((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
            {showSettings ? "Hide settings" : "⚙ Speed & voice settings"}
          </button>
          {showSettings && <SettingsPanel />}

          {/* My Phrases */}
          {customPhrases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">My Phrases</h3>
              <div className="grid grid-cols-1 gap-2">
                {customPhrases.map((phrase, idx) => (
                  <div key={idx} className="relative group flex gap-2">
                    <button
                      onClick={() => speak(phrase, "custom")}
                      className="flex-1 text-left bg-card border border-border hover:border-brass/50 hover:bg-brass/5 rounded-xl px-4 py-3 text-base font-medium transition-all active:scale-95"
                    >
                      {phrase}
                    </button>
                    <button onClick={() => handleDeleteCustom(idx)} className="text-muted-foreground hover:text-red-500 transition-colors px-2">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add custom phrase */}
          <div className="border border-dashed border-border rounded-xl p-4">
            {addingPhrase ? (
              <div className="flex gap-2">
                <input
                  type="text" value={newPhrase} onChange={(e) => setNewPhrase(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePhrase()}
                  placeholder="Type your phrase..." autoFocus
                  className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brass"
                />
                <button onClick={handleSavePhrase} disabled={!newPhrase.trim()} className="bg-brass text-green-950 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-40">Save</button>
                <button onClick={() => { setAddingPhrase(false); setNewPhrase(""); }} className="text-muted-foreground px-3 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingPhrase(true)} className="flex items-center gap-2 text-muted-foreground hover:text-brass transition-colors text-sm w-full">
                <Plus size={16} /> Add your own phrase
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: Medical ID ─────────────────────────────────────────────────────
  if (view === "medical-id") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="bg-green-900 border-b border-brass/30 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setView("home")} className="flex items-center gap-1.5 text-cream/70 hover:text-cream transition-colors text-sm font-mono">
              <ChevronLeft size={18} /> Back
            </button>
            <span className="text-cream font-playfair text-xl font-bold flex-1 text-center">Medical ID</span>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {/* 911 Speak button */}
          {speaking911 ? (
            <button
              onClick={stopSpeaking}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-2xl py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
              style={{ minHeight: "80px" }}
            >
              <VolumeX size={28} /> STOP READING
            </button>
          ) : (
            <button
              onClick={speak911}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-2xl py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
              style={{ minHeight: "80px" }}
            >
              <Volume2 size={28} /> READ TO 911 DISPATCHER
            </button>
          )}
          <p className="text-xs text-muted-foreground text-center font-mono -mt-2">Tap above — Wally reads your full medical situation aloud to the dispatcher</p>

          {/* Medical ID Card */}
          <div className="bg-card border-2 border-brass/40 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-green-900 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brass/20 border-2 border-brass flex items-center justify-center text-2xl">🏥</div>
                <div>
                  <div className="text-cream font-playfair text-xl font-bold">{JAMIE_MEDICAL_ID.name}</div>
                  <div className="text-cream/60 text-sm font-mono">DOB: {JAMIE_MEDICAL_ID.dob}</div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              <div className="px-5 py-4">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Condition</div>
                <div className="text-foreground font-semibold text-base leading-snug">{JAMIE_MEDICAL_ID.condition}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Address</div>
                <div className="text-foreground font-medium">{JAMIE_MEDICAL_ID.address}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Allergies</div>
                <div className="text-green-600 font-semibold">{JAMIE_MEDICAL_ID.allergies}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Doctor / Hospital</div>
                <div className="text-foreground font-medium">{JAMIE_MEDICAL_ID.doctor}</div>
                <div className="text-muted-foreground text-sm mt-0.5">{JAMIE_MEDICAL_ID.hospital}</div>
              </div>
              <div className="px-5 py-4">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Emergency Contacts</div>
                {JAMIE_MEDICAL_ID.contacts.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-1.5">
                    <div className="text-foreground font-medium text-sm">{c.name}</div>
                    <a href={`tel:${c.phone.replace(/-/g, "")}`} className="text-brass font-mono text-sm hover:underline">{c.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pb-4">
            Show this screen to any doctor, nurse, or first responder.<br />
            Tap <strong>Read to 911 Dispatcher</strong> to have Wally speak your full medical statement.
          </p>
        </div>
      </div>
    );
  }

  // ── VIEW: Home — situation grid ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-green-900 border-b border-brass/30 px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-cream font-playfair text-2xl font-bold">Voice Aid</h1>
          <p className="text-cream/60 text-sm mt-0.5">Tap a situation — Wally speaks for you</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Urgent Help — always first, full width, red */}
        <button
          onClick={() => { setActiveSituation("emergency"); setView("category"); }}
          className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-2xl py-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
          style={{ minHeight: "80px" }}
        >
          🚨 URGENT HELP
        </button>

        {/* Medical ID */}
        <button
          onClick={() => setView("medical-id")}
          className="w-full bg-green-900 hover:bg-green-800 active:scale-95 text-cream font-black text-2xl py-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
          style={{ minHeight: "80px" }}
        >
          🏥 MY MEDICAL ID
        </button>

        {/* Type anything — full width */}
        <button
          onClick={() => setView("type")}
          className="w-full bg-brass hover:bg-brass/90 active:scale-95 text-green-950 font-black text-2xl py-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
          style={{ minHeight: "80px" }}
        >
          ✏️ TYPE ANYTHING
        </button>

        {/* Last spoken — say again */}
        {lastSpoken && (
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Last said:</span>
            <span className="text-sm font-medium text-foreground flex-1 text-right truncate">{lastSpoken}</span>
            <button onClick={() => speak(lastSpoken, "say_again")} className="shrink-0 text-brass hover:text-brass/80 transition-colors">
              <Volume2 size={16} />
            </button>
          </div>
        )}

        {/* Situation grid — 2 columns, big buttons */}
        <div className="grid grid-cols-2 gap-3">
          {SITUATIONS.filter((s) => s.id !== "emergency").map((situation) => (
            <button
              key={situation.id}
              onClick={() => { setActiveSituation(situation.id); setView("category"); }}
              className="bg-card border border-border hover:border-brass/50 hover:bg-brass/5 active:scale-95 rounded-2xl px-4 py-5 text-left transition-all shadow-sm hover:shadow-md"
              style={{ minHeight: "80px" }}
            >
              <div className="text-2xl mb-1">{situation.label.split(" ")[0]}</div>
              <div className="font-semibold text-foreground text-base leading-tight">{situation.label.split(" ").slice(1).join(" ")}</div>
              <div className="text-muted-foreground text-xs mt-1 font-mono">{situation.phrases.length} phrases</div>
            </button>
          ))}

          {/* My Phrases tile */}
          {customPhrases.length > 0 && (
            <button
              onClick={() => { setActiveSituation("__custom__"); setView("type"); }}
              className="bg-card border border-dashed border-brass/40 hover:border-brass active:scale-95 rounded-2xl px-4 py-5 text-left transition-all"
              style={{ minHeight: "80px" }}
            >
              <div className="text-2xl mb-1">⭐</div>
              <div className="font-semibold text-foreground text-base">My Phrases</div>
              <div className="text-muted-foreground text-xs mt-1 font-mono">{customPhrases.length} saved</div>
            </button>
          )}
        </div>

        {/* Settings toggle */}
        <button onClick={() => setShowSettings((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono w-full text-center py-2">
          {showSettings ? "Hide settings ▲" : "⚙ Speed & voice settings ▼"}
        </button>
        {showSettings && <SettingsPanel />}

        <p className="text-xs text-muted-foreground text-center pb-6">
          Tap any situation to see phrases. Tap a phrase — it speaks immediately.<br />
          Use <strong>Type Anything</strong> for custom messages.
        </p>
      </div>
    </div>
  );
}

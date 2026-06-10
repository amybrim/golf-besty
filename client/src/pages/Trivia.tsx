import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw, Volume2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type TriviaQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\n+/g, " ").trim();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && (v.name.includes("Daniel") || v.name.includes("Alex") || v.name.includes("Google US English") || v.name.includes("Samantha"))
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function Trivia() {
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const { data: question, isLoading, refetch } = trpc.trivia.question.useQuery();

  const reactMutation = trpc.trivia.react.useMutation({
    onSuccess: (data) => {
      setReaction(data.reaction);
      speakText(data.reaction);
    },
  });

  const handleAnswer = useCallback(
    (optionLetter: string) => {
      if (!question || selected) return;
      setSelected(optionLetter);
      const correct = optionLetter === question.answer;
      setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      reactMutation.mutate({
        question: question.question,
        correct,
        answer: question.options.find((o: string) => o.startsWith(optionLetter + ".")) ?? optionLetter,
      });
    },
    [question, selected, reactMutation]
  );

  const nextQuestion = () => {
    setSelected(null);
    setReaction(null);
    setFetchKey((k) => k + 1);
    refetch();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-brass" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Golf Trivia</h1>
          </div>
          <p className="text-muted-foreground text-sm">Wally quizzes you. Tap your answer.</p>
        </div>
        {score.total > 0 && (
          <div className="text-right">
            <div className="font-score text-xl text-brass font-bold">{score.correct}/{score.total}</div>
            <div className="text-xs font-mono text-muted-foreground">
              {Math.round((score.correct / score.total) * 100)}% correct
            </div>
          </div>
        )}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-8 space-y-4"
          >
            <div className="h-6 bg-muted rounded animate-pulse w-3/4 mx-auto" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </motion.div>
        ) : question ? (
          <motion.div
            key={fetchKey}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-5"
          >
            {/* Question */}
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-lg font-semibold text-foreground leading-snug flex-1">
                {question.question}
              </p>
              {"speechSynthesis" in window && (
                <button
                  onClick={() => speakText(question.question)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-brass transition-colors flex-shrink-0"
                  title="Read aloud"
                >
                  <Volume2 size={15} />
                </button>
              )}
            </div>

            <div className="brass-divider" />

            {/* Options */}
            <div className="space-y-2.5">
              {question.options.map((opt: string, i: number) => {
                const letter = OPTION_LETTERS[i];
                const isSelected = selected === letter;
                const isCorrect = letter === question.answer;
                const revealed = selected !== null;

                let style = "border-border bg-card text-foreground hover:border-brass/40";
                if (revealed) {
                  if (isCorrect) style = "border-green-mid bg-green-mid/10 text-green-deep";
                  else if (isSelected && !isCorrect) style = "border-red-400 bg-red-500/10 text-red-600";
                  else style = "border-border bg-card text-muted-foreground opacity-50";
                }

                return (
                  <motion.button
                    key={opt}
                    onClick={() => handleAnswer(letter!)}
                    disabled={!!selected}
                    whileTap={!selected ? { scale: 0.98 } : {}}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${style} ${!selected ? "cursor-pointer active:scale-[0.98]" : "cursor-default"}`}
                  >
                    <span className="w-7 h-7 rounded-full border border-current flex items-center justify-center flex-shrink-0 font-score text-sm font-bold">
                      {letter}
                    </span>
                    <span className="text-sm font-medium leading-snug flex-1">{opt.replace(/^[A-D]\.\s*/, "")}</span>
                    {revealed && isCorrect && <CheckCircle size={16} className="text-green-mid flex-shrink-0" />}
                    {revealed && isSelected && !isCorrect && <XCircle size={16} className="text-red-500 flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation after answer */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">The answer</p>
                    <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
                  </div>

                  {/* Wally's reaction */}
                  {reactMutation.isPending ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="w-6 h-6 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-brass text-xs font-bold">W</span>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-brass rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-brass rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-brass rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  ) : reaction ? (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-brass text-xs font-bold font-serif">W</span>
                      </div>
                      <div className="flex-1 bg-card border border-brass/20 rounded-xl rounded-tl-sm px-4 py-3">
                        <p className="text-sm text-foreground leading-relaxed italic font-serif">{reaction}</p>
                        {"speechSynthesis" in window && (
                          <button
                            onClick={() => speakText(reaction)}
                            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-brass transition-colors"
                          >
                            <Volume2 size={11} /> Read aloud
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <Button
                    onClick={nextQuestion}
                    className="w-full brass-badge font-semibold"
                  >
                    <RefreshCw size={14} className="mr-2" />
                    Next Question
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Score summary */}
      {score.total >= 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-4 text-center"
        >
          <p className="text-muted-foreground text-sm font-mono">
            {score.correct}/{score.total} correct —{" "}
            {score.correct / score.total >= 0.8
              ? "Wally's impressed. You know your golf."
              : score.correct / score.total >= 0.5
              ? "Not bad. Keep going."
              : "Wally's worried about you. Study up."}
          </p>
        </motion.div>
      )}
    </div>
  );
}

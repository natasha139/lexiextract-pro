import React, { useState } from "react";
import { CorpusAnalysisResult, QuizData, QuizQuestion } from "../types";
import { API_BASE } from "../config";
import {
  Sparkles,
  BrainCircuit,
  Check,
  X,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Loader2,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
  History,
  TrendingUp
} from "lucide-react";

interface QuizViewProps {
  corpusData: CorpusAnalysisResult;
}

interface SpacedRepItem {
  id: string;
  item: string;
  type: "word" | "phrase" | "pattern";
  box: number; // Leitner Box (1 is hardest/newest, 5 is mastered)
  correctCount: number;
  incorrectCount: number;
  lastTested?: string;
}

export default function QuizView({ corpusData }: QuizViewProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Spaced repetition collapsible status state
  const [showSrStats, setShowSrStats] = useState(false);

  // Spaced repetition local database state
  const [spacedRepData, setSpacedRepData] = useState<Record<string, SpacedRepItem>>(() => {
    try {
      const saved = localStorage.getItem("corpus-spaced-repetition");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Error reading spaced repetition from localStorage", e);
      return {};
    }
  });

  // Quiz running state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [viewingExplanations, setViewingExplanations] = useState<Set<string>>(new Set());

  // Save spaced rep state helper
  const saveSpacedRepData = (newData: Record<string, SpacedRepItem>) => {
    setSpacedRepData(newData);
    try {
      localStorage.setItem("corpus-spaced-repetition", JSON.stringify(newData));
    } catch (e) {
      console.error("Error writing spaced repetition to localStorage", e);
    }
  };

  // Build a flat list of current lexical and syntactic study items
  const getUnifiedItems = () => {
    const list: Array<{ id: string; item: string; type: "word" | "phrase" | "pattern" }> = [];

    corpusData.vocabulary_blocks?.forEach((v) => {
      list.push({ id: v.id, item: v.item, type: "word" });
    });

    corpusData.phrase_blocks?.forEach((p) => {
      list.push({ id: p.id, item: p.item, type: "phrase" });
    });

    corpusData.sentence_patterns?.forEach((s) => {
      list.push({ id: s.id, item: s.pattern_structure, type: "pattern" });
    });

    return list;
  };

  const unifiedItems = getUnifiedItems();

  // Map user analysis state to the spaced repetition scheduler
  const currentCorpusTracked = unifiedItems.map((ui) => {
    const saved = spacedRepData[ui.item] || spacedRepData[ui.id];
    if (saved) {
      return saved;
    }
    // Return standard initial fallback representation
    return {
      id: ui.id,
      item: ui.item,
      type: ui.type,
      box: 1, // Default to box 1 (review most urgent)
      correctCount: 0,
      incorrectCount: 0,
    };
  });

  // Calculate box counts
  const box1Count = currentCorpusTracked.filter((item) => item.box === 1).length;
  const box23Count = currentCorpusTracked.filter((item) => item.box === 2 || item.box === 3).length;
  const box45Count = currentCorpusTracked.filter((item) => item.box === 4 || item.box === 5).length;

  // Retrieve priority focus list to instruct Gemini to generate customized reviews for them
  const getSpacedRepPriorityItems = () => {
    // Sort items based on progress difficulty to scheduling:
    // 1. Lower box level first (box 1 is high priority)
    // 2. High incorrect review rates next
    // 3. Keep scheduling balanced
    const sorted = [...currentCorpusTracked].sort((a, b) => {
      if (a.box !== b.box) {
        return a.box - b.box;
      }
      if (b.incorrectCount !== a.incorrectCount) {
        return b.incorrectCount - a.incorrectCount;
      }
      return (a.correctCount + a.incorrectCount) - (b.correctCount + b.incorrectCount);
    });

    // Take top 4 priority items to focus on
    return sorted.slice(0, 4).map((item) => item.item);
  };

  const priorityItems = getSpacedRepPriorityItems();

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setUserAnswers({});
    setViewingExplanations(new Set());

    try {
      const focusItems = getSpacedRepPriorityItems();

      const response = await fetch(`${API_BASE}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corpusData,
          spacedRepPriorityItems: focusItems,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to make quiz content.");
      }

      const quizData: QuizData = await response.json();
      setQuiz(quizData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during quiz generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  // Grade responses and recalculate spaced-repetition intervals/Leitner boxes
  const updateSpacedRepetitionGrades = (questions: QuizQuestion[], submissions: Record<string, string>) => {
    const nextSpacedRep = { ...spacedRepData };

    questions.forEach((q) => {
      const uAns = (submissions[q.id] || "").trim().toLowerCase();
      const cAns = q.correctAnswer.trim().toLowerCase();

      let isCorrect = false;
      if (q.type === "multiple-choice") {
        isCorrect = uAns === cAns || uAns.charAt(0) === cAns.charAt(0);
      } else {
        isCorrect = cAns.includes(uAns) && uAns.length > 3;
      }

      // Match the quiz's tested item with our actual parsed lexical blocks
      const targetItemName = q.target_item?.trim() || "";
      let matchedUI = unifiedItems.find(
        (ui) =>
          ui.item.toLowerCase() === targetItemName.toLowerCase() ||
          targetItemName.toLowerCase().includes(ui.item.toLowerCase()) ||
          ui.item.toLowerCase().includes(targetItemName.toLowerCase())
      );

      if (!matchedUI) {
        matchedUI = unifiedItems.find((ui) => q.question.toLowerCase().includes(ui.item.toLowerCase()));
      }

      if (matchedUI) {
        const itemKey = matchedUI.item;
        const currentItem = nextSpacedRep[itemKey] || {
          id: matchedUI.id,
          item: itemKey,
          type: matchedUI.type,
          box: 1,
          correctCount: 0,
          incorrectCount: 0,
        };

        if (isCorrect) {
          currentItem.correctCount += 1;
          // Upgrade: Advance item up to next box level (max 5)
          currentItem.box = Math.min(currentItem.box + 1, 5);
        } else {
          currentItem.incorrectCount += 1;
          // Downgrade: Reset to Box 1 for high-frequency reinforcement, scheduling it more often
          currentItem.box = 1;
        }

        currentItem.lastTested = new Date().toISOString();
        nextSpacedRep[itemKey] = currentItem;
      }
    });

    saveSpacedRepData(nextSpacedRep);
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    if (quiz) {
      updateSpacedRepetitionGrades(quiz.questions, userAnswers);
    }
  };

  const toggleExplanation = (id: string) => {
    const nextSet = new Set(viewingExplanations);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setViewingExplanations(nextSet);
  };

  const calcScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q) => {
      const uAns = (userAnswers[q.id] || "").trim().toLowerCase();
      const cAns = q.correctAnswer.trim().toLowerCase();

      if (q.type === "multiple-choice") {
        if (uAns === cAns || uAns.charAt(0) === cAns.charAt(0)) {
          correct++;
        }
      } else {
        if (uAns === cAns || cAns.includes(uAns) && uAns.length > 5) {
          correct++;
        }
      }
    });
    return correct;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <BrainCircuit className="h-10 w-10 text-emerald-500 mx-auto" />
        <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 leading-tight">
          Exam-Ready Practice Assessment
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Generate an adaptive vocabulary and syntax exam customized perfectly for the target <strong className="text-slate-700 dark:text-slate-250">{corpusData.meta_data.target_level}</strong> curriculum.
        </p>
      </div>

      {/* Spaced Repetition Study Engine Status */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 shadow-3xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer" onClick={() => setShowSrStats(!showSrStats)}>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500/20 animate-pulse shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Late-Night Spaced Repetition Engine</span>
                <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                  Active
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Prioritizes harder topics to maximize memory retention. {unifiedItems.length} active items tracked.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center">
            {/* Box counts summary */}
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-mono border border-red-100 dark:border-red-900/30 font-bold">
                Box 1 (Hard): {box1Count}
              </span>
              <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-100 dark:border-amber-900/30 font-bold">
                Box 2-3: {box23Count}
              </span>
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-100 dark:border-emerald-900/30 font-bold">
                Box 4-5: {box45Count}
              </span>
            </div>
            {showSrStats ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </div>

        {/* Expanded analytics dashboard */}
        {showSrStats && (
          <div className="mt-4 pt-4 border-t border-gray-150 dark:border-slate-800 space-y-4 animate-fadeIn">
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Based on the scientific Leitner learning technique, answering questions correctly graduates standard vocabulary and structures to higher mastery bands (spaced-out reviews). Answering incorrectly instantly resets items back to **Box 1**, ensuring they are queued to appear with much higher frequency in upcoming sessions.
            </p>

            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/20 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-normal">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] uppercase font-bold text-amber-800 dark:text-amber-400 tracking-wide font-sans shrink-0">
                  Adaptive Focus Queue for next exam:
                </span>
                {priorityItems.length > 0 ? (
                  priorityItems.map((item) => (
                    <span key={item} className="bg-white dark:bg-slate-850 text-[10px] text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800 rounded px-2 py-0.5 font-mono font-bold shadow-3xs max-w-[150px] truncate">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Queue is empty. Select standard files.</span>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to restore all items to standard Box 1 status?")) {
                    saveSpacedRepData({});
                  }
                }}
                className="text-[10px] font-mono text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline font-semibold cursor-pointer shrink-0 self-end md:self-center"
              >
                Reset Repetition History
              </button>
            </div>

            {/* Grid display of cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {currentCorpusTracked.map((ti) => (
                <div key={ti.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="overflow-hidden min-w-0">
                    <p className="font-mono font-bold text-xs truncate text-slate-900 dark:text-slate-150" title={ti.item}>
                      {ti.item}
                    </p>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                      {ti.type}
                    </span>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    {/* Visual filled circles for Box status */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            idx <= ti.box
                              ? ti.box === 1
                                ? "bg-red-500 shadow-3xs"
                                : ti.box <= 3
                                ? "bg-amber-500 shadow-3xs"
                                : "bg-emerald-500 shadow-3xs"
                              : "bg-gray-250 dark:bg-slate-800"
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 ml-1">
                        B{ti.box}
                      </span>
                    </div>

                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono">
                      ✅ {ti.correctCount} | ❌ {ti.incorrectCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!quiz && !loading && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-8 hover:shadow-xs text-center space-y-5 transition-colors">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Clicking the button below parses your extracted words, idioms, and pattern structures to generate a 5-question curriculum exam with customized, real-time interactive assessment grading.
          </p>
          <button
            onClick={generateQuiz}
            className="px-6 py-2.5 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto cursor-pointer text-sm shadow-xs hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="h-4 w-4 text-emerald-200 animate-pulse" />
            Assemble Assessment Practice Exam
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-16 text-center space-y-4 transition-colors">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Formulating Diagnostic Quiz...</h4>
            <p className="text-xs text-gray-400 dark:text-slate-400">Synthesizing multiple-choice, fill-in-the-blank, and pattern rewrites...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs flex gap-3 items-start">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Generation failed</p>
            <p>{error}</p>
            <button
              onClick={generateQuiz}
              className="mt-2 text-red-800 dark:text-red-300 font-semibold underline cursor-pointer hover:text-red-900 dark:hover:text-red-200 block"
            >
              Retry generation
            </button>
          </div>
        </div>
      )}

      {quiz && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between transition-colors">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Diagnostic Practice</p>
              <h4 className="text-base font-display font-extrabold text-slate-900 dark:text-slate-100 mt-1">{quiz.title}</h4>
            </div>
            <button
              onClick={generateQuiz}
              className="p-1 px-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-[11px] font-semibold text-gray-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-slate-200 duration-150 border border-transparent hover:border-gray-150 dark:hover:border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Re-roll Questions
            </button>
          </div>

          {/* Score Summary Box */}
          {submitted && (
            <div className={`p-6 rounded-2xl border text-center space-y-2 transition-colors ${
              calcScore() >= 3
                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200"
            }`}>
              <h4 className="text-xs uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Diagnostic Practice Grades</h4>
              <p className="text-4xl font-display font-extrabold">
                {calcScore()} <span className="text-xl text-gray-450">/ 5 Questions Correct</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-350 block mt-1">
                {calcScore() === 5
                  ? "Flawless score! Standard curriculum items fully assimilated."
                  : calcScore() >= 3
                  ? "Great job! Keep reviewing the flagged collocations and syntax items."
                  : "Study the analytical explanations and flashcard decks to reinforce understanding."}
              </p>
            </div>
          )}

          {/* Question blocks */}
          <div className="space-y-6">
            {quiz.questions.map((q, qIndex) => {
              const uAns = userAnswers[q.id] || "";
              const isCorrect = submitted && (
                q.type === "multiple-choice"
                  ? uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() || uAns.trim().toLowerCase().charAt(0) === q.correctAnswer.trim().toLowerCase().charAt(0)
                  : q.correctAnswer.trim().toLowerCase().includes(uAns.trim().toLowerCase()) && uAns.trim().length > 3
              );

              // Check if this tested target_item is inside the prioritized spaced repetition items
              const isSpacedRepFocus = q.target_item && priorityItems.some(
                (pi) =>
                  pi.toLowerCase() === q.target_item.toLowerCase() ||
                  q.target_item.toLowerCase().includes(pi.toLowerCase()) ||
                  pi.toLowerCase().includes(q.target_item.toLowerCase())
              );

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all duration-200 ${
                    submitted
                      ? isCorrect
                        ? "border-emerald-200 dark:border-emerald-800 shadow-xs ring-4 ring-emerald-500/5 dark:ring-emerald-500/10"
                        : "border-red-200 dark:border-red-800 shadow-xs ring-4 ring-red-500/5 dark:ring-red-500/10"
                      : "border-gray-150 dark:border-slate-800 hover:border-gray-250 dark:hover:border-slate-750 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="space-y-1 w-full">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                          Question {qIndex + 1} • {q.type.replace("-", " ")}
                        </span>
                        {isSpacedRepFocus && (
                          <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-850 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Zap className="h-2.5 w-2.5 fill-amber-500/15" />
                            Spaced Repetition Priority
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-900 dark:text-slate-100 font-sans leading-relaxed">
                        {q.question}
                      </p>
                    </div>

                    {submitted && (
                      <span className={`shrink-0 p-1 rounded-full ${
                        isCorrect ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                      }`}>
                        {isCorrect ? <Check className="h-4 w-4 stroke-[3]" /> : <X className="h-4 w-4 stroke-[3]" />}
                      </span>
                    )}
                  </div>

                  {/* Render Answer Interface depending on type */}
                  {q.type === "multiple-choice" && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => {
                        const isSelected = uAns === opt;
                        const isOptCorrect = submitted && (
                          opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                          opt.trim().toLowerCase().charAt(0) === q.correctAnswer.trim().toLowerCase().charAt(0)
                        );

                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={submitted}
                            onClick={() => handleSelectOption(q.id, opt)}
                            className={`p-3 text-left rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs border-slate-950 dark:border-white"
                                : submitted && isOptCorrect
                                ? "bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-500 dark:border-emerald-650"
                                : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:-translate-y-0.5 active:translate-y-0"
                            } ${submitted ? "cursor-default transform-none hover:transform-none" : "cursor-pointer"}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "fill-in-the-blank" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        disabled={submitted}
                        value={uAns}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Type the correct vocabulary word or collocation..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-250 dark:border-slate-700 dark:bg-slate-800 text-sm focus:outline-hidden focus:border-slate-500 dark:focus:border-slate-600 focus:ring-1 focus:ring-slate-505 dark:focus:ring-slate-605 text-slate-900 dark:text-slate-100"
                      />
                      {submitted && !isCorrect && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                          Target correct answer: <strong className="font-bold">{q.correctAnswer}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {q.type === "sentence-rewrite" && (
                    <div className="space-y-2">
                      <textarea
                        disabled={submitted}
                        value={uAns}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        rows={3}
                        placeholder="Write your complete rewritten sentence here..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-250 dark:border-slate-700 dark:bg-slate-800 text-sm focus:outline-hidden focus:border-slate-500 dark:focus:border-slate-600 focus:ring-1 focus:ring-slate-505 dark:focus:ring-slate-655 text-slate-900 dark:text-slate-100"
                      />
                      {submitted && !isCorrect && (
                        <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg text-xs space-y-1">
                          <p className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">Target model response:</p>
                          <p className="text-slate-805 dark:text-slate-300 font-sans italic">"{q.correctAnswer}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Explanation */}
                  {submitted && (
                    <div className="mt-4 border-t border-gray-150 dark:border-slate-850 pt-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(q.id)}
                          className="text-xs text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          {viewingExplanations.has(q.id) ? "Hide Explanation" : "View Analytical Explanation"}
                        </button>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">
                          Target item: {q.target_item}
                        </span>
                      </div>

                      {viewingExplanations.has(q.id) && (
                        <div className="bg-slate-50/50 dark:bg-slate-850/50 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans mt-2">
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="px-5 py-2.5 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                Submit Exam Answers
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={generateQuiz}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-4 w-4 text-emerald-200" />
                Regenerate New Exam
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { CorpusAnalysisResult } from "../types";
import {
  Brain,
  Zap,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Award,
  BookOpen,
  Keyboard,
  Eye,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  BookmarkCheck
} from "lucide-react";

interface SmartReviewViewProps {
  data: CorpusAnalysisResult;
}

interface ReviewCard {
  id: string;
  item: string;
  type: "word" | "phrase" | "pattern";
  partOfSpeech: string;
  definitionEn: string;
  contextSentence: string;
  academicExample: string;
  box: number;
}

export default function SmartReviewView({ data }: SmartReviewViewProps) {
  // Spaced-repetition data from localStorage
  const [spacedRepData, setSpacedRepData] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("corpus-spaced-repetition");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeReviewMode, setActiveReviewMode] = useState<"cards" | "writing">("cards");
  
  // Flat compiled items list
  const getUnifiedCards = (): ReviewCard[] => {
    const list: ReviewCard[] = [];

    data.vocabulary_blocks?.forEach((v) => {
       const srInfo = spacedRepData[v.item] || spacedRepData[v.id];
       list.push({
         id: v.id,
         item: v.item,
         type: "word",
         partOfSpeech: v.part_of_speech,
         definitionEn: v.definition_en,
         contextSentence: v.contextual_sentence,
         academicExample: v.academic_example,
         box: srInfo?.box || 1,
       });
    });

    data.phrase_blocks?.forEach((p) => {
       const srInfo = spacedRepData[p.item] || spacedRepData[p.id];
       list.push({
         id: p.id,
         item: p.item,
         type: "phrase",
         partOfSpeech: "Phrase",
         definitionEn: p.definition_en,
         contextSentence: p.contextual_sentence,
         academicExample: p.academic_example,
         box: srInfo?.box || 1,
       });
    });

    data.sentence_patterns?.forEach((s) => {
       const srInfo = spacedRepData[s.pattern_structure] || spacedRepData[s.id];
       list.push({
         id: s.id,
         item: s.pattern_structure,
         type: "pattern",
         partOfSpeech: "Sentence structure",
         definitionEn: s.functional_purpose,
         contextSentence: s.contextual_sentence,
         academicExample: s.academic_example,
         box: srInfo?.box || 1,
       });
    });

    return list;
  };

  const allCards = getUnifiedCards();

  // Spaced-repetition filtering queue: Prioritize harder boxes
  const reviewQueue = [...allCards].sort((a, b) => {
    if (a.box !== b.box) {
      return a.box - b.box; // Box 1 first, Box 5 last
    }
    return 0;
  });

  // Active indices
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Custom orthography spelling exercise state for Box 1 terms
  const [spellingAnswers, setSpellingAnswers] = useState<Record<string, string>>({});
  const [spellingGraded, setSpellingGraded] = useState<Record<string, boolean>>({});

  const activeCard = reviewQueue[currentQueueIndex] || null;

  // Grade action helper
  const handleGradeCard = (rating: "hard" | "so-so" | "easy") => {
    if (!activeCard) return;

    const nextSpacedRep = { ...spacedRepData };
    const currentItem = nextSpacedRep[activeCard.item] || {
      id: activeCard.id,
      item: activeCard.item,
      type: activeCard.type,
      box: activeCard.box,
      correctCount: 0,
      incorrectCount: 0,
    };

    if (rating === "hard") {
      currentItem.incorrectCount += 1;
      currentItem.box = 1; // Instant fallback to box 1
    } else if (rating === "so-so") {
      // Keeps same box level, or pushes moderately
      currentItem.box = Math.max(1, currentItem.box);
    } else {
      currentItem.correctCount += 1;
      currentItem.box = Math.min(currentItem.box + 1, 5); // Level upgrade
    }

    currentItem.lastTested = new Date().toISOString();
    nextSpacedRep[activeCard.item] = currentItem;

    // Save and advance index
    setSpacedRepData(nextSpacedRep);
    localStorage.setItem("corpus-spaced-repetition", JSON.stringify(nextSpacedRep));

    setIsRevealed(false);
    if (currentQueueIndex < reviewQueue.length - 1) {
      setCurrentQueueIndex((prev) => prev + 1);
    } else {
      // Loop or restart queue
      setCurrentQueueIndex(0);
    }
  };

  // Grade spelling input
  const handleCheckSpelling = (card: ReviewCard) => {
    const userInput = (spellingAnswers[card.id] || "").trim().toLowerCase();
    const correctInput = card.item.trim().toLowerCase();

    const isMatch = userInput === correctInput;
    setSpellingGraded((prev) => ({ ...prev, [card.id]: true }));

    // Update Leitner boxes based on writing orthography checks
    const nextSpacedRep = { ...spacedRepData };
    const currentItem = nextSpacedRep[card.item] || {
      id: card.id,
      item: card.item,
      type: card.type,
      box: card.box,
      correctCount: 0,
      incorrectCount: 0,
    };

    if (isMatch) {
      currentItem.correctCount += 1;
      currentItem.box = Math.min(currentItem.box + 1, 5);
    } else {
      currentItem.incorrectCount += 1;
      currentItem.box = 1;
    }

    currentItem.lastTested = new Date().toISOString();
    nextSpacedRep[card.item] = currentItem;

    setSpacedRepData(nextSpacedRep);
    localStorage.setItem("corpus-spaced-repetition", JSON.stringify(nextSpacedRep));
  };

  // Skip step helper
  const handleNextCard = () => {
    setIsRevealed(false);
    if (currentQueueIndex < reviewQueue.length - 1) {
      setCurrentQueueIndex((p) => p + 1);
    } else {
      setCurrentQueueIndex(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Intro Desk */}
      <div className="text-center space-y-2">
        <Brain className="h-10 w-10 text-emerald-500 mx-auto" />
        <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 leading-tight">
          Adaptive Review Deck
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          An interactive Leitner memory deck focusing heavily on vocabulary words and phrases currently in difficult study boxes.
        </p>
      </div>

      {/* Review Mode Toggles */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl max-w-sm mx-auto no-print gap-1">
        <button
          onClick={() => setActiveReviewMode("cards")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg cursor-pointer border border-transparent transition-all ${
            activeReviewMode === "cards"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Active Flipping Cards
        </button>
        <button
          onClick={() => setActiveReviewMode("writing")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg cursor-pointer border border-transparent transition-all ${
            activeReviewMode === "writing"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-3xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Keyboard className="h-3.5 w-3.5" />
          Spelling Orthography test
        </button>
      </div>

      {allCards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 transition-colors">
          <AlertCircle className="h-8 w-8 text-slate-350 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-150">No research elements loaded</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please submit a document text or extract list on the main tab panel first to compile active terms!
          </p>
        </div>
      ) : activeReviewMode === "cards" ? (
        /* FLIPPING CARDS VIEW */
        <div className="space-y-6">
          {/* Progress gauge header */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              Queue Card: <strong className="text-slate-900 dark:text-slate-105 font-bold font-mono">{currentQueueIndex + 1}</strong> of {reviewQueue.length}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Leitner sorted scheduler
            </span>
          </div>

          {/* Active Flashcard Box */}
          {activeCard ? (
            <div className="space-y-4">
              <div 
                onClick={() => setIsRevealed(!isRevealed)}
                className={`bg-white dark:bg-slate-900 border-2 rounded-2xl p-8 min-h-[220px] flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer text-center relative ${
                  isRevealed 
                    ? "border-emerald-200 dark:border-emerald-900 ring-2 ring-emerald-500/5" 
                    : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Back card category metadata */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <span>Box {activeCard.box} / 5</span>
                  <span>{activeCard.partOfSpeech}</span>
                </div>

                {/* Main Card Content */}
                <div className="py-6 space-y-4">
                  {!isRevealed ? (
                    <div className="space-y-2">
                      <h4 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-slate-105 tracking-tight">
                        {activeCard.item}
                      </h4>
                      <p className="text-xs text-slate-405 font-mono">
                        Click card to flip and review detailed definitions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center animate-fadeIn">
                      <h4 className="text-xl font-bold font-sans text-slate-950 dark:text-white">
                        {activeCard.item}
                      </h4>
                      
                      <div className="space-y-1.5 font-sans leading-normal">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-105">
                          {activeCard.definitionEn}
                        </p>
                      </div>

                      {/* Display academic structure context */}
                      <div className="bg-slate-50 dark:bg-slate-950 text-left p-3.5 rounded-xl border border-gray-150 dark:border-slate-850/80 max-w-md mx-auto text-xs space-y-2">
                        {activeCard.contextSentence && (
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 block">Text occurrence</span>
                            <p className="italic text-slate-700 dark:text-slate-350 leading-relaxed font-sans">
                              "{activeCard.contextSentence}"
                            </p>
                          </div>
                        )}
                        {activeCard.academicExample && (
                          <div className="border-t border-gray-200 dark:border-slate-850 pt-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Academic Output Model</span>
                            <p className="text-slate-800 dark:text-slate-205 leading-relaxed font-sans font-medium">
                              {activeCard.academicExample}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Flip control prompt indicator bottom */}
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isRevealed ? "Clicking again conceals information" : "Tap anywhere to reveal context"}
                </div>
              </div>

              {/* Leitner Box Rating Controller */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-gray-205 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-center sm:text-left transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">How well did you recall this item?</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">Rating directs standard Leitner rep-frequency schedules.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleGradeCard("hard")}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border border-red-250 bg-red-50 text-red-700 hover:bg-red-100/80 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Hard (Box 1)
                  </button>
                  <button
                    onClick={() => handleGradeCard("so-so")}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border border-amber-250 bg-amber-50 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    Muddled
                  </button>
                  <button
                    onClick={() => handleGradeCard("easy")}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Easy (+1 Box)
                  </button>
                </div>
              </div>

              {/* Fast Jump button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleNextCard}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-350 font-bold border border-gray-200 dark:border-slate-805 cursor-pointer flex items-center gap-1.5"
                >
                  Skip item
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic text-center">No cards inside active queue.</p>
          )}
        </div>
      ) : (
        /* SPELLING ORTHOGRAPHY TRAINING EXERCISE */
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-normal">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 mb-1">
              <Keyboard className="h-4.5 w-4.5" />
              Active recall writing drill
            </h4>
            Write down the accurate spelled representations for standard vocabulary elements matching definitions. Correct answers upgrade spacing intervals.
          </div>

          <div className="space-y-4">
            {allCards.slice(0, 5).map((card, idx) => {
              const uAns = spellingAnswers[card.id] || "";
              const checkState = spellingGraded[card.id] || false;
              const isCorrect = uAns.trim().toLowerCase() === card.item.trim().toLowerCase();

              return (
                <div
                  key={card.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-3 shadow-2xs transition-all ${
                    checkState
                      ? isCorrect
                        ? "border-emerald-300 dark:border-emerald-850 ring-4 ring-emerald-500/5"
                        : "border-red-300 dark:border-red-850 ring-4 ring-red-500/5"
                      : "border-gray-200 dark:border-slate-800 hover:border-gray-250"
                  }`}
                >
                  {/* Definition and Clues */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
                      Spelling Drill #{idx + 1} ({card.partOfSpeech})
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {card.definitionEn}
                    </p>
                    <p className="text-xs text-slate-500 italic max-w-xl">
                      Context: "{card.contextSentence.replace(new RegExp(card.item, "gi"), "_______")}"
                    </p>
                  </div>

                  {/* Active input field */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      disabled={checkState}
                      value={uAns}
                      onChange={(e) => setSpellingAnswers((prev) => ({ ...prev, [card.id]: e.target.value }))}
                      placeholder="Type correct spelled letters..."
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:border-slate-400"
                    />

                    {!checkState ? (
                      <button
                        onClick={() => handleCheckSpelling(card)}
                        className="px-3 py-1.5 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-850 shrink-0"
                      >
                        Check Spelled Word
                      </button>
                    ) : (
                      <span className={`px-2 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 ${
                        isCorrect ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : "bg-red-50 text-red-700 dark:bg-red-950/20"
                      }`}>
                        {isCorrect ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Correct
                          </>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5" /> Wrong
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Model answer reveal if wrong */}
                  {checkState && !isCorrect && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-400 font-mono font-bold pt-1">
                      Correct orthographic spelling: <strong className="underline decoration-wavy">{card.item}</strong>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reset spelling run button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSpellingAnswers({});
                setSpellingGraded({});
              }}
              className="px-4 py-2 border border-gray-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset spelling exercises
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

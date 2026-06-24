import React, { useState, useEffect } from "react";
import { CorpusAnalysisResult } from "../types";
import { ChevronLeft, ChevronRight, RefreshCw, AudioLines, BookMarked, CheckCircle2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface FlashcardsViewProps {
  data: CorpusAnalysisResult;
  masteredIds: Set<string>;
  setMasteredIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface CardItem {
  id: string;
  type: "word" | "phrase" | "pattern";
  title: string;
  subtitle?: string;
  definition: string;
  context: string;
  example: string;
}

export default function FlashcardsView({ data, masteredIds, setMasteredIds }: FlashcardsViewProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "learning" | "mastered">("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expansion state when changing current index or flipping card
  useEffect(() => {
    setIsExpanded(false);
  }, [currentIndex, isFlipped]);

  useEffect(() => {
    // Process results into standard card formats
    const items: CardItem[] = [];

    data.vocabulary_blocks?.forEach((v) => {
      items.push({
        id: v.id,
        type: "word",
        title: v.item,
        subtitle: v.part_of_speech,
        definition: v.definition_en,
        context: v.contextual_sentence,
        example: v.academic_example
      });
    });

    data.phrase_blocks?.forEach((p) => {
      items.push({
        id: p.id,
        type: "phrase",
        title: p.item,
        subtitle: "idiom / collocation",
        definition: p.definition_en,
        context: p.contextual_sentence,
        example: p.academic_example
      });
    });

    data.sentence_patterns?.forEach((s) => {
      items.push({
        id: s.id,
        type: "pattern",
        title: s.pattern_structure,
        subtitle: s.functional_purpose,
        definition: `Grammar Pattern suitable for ${data.meta_data.target_level}`,
        context: s.contextual_sentence,
        example: s.academic_example
      });
    });

    setCards(items);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [data]);

  const filteredCards = cards.filter((item) => {
    if (filterMode === "learning") return !masteredIds.has(item.id);
    if (filterMode === "mastered") return masteredIds.has(item.id);
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMastered = new Set(masteredIds);
    if (nextMastered.has(id)) {
      nextMastered.delete(id);
    } else {
      nextMastered.add(id);
    }
    setMasteredIds(nextMastered);
  };

  const handleSpeak = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Reset mastered state
  const handleResetCards = () => {
    setMasteredIds(new Set());
    setFilterMode("all");
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Analyze space content to activate interactive study cards!
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">
          Active Recall Learner Deck
        </h3>
        <p className="text-xs text-gray-500">
          Reinforce extracted terms and collocations using randomized, self-testing cards.
        </p>
      </div>

      {/* Filter Mode & Mastered Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-gray-150">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setFilterMode("all"); setCurrentIndex(0); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterMode === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            All ({cards.length})
          </button>
          <button
            onClick={() => { setFilterMode("learning"); setCurrentIndex(0); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterMode === "learning" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Reviewing ({cards.length - masteredIds.size})
          </button>
          <button
            onClick={() => { setFilterMode("mastered"); setCurrentIndex(0); }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              filterMode === "mastered" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Mastered ({masteredIds.size})
          </button>
        </div>

        <button
          onClick={handleResetCards}
          className="p-1 px-2 text-[11px] hover:bg-white hover:shadow-xs border border-transparent hover:border-gray-200 rounded-lg flex items-center gap-1 transition-all text-gray-500 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Reset progress
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 text-center py-16 px-6 space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-gray-950">Deck complete!</h4>
          <p className="text-xs text-gray-500">
            You've marked all items in this segment as mastered. Reset or adjust your filters above.
          </p>
          <button
            onClick={() => { setFilterMode("all"); setCurrentIndex(0); }}
            className="text-xs text-emerald-600 font-semibold underline decoration-2 underline-offset-2 cursor-pointer"
          >
            View all cards
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-[400px] sm:h-[360px] w-full perspective-1000 cursor-pointer text-left relative focus:outline-hidden group"
          >
            <div
              className={`relative h-full w-full duration-500 transform-style-3d ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Card FRONT */}
              <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded leading-none ${
                        currentCard.type === "word"
                          ? "bg-emerald-50 text-emerald-700"
                          : currentCard.type === "phrase"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {currentCard.type}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleSpeak(currentCard.title, e)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-slate-500"
                        title="Listen to pronunciation"
                      >
                        <AudioLines className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleToggleMastered(currentCard.id, e)}
                        className={`p-1 px-1.5 text-[10px] font-semibold flex items-center gap-1 rounded border transition-all ${
                          masteredIds.has(currentCard.id)
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-gray-500 hover:text-emerald-700 border-gray-200"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {masteredIds.has(currentCard.id) ? "Mastered" : "Learn"}
                      </button>
                    </div>
                  </div>

                  <p className="font-mono text-[10px] text-gray-400 mt-2 font-semibold">
                    {currentCard.subtitle}
                  </p>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1 line-clamp-3 leading-snug">
                    {currentCard.title}
                  </h3>
                </div>

                <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Context: {currentCard.type === "pattern" ? "Syntactic Model" : "Extracted Passage Segment"}</span>
                  <span className="text-indigo-600 font-bold tracking-wider group-hover:underline">Click to Reveal Definition →</span>
                </div>
              </div>

              {/* Card BACK */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 text-white border border-slate-900 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                <div className="space-y-3 overflow-hidden flex flex-col h-[78%]">
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-gray-400">
                      Meaning / Translation
                    </span>
                    <button
                      onClick={(e) => handleSpeak(currentCard.definition + ". Example sentence: " + currentCard.example, e)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-750 text-gray-300 rounded-full transition-all"
                    >
                      <AudioLines className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <h4 className="text-xs sm:text-sm text-gray-100 font-medium leading-relaxed font-sans pb-1">
                      {currentCard.definition}
                    </h4>

                    {/* Expand Button to reduce density initially */}
                    <div className="pt-1 select-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(!isExpanded);
                        }}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-755 text-emerald-400 hover:text-emerald-300 text-[10px] sm:text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700/80 shadow-xs"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            Hide Context Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            Expand Context Details
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expandable details */}
                    {isExpanded ? (
                      <div className="space-y-3 pt-3 border-t border-slate-800/80 animate-fadeIn duration-200">
                        {/* Context Quote */}
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-widest">In Context</span>
                          <p className="text-[11px] sm:text-xs text-gray-300 italic font-serif leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                            "{currentCard.context}"
                          </p>
                        </div>

                        {/* Writer Example */}
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-widest">Writer Example</span>
                          <p className="text-[11px] sm:text-xs text-emerald-300 font-medium leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                            {currentCard.example}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-500 font-mono italic text-center pt-2">
                        💡 Click expand to view custom context and sample sentences
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 text-xs text-gray-500 font-mono flex justify-between shrink-0">
                  <span>Double-sided model card</span>
                  <span className="text-gray-400">Click to flip front</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Controllers */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Card <strong className="text-slate-800">{currentIndex + 1}</strong> of <strong className="text-slate-800">{filteredCards.length}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 border border-gray-200 hover:bg-slate-50 rounded-xl disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={handleShuffle}
                className="px-3.5 py-2 border border-gray-200 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-all cursor-pointer"
                title="Shuffle card orders"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Shuffle
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredCards.length - 1}
                className="p-2 border border-gray-200 hover:bg-slate-50 rounded-xl disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

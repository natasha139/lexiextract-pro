import React, { useState } from "react";
import { CorpusAnalysisResult } from "./types";
import { API_BASE } from "./config";
import { ACADEMIC_SAMPLES } from "./data/samples";
import TextAnalysisForm from "./components/TextAnalysisForm";
import AnalysisResults from "./components/AnalysisResults";
import FlashcardsView from "./components/FlashcardsView";
import QuizView from "./components/QuizView";
import WorksheetExport from "./components/WorksheetExport";
import MasteryTracker from "./components/MasteryTracker";
import WordBankView from "./components/WordBankView";
import SmartReviewView from "./components/SmartReviewView";
import WritingPracticeView from "./components/WritingPracticeView";
import AIRewriterView from "./components/AIRewriterView";
import { GraduationCap, FileInput, Languages, BookCheck, ClipboardList, BookOpen, AlertCircle, Sparkles, TrendingUp, Sun, Moon, Brain, BookMarked, PenTool, Layout } from "lucide-react";
import { useTheme } from "./components/ThemeProvider";

// Preloaded beautiful dataset so that the app works instantly on load,
// conforming perfectly to the user's requested GRE-adapted schema!
const INITIAL_DEMO_DATA: CorpusAnalysisResult = {
  meta_data: {
    title: "The Epistemological Shift in Synthetic Biology",
    source: "Journal of Bio-Ethical Inquiry (2025)",
    category: "Scientific Philosophy",
    target_level: "GRE"
  },
  vocabulary_blocks: [
    {
      id: "v1",
      type: "word",
      item: "epistemological",
      part_of_speech: "adjective",
      definition_en: "Relating to the theory of knowledge, especially with regard to its methods, validity, and scope, and the distinction between justified belief and opinion.",
      contextual_sentence: "However, the advent of synthetic biology represents an profound epistemological shift, transitioning the field from passive observation to active construction.",
      academic_example: "Establishing a novel scientific paradigm requires researchers to address fundamental epistemological questions regarding empirical validation."
    },
    {
      id: "v2",
      type: "word",
      item: "profound",
      part_of_speech: "adjective",
      definition_en: "Very great, intense, or philosophically deep; having or showing great knowledge, impact, or insight.",
      contextual_sentence: "However, the advent of synthetic biology represents an profound epistemological shift, transitioning the field from passive observation to active construction.",
      academic_example: "The introduction of molecular mechanics had a profound effect on academic understandings of physical kinetics."
    },
    {
      id: "v3",
      type: "word",
      item: "inherent",
      part_of_speech: "adjective",
      definition_en: "Existing in something as a permanent, essential, or characteristic attribute.",
      contextual_sentence: "Indeed, to bear in mind the potential of run-away self-replication is to acknowledge the severe existential risks inherent in bio-foundry automation.",
      academic_example: "Biochemical systems must continuously reduce the experimental margins of error inherent in non-isolated cells."
    }
  ],
  phrase_blocks: [
    {
      id: "p1",
      type: "phrase_collocation_idiom",
      item: "take for granted",
      definition_en: "To fail to properly appreciate or evaluate something, or to assume something is true without empirical confirmation.",
      contextual_sentence: "Critics argue that we should not take for granted the intricate self-regulating mechanisms of natural ecosystems, which have evolved over millennia.",
      academic_example: "We must not take for granted the chemical stability of inert reagents when conducting multi-variable synthetic trials."
    },
    {
      id: "p2",
      type: "phrase_collocation_idiom",
      item: "bear in mind",
      definition_en: "To remember, keep in consideration, or remain cognizant of key factors when formulating logical arguments or assessments.",
      contextual_sentence: "Indeed, to bear in mind the potential of run-away self-replication is to acknowledge the severe existential risks inherent in bio-foundry automation.",
      academic_example: "When compiling qualitative field surveys, sociologists must bear in mind the subtle impact of systemic observation bias."
    },
    {
      id: "p3",
      type: "phrase_collocation_idiom",
      item: "provide an advantage for",
      definition_en: "To establish a distinct positive opportunity, leverage, or functional superiority targeting a research line or cohort.",
      contextual_sentence: "It is this capacity for structural disruption that provides an unprecedented advantage for research, while simultaneously demanding robust regulatory oversight.",
      academic_example: "Integrating distributed computing grids provides an immense advantage for heavy bio-informatic metadata sweeps."
    }
  ],
  sentence_patterns: [
    {
      id: "s1",
      type: "pattern",
      pattern_structure: "It has been speculated that + Clause",
      functional_purpose: "Hypothesizing future causal consequences or occurrence with objective academic distance",
      contextual_sentence: "It has been speculated that unregulated distribution of CRISPR gene-drive protocols might trigger irreversible alterations in native phenotypes.",
      academic_example: "It has been speculated that sustained ocean acidification will catalyze the rapid degradation of deep marine skeletal habitats."
    },
    {
      id: "s2",
      type: "pattern",
      pattern_structure: "To bear in mind [X] is to acknowledge [Y]",
      functional_purpose: "Establishing a logical equivalence or causal realization between an input and its consequence",
      contextual_sentence: "Indeed, to bear in mind the potential of run-away self-replication is to acknowledge the severe existential risks inherent in bio-foundry automation.",
      academic_example: "To bear in mind the velocity of artificial neural research is to acknowledge the near-term obsolescence of static testing benchmarks."
    }
  ]
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [corpusData, setCorpusData] = useState<CorpusAnalysisResult>(INITIAL_DEMO_DATA);
  const [rawText, setRawText] = useState<string>(ACADEMIC_SAMPLES[0].text);
  const [activeTab, setActiveTab] = useState<"input" | "analysis" | "flashcards" | "tracker" | "quiz" | "export" | "review" | "wordbank" | "writing" | "rewrite">("analysis");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  const handleToggleMastered = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAnalyzeText = async (formData: {
    text: string;
    targetLevel: string;
    title: string;
    source: string;
    category: string;
    density: "low" | "standard" | "high";
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to analyze your text sample.");
      }

      const analyzedPayload: CorpusAnalysisResult = await response.json();
      setCorpusData(analyzedPayload);
      setRawText(formData.text);
      setActiveTab("analysis");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred while querying the corpus engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCorpusData = (updated: CorpusAnalysisResult) => {
    setCorpusData(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* App Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-2 rounded-xl shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-display font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Academic English Corpus Analyzer
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium font-sans uppercase tracking-wider mt-1">
                  Corpus-Linguistic Exam & Curriculum Design Panel
                </p>
              </div>
            </div>

            {/* Quick Status and Theme Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-mono">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Target Level:</span>
                <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/60">
                  {corpusData.meta_data.target_level}
                </span>
              </div>

              {/* Theme Toggle Button */}
              <button
                id="theme-toggle-button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 font-bold text-xs cursor-pointer shadow-3xs transition-all duration-150"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500 animate-spin-slow" />
                    <span className="hidden sm:inline">Light Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 dark:border-slate-800 pb-4 no-print">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "input"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <FileInput className="h-3.5 w-3.5" />
            Analyze Passage
          </button>

          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "analysis"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Extracted Items
          </button>

          <button
            onClick={() => setActiveTab("flashcards")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "flashcards"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            Active Recall Cards
          </button>

          <button
            onClick={() => setActiveTab("tracker")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "tracker"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Mastery Tracker
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "quiz"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <BookCheck className="h-3.5 w-3.5" />
            Assessment Prep Quiz
          </button>

          <button
            onClick={() => setActiveTab("writing")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "writing"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            Practice Writing / 写作练习
          </button>

          <button
            onClick={() => setActiveTab("rewrite")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "rewrite"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            AI Essay Reconstruct / AI重构
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "review"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            Smart Review / 智能复习
          </button>

          <button
            onClick={() => setActiveTab("wordbank")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "wordbank"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" />
            Wordbank / 备考词库
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
              activeTab === "export"
                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-105 dark:text-slate-950 shadow-xs"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Worksheet & JSON Export
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 text-xs text-red-700 max-w-xl mx-auto no-print">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Extraction Command Failed</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Dynamic Workspace */}
        <div className="space-y-6">
          {activeTab === "input" && (
            <div className="space-y-6">
              <TextAnalysisForm onSubmit={handleAnalyzeText} isLoading={isLoading} />
              
              {/* Educational info card displayed under simple instructions */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 items-start shadow-md">
                <Sparkles className="h-8 w-8 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">Linguistic Extraction Process</h4>
                  <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                    Our platform automatically connects to high-performance parsing agents using advanced large language models. The engine maps standard English frequency curves, extracts core vocabulary adapted directly for high-stakes tests, parses idiomatic configurations, and identifies elegant, reusable structural templates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <AnalysisResults data={corpusData} onUpdate={handleUpdateCorpusData} />
          )}

          {activeTab === "flashcards" && (
            <FlashcardsView data={corpusData} masteredIds={masteredIds} setMasteredIds={setMasteredIds} />
          )}

          {activeTab === "tracker" && (
            <MasteryTracker data={corpusData} masteredIds={masteredIds} onToggleMastered={handleToggleMastered} />
          )}

          {activeTab === "quiz" && (
            <QuizView corpusData={corpusData} />
          )}

          {activeTab === "review" && (
            <SmartReviewView data={corpusData} />
          )}

          {activeTab === "wordbank" && (
            <WordBankView data={corpusData} masteredIds={masteredIds} onToggleMastered={handleToggleMastered} rawText={rawText} />
          )}

          {activeTab === "writing" && (
            <WritingPracticeView data={corpusData} />
          )}

          {activeTab === "rewrite" && (
            <AIRewriterView data={corpusData} />
          )}

          {activeTab === "export" && (
            <WorksheetExport data={corpusData} />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-slate-400 font-mono no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p>Academic English Corpus Analyzer — Devoted to linguistic rigor and assessment excellence.</p>
        </div>
      </footer>
    </div>
  );
}

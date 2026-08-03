import React, { useState, useEffect } from "react";
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
import ManualEntryForm, { MANUAL_FORM_INITIAL, ManualFormState } from "./components/ManualEntryForm";
import { GraduationCap, FileInput, Languages, BookCheck, ClipboardList, BookOpen, AlertCircle, Sparkles, TrendingUp, Sun, Moon, Brain, BookMarked, PenTool, Layout, History, Trash2, PenLine } from "lucide-react";
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
  const [history, setHistory] = useState<{ id: string; title: string; source: string; target_level: string; created_at: number }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inputMode, setInputMode] = useState<"ai" | "manual">("ai");
  const [manualFormState, setManualFormState] = useState<ManualFormState>(MANUAL_FORM_INITIAL);

  useEffect(() => {
    fetch(`${API_BASE}/api/corpus`)
      .then(r => r.ok ? r.json() : [])
      .then(rows => setHistory(rows))
      .catch(() => {});
  }, []);

  const saveToD1 = async (data: CorpusAnalysisResult, id: string) => {
    try {
      await fetch(`${API_BASE}/api/corpus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data }),
      });
      const rows = await fetch(`${API_BASE}/api/corpus`).then(r => r.json());
      setHistory(rows);
    } catch {}
  };

  const loadFromHistory = async (id: string) => {
    try {
      const r = await fetch(`${API_BASE}/api/corpus/${id}`);
      if (!r.ok) return;
      const data: CorpusAnalysisResult = await r.json();
      setCorpusData(data);
      setShowHistory(false);
      if (data.meta_data?.entry_mode === "manual") {
        setInputMode("manual");
        setManualFormState({
          title: data.meta_data.title || "",
          source: data.meta_data.source || "",
          targetLevel: data.meta_data.target_level || "IELTS",
          category: data.meta_data.category || "",
          passage: data.meta_data.passage || "",
          items: [
            ...data.vocabulary_blocks.map(v => ({ id: v.id, type: "word" as const, text: v.item, cefr: null, contextual_sentence: v.contextual_sentence })),
            ...data.phrase_blocks.map(p => ({ id: p.id, type: "phrase" as const, text: p.item, cefr: null, contextual_sentence: p.contextual_sentence })),
            ...data.sentence_patterns.map(s => ({ id: s.id, type: "pattern" as const, text: s.pattern_structure, cefr: null, contextual_sentence: s.contextual_sentence })),
          ],
        });
        setActiveTab("input");
      } else {
        setActiveTab("analysis");
      }
    } catch {}
  };

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${API_BASE}/api/corpus/${id}`, { method: "DELETE" });
    setHistory(prev => prev.filter(h => h.id !== id));
  };

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
      const runId = `run_${Date.now()}`;
      setCorpusData(analyzedPayload);
      setRawText(formData.text);
      setActiveTab("analysis");
      saveToD1(analyzedPayload, runId);
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

  type TabId = "input" | "analysis" | "flashcards" | "tracker" | "quiz" | "writing" | "rewrite" | "review" | "wordbank" | "export";

  const NAV_ITEMS: { id: TabId; icon: React.ReactNode; label: string; sublabel?: string }[] = [
    { id: "input",     icon: <FileInput className="h-4 w-4" />,     label: "Analyze",      sublabel: "New passage" },
    { id: "analysis",  icon: <BookOpen className="h-4 w-4" />,      label: "Extracted",    sublabel: "Words & patterns" },
    { id: "flashcards",icon: <Languages className="h-4 w-4" />,     label: "Flashcards",   sublabel: "Active recall" },
    { id: "tracker",   icon: <TrendingUp className="h-4 w-4" />,    label: "Mastery",      sublabel: "Progress" },
    { id: "quiz",      icon: <BookCheck className="h-4 w-4" />,     label: "Quiz",         sublabel: "Practice test" },
    { id: "writing",   icon: <PenTool className="h-4 w-4" />,       label: "Writing",      sublabel: "写作练习" },
    { id: "rewrite",   icon: <Sparkles className="h-4 w-4" />,      label: "Reconstruct",  sublabel: "AI重构" },
    { id: "review",    icon: <Brain className="h-4 w-4" />,         label: "Review",       sublabel: "智能复习" },
    { id: "wordbank",  icon: <BookMarked className="h-4 w-4" />,    label: "Wordbank",     sublabel: "备考词库" },
    { id: "export",    icon: <ClipboardList className="h-4 w-4" />, label: "Export",       sublabel: "Worksheet" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F2EB", color: "#0F0F0E" }}>

      {/* ── Top bar ── */}
      <header className="no-print sticky top-0 z-40 border-b" style={{ backgroundColor: "#F5F2EB", borderColor: "#E0DBD1" }}>
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: "#1C4ED8" }}>
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-semibold text-sm tracking-tight" style={{ color: "#0F0F0E" }}>
              LexiExtract
            </span>
            <span className="hidden sm:inline text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "#EFF3FD", color: "#1C4ED8" }}>
              {corpusData.meta_data.target_level}
            </span>
          </div>
          <div className="flex items-center gap-2 relative">
            {/* History button */}
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border cursor-pointer transition-colors"
              style={{ borderColor: showHistory ? "#1C4ED8" : "#E0DBD1", color: showHistory ? "#1C4ED8" : "#64748B", backgroundColor: showHistory ? "#EFF3FD" : "transparent" }}
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">历史 ({history.length})</span>
            </button>

            {/* History dropdown */}
            {showHistory && (
              <div className="absolute right-0 top-10 w-80 bg-white border rounded-xl shadow-xl z-50 overflow-hidden" style={{ borderColor: "#E0DBD1" }}>
                <div className="px-4 py-2.5 border-b text-xs font-semibold text-slate-500 flex items-center justify-between" style={{ borderColor: "#E0DBD1" }}>
                  <span>分析历史</span>
                  <span className="text-[10px] text-slate-400">点击加载 · 刷新不丢失</span>
                </div>
                {history.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400">暂无历史记录</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: "#f1f5f9" }}>
                    {history.map(h => (
                      <div key={h.id} onClick={() => loadFromHistory(h.id)}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 group">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{h.title || "Untitled"}</p>
                          <p className="text-[10px] text-slate-400 truncate">{h.target_level} · {new Date(h.created_at).toLocaleDateString('zh-CN')}</p>
                        </div>
                        <button onClick={(e) => deleteFromHistory(h.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all cursor-pointer shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border cursor-pointer transition-colors"
              style={{ borderColor: "#E0DBD1", color: "#64748B" }}
            >
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
            </button>
          </div>
        </div>

        {/* Project links strip */}
        <div className="no-print border-t flex items-center gap-1.5 flex-wrap px-5 py-1.5" style={{ borderColor: "#E0DBD1" }}>
          <span className="text-[9px] font-bold font-mono mr-1 tracking-wider" style={{ color: "#94A3B8" }}>PROJECTS</span>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border" style={{ backgroundColor: "#EFF3FD", color: "#1C4ED8", borderColor: "#bfdbfe" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1C4ED8", display: "inline-block" }} />LexiExtract
          </span>
          {[
            { id: 'input-pipeline', label: 'Input Pipeline', url: 'https://input-pipeline.pages.dev', dot: '#60a5fa' },
            { id: 'writing-archive', label: 'Writing Archive', url: 'https://natasha-ielts-library.pages.dev', dot: '#34d399' },
            { id: 'encounter', label: 'Encounter', url: 'https://encounter-app.pages.dev', dot: '#a78bfa' },
            { id: 'techo', label: 'Techo App', url: 'https://techo-app.pages.dev', dot: '#f59e0b' },
            { id: 'phd', label: 'PhD Toolkit', url: 'https://phd-app-toolkit.pages.dev', dot: '#fb7185' },
            { id: 'fillinblanks', label: 'Fill-in-Blanks', url: 'https://fill-in-blanks.pages.dev', dot: '#4f46e5' },
          ].map(p => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-colors hover:opacity-80"
              style={{ backgroundColor: "#F5F2EB", color: "#64748B", borderColor: "#E0DBD1" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.dot, display: "inline-block" }} />{p.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {/* Sidebar nav — hidden on mobile, shown on md+ */}
        <aside className="no-print hidden md:flex flex-col w-52 shrink-0 border-r py-6 px-3 gap-0.5" style={{ borderColor: "#E0DBD1" }}>
          {NAV_ITEMS.map(({ id, icon, label, sublabel }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-all cursor-pointer group"
                style={active
                  ? { backgroundColor: "#EFF3FD", color: "#1C4ED8" }
                  : { color: "#64748B" }
                }
              >
                <span style={active ? { color: "#1C4ED8" } : { color: "#94A3B8" }}>{icon}</span>
                <span className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold leading-tight">{label}</span>
                  {sublabel && <span className="text-[10px] leading-tight opacity-60 truncate">{sublabel}</span>}
                </span>
                {active && <span className="ml-auto w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: "#1C4ED8" }} />}
              </button>
            );
          })}
        </aside>

        {/* Mobile nav — horizontal scroll strip */}
        <div className="no-print md:hidden w-full border-b overflow-x-auto flex gap-1 px-3 py-2" style={{ borderColor: "#E0DBD1" }}>
          {NAV_ITEMS.map(({ id, icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all"
                style={active
                  ? { backgroundColor: "#EFF3FD", color: "#1C4ED8" }
                  : { color: "#64748B" }
                }
              >
                {icon}{label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-5 sm:p-7 space-y-5">

          {error && (
            <div className="flex gap-3 p-4 rounded-lg border text-sm no-print" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Extraction failed</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {activeTab === "input" && (
            <div className="space-y-5">
              {/* Mode toggle */}
              <div className="flex gap-2 p-1 rounded-lg w-fit" style={{ backgroundColor: "#E0DBD1" }}>
                <button type="button" onClick={() => setInputMode("ai")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer"
                  style={inputMode === "ai" ? { backgroundColor: "#ffffff", color: "#1C4ED8", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#64748B" }}>
                  <Sparkles className="h-3.5 w-3.5" /> AI 提取
                </button>
                <button type="button" onClick={() => setInputMode("manual")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer"
                  style={inputMode === "manual" ? { backgroundColor: "#ffffff", color: "#1C4ED8", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#64748B" }}>
                  <PenLine className="h-3.5 w-3.5" /> 手动录入
                </button>
              </div>

              {inputMode === "ai" ? (
                <>
                  <TextAnalysisForm onSubmit={handleAnalyzeText} isLoading={isLoading} />
                  <div className="flex gap-4 p-5 rounded-xl border" style={{ backgroundColor: "#0F0F0E", borderColor: "#1e1e1e" }}>
                    <Layout className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#1C4ED8" }} />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">How extraction works</p>
                      <p className="text-xs leading-relaxed" style={{ color: "#94A3B8" }}>
                        Paste any academic passage. The engine maps vocabulary against your target exam level, identifies high-value collocations and idioms, and surfaces reusable sentence structures — ready for flashcards, quizzes, and writing practice.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <ManualEntryForm
                  state={manualFormState}
                  onChange={setManualFormState}
                  onSubmit={(data) => {
                  setCorpusData(data);
                  setActiveTab("analysis");
                  const runId = `run_${Date.now()}`;
                  saveToD1(data, runId);
                }} />
              )}
            </div>
          )}

          {activeTab === "analysis"   && <AnalysisResults data={corpusData} onUpdate={handleUpdateCorpusData} />}
          {activeTab === "flashcards" && <FlashcardsView data={corpusData} masteredIds={masteredIds} setMasteredIds={setMasteredIds} />}
          {activeTab === "tracker"    && <MasteryTracker data={corpusData} masteredIds={masteredIds} onToggleMastered={handleToggleMastered} />}
          {activeTab === "quiz"       && <QuizView corpusData={corpusData} />}
          {activeTab === "review"     && <SmartReviewView data={corpusData} />}
          {activeTab === "wordbank"   && <WordBankView data={corpusData} masteredIds={masteredIds} onToggleMastered={handleToggleMastered} rawText={rawText} />}
          {activeTab === "writing"    && <WritingPracticeView data={corpusData} />}
          {activeTab === "rewrite"    && <AIRewriterView data={corpusData} />}
          {activeTab === "export"     && <WorksheetExport data={corpusData} />}

        </main>
      </div>
    </div>
  );
}

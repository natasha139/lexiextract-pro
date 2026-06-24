import React, { useState } from "react";
import { CorpusAnalysisResult } from "../types";
import { API_BASE } from "../config";
import {
  Sparkles,
  Send,
  CheckCircle2,
  HelpCircle, 
  RefreshCw, 
  PenTool, 
  AlertCircle, 
  BookOpen, 
  Award,
  ChevronRight,
  TrendingUp,
  Layout,
  Layers,
  Copy,
  Check,
  CheckSquare,
  Square,
  FileText,
  BadgeAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ItemUsedChecklist {
  item: string;
  sentence_where_used: string;
  usage_analysis_zh: string;
}

interface BodyParagraph {
  text: string;
  para_type: string;
  analysis_zh: string;
}

interface ArticleRewriteResponse {
  headline: string;
  introduction: {
    text: string;
    analysis_zh: string;
  };
  body_paragraphs: BodyParagraph[];
  conclusion: {
    text: string;
    analysis_zh: string;
  };
  items_used_checklist: ItemUsedChecklist[];
  stylistic_economist_analysis_zh: string;
}

interface AIRewriterViewProps {
  data: CorpusAnalysisResult;
}

export default function AIRewriterView({ data }: AIRewriterViewProps) {
  const [topic, setTopic] = useState("");
  const [bandScore, setBandScore] = useState<"6.0" | "7.0" | "8.0" | "9.0">("8.0");
  const [selectedVocab, setSelectedVocab] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    data.vocabulary_blocks?.slice(0, 3).forEach((v) => initial.add(v.item));
    return initial;
  });
  const [selectedPhrases, setSelectedPhrases] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    data.phrase_blocks?.slice(0, 2).forEach((p) => initial.add(p.item));
    return initial;
  });
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    data.sentence_patterns?.slice(0, 1).forEach((s) => initial.add(s.pattern_structure));
    return initial;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleRewriteResponse | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Suggested Topics for convenience
  const topicSuggestions = [
    { text: "Environmental Protection & Greentech Subsidies", category: "Technology & Environment" },
    { text: "Cultural Homogenization in the Digital Age", category: "Sociology & Culture" },
    { text: "The Economics of Artificial Intelligence Productivity", category: "Economics & Science" },
    { text: "Academic Credential Inflation and the Gig Economy", category: "Education & Business" }
  ];

  // Toggle selection helpers
  const toggleVocab = (item: string) => {
    setSelectedVocab((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const togglePhrase = (item: string) => {
    setSelectedPhrases((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const togglePattern = (item: string) => {
    setSelectedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const handleSelectAll = () => {
    const newVocab = new Set<string>();
    data.vocabulary_blocks?.forEach((v) => newVocab.add(v.item));
    setSelectedVocab(newVocab);

    const newPhrases = new Set<string>();
    data.phrase_blocks?.forEach((p) => newPhrases.add(p.item));
    setSelectedPhrases(newPhrases);

    const newPatterns = new Set<string>();
    data.sentence_patterns?.forEach((s) => newPatterns.add(s.pattern_structure));
    setSelectedPatterns(newPatterns);
  };

  const handleDeselectAll = () => {
    setSelectedVocab(new Set());
    setSelectedPhrases(new Set());
    setSelectedPatterns(new Set());
  };

  const currentSelectionCount = selectedVocab.size + selectedPhrases.size + selectedPatterns.size;

  const handleCopyText = async (text: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleConstructArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please input a Custom Topic or select one of the suggestions.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setArticle(null);

    try {
      const response = await fetch(`${API_BASE}/api/article-rewrite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic,
          bandScore,
          selectedVocabulary: Array.from(selectedVocab),
          selectedPhrases: Array.from(selectedPhrases),
          selectedPatterns: Array.from(selectedPatterns)
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to reconstruct article with AI.");
      }

      const articlePayload: ArticleRewriteResponse = await response.json();
      setArticle(articlePayload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during AI article reconstruction.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFullCompiledText = () => {
    if (!article) return "";
    let full = `TITLE: ${article.headline}\n\n`;
    full += `INTRODUCTION:\n${article.introduction.text}\n\n`;
    article.body_paragraphs.forEach((p, idx) => {
      full += `BODY PARAGRAPH ${idx + 1} (${p.para_type}):\n${p.text}\n\n`;
    });
    full += `CONCLUSION:\n${article.conclusion.text}\n`;
    return full;
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl text-indigo-700 dark:text-indigo-400">
            <Layers className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>AI Essay Reconstruction</span>
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-sans font-extrabold uppercase tracking-wide border border-amber-200/55 dark:border-amber-900/40">
                The Economist Style
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">
              Transform target lexemes, collocations, and grammatical frameworks into high-scoring argumentative essays mimicking the analytical rigor of British journalism.
            </p>
          </div>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30 text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
          <p className="font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> 学习与备考设计逻辑
          </p>
          此模块允许你主动选择想要刻意练习（Deliberate Practice）的高级词汇、固定搭配或重点句型。你可以自定义输入写作主题（如环保、文化、AI等）以及目标雅思写作分数（Band 6.0 - 9.0）。
          系统将调用大语言模型，并模拟英国《经济学人》（The Economist）标志性的论证分析手段（让步转折论证、数据/逻辑推导论证、典型举例等）进行深度重构，解构其底层写作脉络。
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel Column */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleConstructArticle} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
            {/* Topic Input Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                1. Custom Argumentative Topic (输入文章讨论话题)
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Environmental protection and carbon taxes vs GDP growth"
                className="w-full h-24 p-3 rounded-lg text-xs font-medium border border-gray-200 focus:border-slate-900 focus:outline-hidden dark:bg-slate-950 dark:border-slate-800 dark:focus:border-slate-100 transition-colors placeholder:text-gray-400 shadow-3xs leading-relaxed"
                required
              />

              {/* Suggestions quick tags */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-gray-400 block font-bold">Suggested Academic Templates:</span>
                <div className="flex flex-col gap-1.5">
                  {topicSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(item.text)}
                      className="text-left text-[10.5px] p-2 bg-slate-55/60 dark:bg-slate-805/40 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/60 transition-all font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-1 justify-between shrink-0"
                    >
                      <span className="line-clamp-1">{item.text}</span>
                      <span className="text-[8.5px] uppercase font-bold text-indigo-500 shrink-0 font-mono tracking-tighter">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target IELTS Band Group */}
            <div className="space-y-2 border-t border-gray-100 dark:border-slate-850 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Targeted English Register (目标分数水平)
                </label>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono">
                  <Award className="h-3.5 w-3.5" /> IELTS Equivalent
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["6.0", "7.0", "8.0", "9.0"] as const).map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setBandScore(score)}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                      bandScore === score
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950 font-black shadow-3xs"
                        : "bg-slate-55/45 hover:bg-slate-100/80 border-gray-150 text-slate-600 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400"
                    }`}
                  >
                    Band {score}
                  </button>
                ))}
              </div>
            </div>

            {/* Items compliance checkboxes */}
            <div className="space-y-3.5 border-t border-gray-100 dark:border-slate-850 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. Select Items to Blend (选择需要融入的考点/词型)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[9.5px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    All
                  </button>
                  <span className="text-[9.5px] text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[9.5px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    None
                  </button>
                </div>
              </div>

              {/* Advanced Items Accordion Layout */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {/* 1. Academic Vocabulary */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-mono">
                    Vocabulary Words (学术词汇)
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {data.vocabulary_blocks?.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVocab(v.item)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedVocab.has(v.item)
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-800 dark:border-slate-700"
                            : "bg-slate-50/50 hover:bg-slate-100 border-gray-150 text-slate-700 dark:bg-slate-950/40 dark:border-slate-850 dark:text-slate-350"
                        }`}
                      >
                        {selectedVocab.has(v.item) ? (
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        )}
                        <span className="text-[10.5px] font-bold truncate">
                          {v.item} <span className="text-[9px] font-normal italic opacity-70">({v.part_of_speech})</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Advanced Phrases */}
                <div className="space-y-1.5 pt-1.5 border-t border-gray-105 dark:border-slate-850/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 font-mono">
                    Academic Collocations / Phrases (核心短语固定搭配)
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {data.phrase_blocks?.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePhrase(p.item)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedPhrases.has(p.item)
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-800 dark:border-slate-700"
                            : "bg-slate-50/50 hover:bg-slate-100 border-gray-150 text-slate-700 dark:bg-slate-950/40 dark:border-slate-850 dark:text-slate-350"
                        }`}
                      >
                        {selectedPhrases.has(p.item) ? (
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        )}
                        <span className="text-[10.5px] font-bold truncate">
                          {p.item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Academic sentence patterns */}
                <div className="space-y-1.5 pt-1.5 border-t border-gray-105 dark:border-slate-850/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 font-mono">
                    Complex Sentence Structures (高级经典句式)
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {data.sentence_patterns?.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => togglePattern(s.pattern_structure)}
                        className={`flex items-start gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedPatterns.has(s.pattern_structure)
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-800 dark:border-slate-700"
                            : "bg-slate-50/50 hover:bg-slate-100 border-gray-150 text-slate-700 dark:bg-slate-950/40 dark:border-slate-850 dark:text-slate-350"
                        }`}
                      >
                        {selectedPatterns.has(s.pattern_structure) ? (
                          <CheckSquare className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <span className="text-[10px] font-mono leading-normal font-semibold">
                          {s.pattern_structure}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reconstruct Trigger Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !topic.trim() || currentSelectionCount === 0}
                className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-xl hover:bg-slate-800 dark:hover:bg-white text-xs font-bold font-sans tracking-tight transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Reconstructing Article Components...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Generate & Deconstruct Article (重构论文/段落)</span>
                  </>
                )}
              </button>
              {currentSelectionCount === 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                  <BadgeAlert className="h-3 w-3" /> Select at least 1 item above to embed.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Right Output Dashboard Column */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading-rewriter"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center min-h-[480px] space-y-6 text-center"
              >
                {/* Visual pulse keyframes */}
                <div className="relative">
                  <div className="h-20 w-20 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center animate-ping absolute top-0 left-0 opacity-40"></div>
                  <div className="h-20 w-20 bg-indigo-55 dark:bg-indigo-900/50 rounded-full flex items-center justify-center relative border border-indigo-200">
                    <FileText className="h-9 w-9 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Drafting Economist Editorial & IELTS Model Essay
                  </h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 max-w-sm leading-relaxed font-semibold">
                    The core AI model is parsing semantic relations, weaving your target lexical tokens, and modeling advanced rhetorical structures.
                  </p>
                </div>

                {/* Staggered progress logs indicating structural steps */}
                <div className="space-y-2 w-full max-w-xs text-[10.5px] font-bold text-slate-450 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Modeling Economist style column templates (IELTS Band {bandScore})
                  </div>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <CheckCircle2 className="h-3.5 w-3.5 animate-pulse" /> Formatting introduction hook and thesis mapping...
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5" /> Synthesizing body paragraphs with Concession vs Refutation...
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5" /> Checking token occurrence checklist...
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="rewriter-error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/60 p-6 rounded-2xl space-y-4 shadow-3xs"
              >
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                  <AlertCircle className="h-5 w-5" /> Reconstruction Failed
                </div>
                <p className="text-xs text-red-655 dark:text-red-400 leading-relaxed font-semibold">
                  {error}
                </p>
                <p className="text-[10px] text-slate-400">
                  Verify your API config or adjust the selected items parameters and click submit to retry.
                </p>
              </motion.div>
            )}

            {!isLoading && !article && !error && (
              <motion.div
                key="rewriter-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-55/40 dark:bg-slate-900/40 border border-dashed border-gray-250 dark:border-slate-800 rounded-2xl p-8 text-center min-h-[480px] flex flex-col items-center justify-center space-y-4"
              >
                <div className="h-14 w-14 bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-850 flex items-center justify-center text-slate-400">
                  <Layers className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350">
                    Awaiting Target Terms & Topic Parameters
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Choose your target terms on the left panel, customize a global issue topic, and trigger the reconstruction process to receive a structured article analysis.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTopic("The Impact of Social Media Algorithms on Democratic Institutions");
                      setBandScore("8.0");
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-900/30 cursor-pointer shadow-3xs transition-colors"
                  >
                    🚀 Load Sample Topic & Go
                  </button>
                </div>
              </motion.div>
            )}

            {/* Generated Article Outputs & Structural Breakdown */}
            {article && (
              <motion.div
                key="rewriter-success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Copy Essay Full Text Bar */}
                <div className="bg-slate-900 text-white border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#9cd8cc] font-mono">
                      Output Target: IELTS Band {bandScore} Rigor
                    </span>
                    <h3 className="text-xs font-bold text-white max-w-[280px] md:max-w-md line-clamp-1">
                      {article.headline}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(getFullCompiledText(), "full")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-gray-200 font-bold text-[11px] cursor-pointer shadow-3xs transition-all font-sans shrink-0"
                  >
                    {copiedSection === "full" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400 font-bold" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Full Essay
                      </>
                    )}
                  </button>
                </div>

                {/* Main Headline mimicking The Economist */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-600"></div>
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-widest uppercase font-mono block">
                      The Economist Columnist Style Analysis
                    </span>
                    <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-white leading-tight tracking-tight">
                      {article.headline}
                    </h2>
                    <span className="text-[10px] text-gray-400 italic font-medium font-mono">
                      Published via AI Synthesis Calibration • London Ed.
                    </span>
                  </div>
                </div>

                {/* 1. 开头段 (Introduction) Block */}
                <div className="bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                      <Layout className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>1. 开头段 / Introduction Paragraph</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(article.introduction.text, "intro")}
                      className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                    >
                      {copiedSection === "intro" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm font-medium text-slate-805 dark:text-slate-300 leading-relaxed font-sans font-semibold border-l-2 border-emerald-500/80 pl-4 py-1 italic">
                      "{article.introduction.text}"
                    </p>
                    <div className="bg-slate-50/60 dark:bg-slate-955 p-3.5 rounded-xl border border-gray-150/50 dark:border-slate-850 border-dashed text-xs text-slate-650 dark:text-slate-405 leading-relaxed font-medium">
                      <span className="font-bold text-emerald-800 dark:text-emerald-450 block mb-1">💡 文案脉络剖析 (Pedagogical Deconstruction):</span>
                      {article.introduction.analysis_zh}
                    </div>
                  </div>
                </div>

                {/* 2. 中间段列 (Body Paragraphs) Blocks */}
                {article.body_paragraphs.map((p, pIdx) => (
                  <div key={pIdx} className="bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/20 px-5 py-3 border-b border-gray-200 dark:border-slate-850 flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 shrink-0" />
                        <span>2.{pIdx + 1} 中间段 / Body Paragraph {pIdx + 1}</span>
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-805 dark:text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-900/40 font-mono">
                          {p.para_type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(p.text, `body-${pIdx}`)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                        >
                          {copiedSection === `body-${pIdx}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-sm font-medium text-slate-805 dark:text-slate-300 leading-relaxed font-sans border-l-2 border-indigo-500/85 pl-4 py-1">
                        {p.text}
                      </p>
                      <div className="bg-slate-50/60 dark:bg-slate-955 p-3.5 rounded-xl border border-gray-150/50 dark:border-slate-850 border-dashed text-xs text-slate-650 dark:text-slate-405 leading-relaxed font-medium">
                        <span className="font-bold text-indigo-800 dark:text-indigo-450 block mb-1">💡 本段论证结构解构 (Rhetorical Analysis):</span>
                        {p.analysis_zh}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 3. 结尾段 (Conclusion) Block */}
                <div className="bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                      <Layout className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>3. 结尾段 / Conclusion Paragraph</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(article.conclusion.text, "conclusion")}
                      className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                    >
                      {copiedSection === "conclusion" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm font-medium text-slate-805 dark:text-slate-300 leading-relaxed font-sans font-semibold border-l-2 border-amber-500/80 pl-4 py-1 italic">
                      "{article.conclusion.text}"
                    </p>
                    <div className="bg-slate-50/60 dark:bg-slate-955 p-3.5 rounded-xl border border-gray-150/50 dark:border-slate-850 border-dashed text-xs text-slate-650 dark:text-slate-405 leading-relaxed font-medium">
                      <span className="font-bold text-amber-800 dark:text-amber-450 block mb-1">💡 结尾总结手段解析 (Summary Methodology):</span>
                      {article.conclusion.analysis_zh}
                    </div>
                  </div>
                </div>

                {/* 4. Target checklist validation highlights */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 border-b border-gray-150 dark:border-slate-850 pb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>融合考点与应用校验 (Integrated Checked Lexemes Summary)</span>
                  </h4>
                  <div className="space-y-3.5 divide-y divide-gray-100 dark:divide-slate-850/70 pt-1">
                    {article.items_used_checklist && article.items_used_checklist.length > 0 ? (
                      article.items_used_checklist.map((itemObj, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="font-mono font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-150/60 dark:border-indigo-900/40">
                              {itemObj.item}
                            </span>
                            <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-1 font-mono">
                              <Check className="h-3 w-3" /> Successfully Placed
                            </span>
                          </div>
                          <p className="font-medium text-slate-855 dark:text-slate-300 italic leading-relaxed">
                            "{itemObj.sentence_where_used}"
                          </p>
                          <p className="text-[11px] text-slate-550 dark:text-slate-450 font-semibold pl-2 border-l-2 border-slate-300 dark:border-slate-700">
                            <span className="text-slate-800 dark:text-slate-205 font-bold">考点解析:</span> {itemObj.usage_analysis_zh}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No checklist mapping returned.</p>
                    )}
                  </div>
                </div>

                {/* 5. Style Overview Commentary Panel */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-[#9cd8cc] border-b border-slate-800 pb-2 flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-4 w-4 text-[#9cd8cc]" /> 《经济学人》经典文风运用与评价 (The Economist Style Review)
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    {article.stylistic_economist_analysis_zh}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

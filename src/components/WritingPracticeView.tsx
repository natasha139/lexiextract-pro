import React, { useState } from "react";
import { CorpusAnalysisResult } from "../types";
import { API_BASE } from "../config";
import {
  Sparkles,
  Send,
  CheckCircle2,
  XCircle, 
  BookOpen, 
  TrendingUp, 
  CornerDownRight, 
  Copy, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  PenTool, 
  AlertCircle, 
  FileCheck,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TargetItemAnalysis {
  item: string;
  detected: boolean;
  is_correct: boolean;
  usage_feedback: string;
}

interface WritingCorrection {
  original: string;
  suggestion: string;
  explanation: string;
}

interface WritingFeedbackResponse {
  score_out_of_10: number;
  cefr_equivalent: string;
  target_items_analysis: TargetItemAnalysis[];
  corrections: WritingCorrection[];
  strengths: string[];
  polished_version: string;
}

interface WritingPracticeProps {
  data: CorpusAnalysisResult;
}

export default function WritingPracticeView({ data }: WritingPracticeProps) {
  const [paragraph, setParagraph] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    data.vocabulary_blocks?.slice(0, 4).forEach((v) => initial.add(v.item));
    data.phrase_blocks?.slice(0, 3).forEach((p) => initial.add(p.item));
    data.sentence_patterns?.slice(0, 2).forEach((s) => initial.add(s.pattern_structure));
    return initial;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<WritingFeedbackResponse | null>(null);
  const [copiedPolished, setCopiedPolished] = useState(false);
  const [writingPrompt, setWritingPrompt] = useState<string>(() => {
    // Generate an initial prompt based on metadata
    const cat = data.meta_data?.category || "Academic English";
    const title = data.meta_data?.title || "Target Passage";
    return `Incorporate your target vocabulary and patterns into a short paragraph discussing the core themes of "${title}" (belonging to ${cat}). Discuss its general implications or formulate an academic argument.`;
  });

  // Calculate some sample prompts for inspiration based on Category & Title
  const generateNewPrompt = () => {
    const prompts = [
      `Write an argumentative paragraph evaluating the primary assertions made in "${data.meta_data.title}". Do you agree with the author's stance?`,
      `Formulate a short academic abstract summarizing how the concept of "${data.meta_data.title}" influences modern research in "${data.meta_data.category}".`,
      `Discuss the potential societal or scientific consequences of taking the main points of "${data.meta_data.title}" for granted. Describe how researchers must address these challenges.`,
      `Construct a clear, concise counter-argument to the findings described in "${data.meta_data.title}", maintaining a highly academic and skeptical register.`
    ];
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setWritingPrompt(prompts[randomIndex]);
  };

  const toggleItemSelection = (item: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const handleCopyPolished = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPolished(true);
      setTimeout(() => setCopiedPolished(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSubmitWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paragraph.trim()) return;

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE}/api/writing-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paragraph,
          targetItems: Array.from(selectedItems),
          targetLevel: data.meta_data.target_level
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to receive evaluation feedback.");
      }

      const feedbackData: WritingFeedbackResponse = await response.json();
      setFeedback(feedbackData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during validation.");
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = paragraph.trim() === "" ? 0 : paragraph.trim().split(/\s+/).length;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Introduction Banner Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
            <PenTool className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Interactive Writing Coach & feedback Panel
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Real-time stylistic reviews and grammatical diagnostic criteria governed by high-stakes exam criteria.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-150 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">🎯 Goal:</p>
          Write a concise argument or summary incorporating your targeted high-tier lexical elements and sentence configurations. 
          Use the toggles below to indicate which formulas you are intending to practice, and the AI agent will analyze their contextual, syntactical, and lexical correctness.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Writing Inputs & Selector Tags */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmitWriting} className="space-y-4 bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
            {/* Dynamic Interactive Prompt Trigger */}
            <div className="space-y-2 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
                  <Sparkles className="h-3.5 w-3.5" /> Core Writing Prompt
                </span>
                <button
                  type="button"
                  onClick={generateNewPrompt}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> Another Prompt
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 bg-slate-55/60 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3 leading-relaxed">
                {writingPrompt}
              </p>
            </div>

            {/* Target Checklist Panel */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Select items you are actively practicing (目标词汇与句式组):
              </span>
              <p className="text-[10px] text-gray-400 mb-1.5">
                Click tags to prioritize them for real-time model synthesis checks.
              </p>

              {/* Tag Containers */}
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Vocabulary items */}
                {data.vocabulary_blocks?.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleItemSelection(v.item)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                      selectedItems.has(v.item)
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80 shadow-3xs"
                        : "bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800"
                    }`}
                  >
                    {v.item} <span className="text-[9px] font-normal font-mono">({v.part_of_speech})</span>
                  </button>
                ))}

                {/* Phrase items */}
                {data.phrase_blocks?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleItemSelection(p.item)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                      selectedItems.has(p.item)
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/80 shadow-3xs"
                        : "bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800"
                    }`}
                  >
                    {p.item}
                  </button>
                ))}

                {/* Patterns items */}
                {data.sentence_patterns?.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleItemSelection(s.pattern_structure)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border cursor-pointer transition-all ${
                      selectedItems.has(s.pattern_structure)
                        ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80 shadow-3xs text-[10px]"
                        : "bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-800 text-[10px]"
                    }`}
                  >
                    {s.pattern_structure}
                  </button>
                ))}
              </div>
            </div>

            {/* Writing Textarea */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  Draft Your Paragraph (在下方撰写学术段落)
                </label>
                <span className="text-[10px] font-mono text-gray-400 font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                  {wordCount} words
                </span>
              </div>
              <textarea
                value={paragraph}
                onChange={(e) => setParagraph(e.target.value)}
                placeholder="Write your academic commentary here. Be sure to weave in your checked spelling and syntactic configurations naturally..."
                className="w-full h-56 p-4 rounded-xl text-sm font-medium border border-gray-200 focus:border-slate-900 focus:outline-hidden dark:bg-slate-950 dark:border-slate-800 dark:focus:border-slate-100 transition-colors placeholder:text-gray-400 dark:placeholder:text-slate-600 leading-relaxed font-sans shadow-3xs"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500 italic">
                *Targeting: {data.meta_data.target_level} Level Criteria
              </span>
              <button
                type="submit"
                disabled={isLoading || wordCount < 5}
                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-xl hover:bg-slate-800 dark:hover:bg-white text-xs font-bold font-sans tracking-tight transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs font-medium"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Reviewing Writing...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Get Real-time Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: feedback Outputs & Metrics */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading-panel"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[350px] space-y-5 text-center"
              >
                {/* Circular pulse indicator */}
                <div className="relative">
                  <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center animate-ping absolute top-0 left-0 opacity-40"></div>
                  <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/60 rounded-full flex items-center justify-center relative border border-emerald-200">
                    <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-450 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Evaluative Calibration Active</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 max-w-xs leading-relaxed font-semibold">
                    The writing agent is scanning for vocabulary compliance, checking syntactic structure errors, and polishing academic cadence.
                  </p>
                </div>

                {/* Staggered progress steps simulated */}
                <div className="space-y-2.5 w-full max-w-[240px] text-[10px] font-bold text-slate-400 dark:text-slate-550 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Parsing corpus spelling parameters...
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" /> Verifying checked lexical targets...
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5" /> Compiling style rephrasing suggestions...
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-6 rounded-2xl space-y-3 shadow-3xs"
              >
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                  <AlertCircle className="h-5 w-5" /> Evaluation Failed
                </div>
                <p className="text-xs text-red-655 dark:text-red-400 leaders-normal font-semibold">
                  {error}
                </p>
                <p className="text-[10px] text-slate-400">
                  Please verify that your Gemini API key is configured properly. You can try resubmitting to trigger a retry.
                </p>
              </motion.div>
            )}

            {/* Standard pre-submit placeholder panel */}
            {!isLoading && !feedback && !error && (
              <motion.div
                key="placeholder-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-55/40 dark:bg-slate-900/40 border border-dashed border-gray-250 dark:border-slate-800 rounded-2xl p-6 text-center min-h-[420px] flex flex-col items-center justify-center space-y-4"
              >
                <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-850 flex items-center justify-center text-slate-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-350">Awaiting Paragraph Draft</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 max-w-[220px] mx-auto mt-2 leading-relaxed">
                    Write in the editing pane and click submit. The diagnostic diagnostics will appear instantly.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Feedback Dashboard Panel */}
            {feedback && (
              <motion.div
                key="feedback-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score & CEFR Header Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-bl-full flex items-center justify-center"></div>
                  
                  <div className="flex items-center gap-4">
                    {/* Radial overall score simulation */}
                    <div className="h-16 w-16 bg-emerald-600 dark:bg-emerald-700 text-white rounded-full flex flex-col items-center justify-center shadow-md">
                      <span className="text-xl font-extrabold font-mono tracking-tighter leading-none">{feedback.score_out_of_10}</span>
                      <span className="text-[8px] uppercase tracking-wider font-bold mt-0.5 opacity-80">/10</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Academic Diagnostic Score</span>
                        <Award className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                          {feedback.score_out_of_10 >= 8 ? "Superior Performance" : feedback.score_out_of_10 >= 6 ? "Proficient Standard" : "Developmental Alert"}
                        </h4>
                        <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-extrabold font-mono rounded border border-indigo-100/60 dark:border-indigo-900/40">
                          {feedback.cefr_equivalent} Standard
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected target analytical highlights */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2">
                    Lexical & Pattern Compliance Checklist (检测目标使用情况):
                  </h4>

                  <div className="space-y-3 divide-y divide-gray-100 dark:divide-slate-800/80">
                    {feedback.target_items_analysis && feedback.target_items_analysis.length > 0 ? (
                      feedback.target_items_analysis.map((tag, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 pb-1.5 text-xs">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-mono font-extrabold text-slate-900 dark:text-slate-200 break-all bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-850/60">
                              {tag.item}
                            </span>
                            {tag.detected ? (
                              tag.is_correct ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Correct Usage
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1 text-[10px]">
                                  <AlertCircle className="h-3.5 w-3.5" /> Usage Warning
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 dark:text-slate-550 font-bold flex items-center gap-1 text-[10px]">
                                <XCircle className="h-3.5 w-3.5" /> Left Unused
                              </span>
                            )}
                          </div>
                          <p className="text-slate-655 dark:text-slate-400 font-medium leading-relaxed mt-1">
                            {tag.usage_feedback}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] italic text-slate-400 py-2">No target items were checked for compliance verification.</p>
                    )}
                  </div>
                </div>

                {/* Concrete Academic Edit Highlights */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-800 pb-2">
                    Surgical Stylistic & Grammar Edits (逐句修改意见):
                  </h4>

                  {feedback.corrections && feedback.corrections.length > 0 ? (
                    <div className="space-y-4">
                      {feedback.corrections.map((corr, idx) => (
                        <div key={idx} className="space-y-2 text-xs border-b border-dashed border-gray-100 dark:border-slate-800/80 pb-3 last:border-0 last:pb-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            {/* Original section */}
                            <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-950/80 p-2.5 rounded-lg text-red-800 dark:text-red-400 font-medium line-through">
                              <span className="text-[8px] uppercase tracking-wider font-extrabold block text-red-500 mb-0.5">Original</span>
                              "{corr.original}"
                            </div>
                            {/* Suggestion section */}
                            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/80 p-2.5 rounded-lg text-emerald-800 dark:text-emerald-300 font-semibold direct-action">
                              <span className="text-[8px] uppercase tracking-wider font-extrabold block text-emerald-600 dark:text-emerald-450 mb-0.5">Suggestion</span>
                              "{corr.suggestion}"
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-semibold pl-1">
                            <span className="text-slate-900 dark:text-slate-200 font-bold">Rule:</span> {corr.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center space-y-2">
                      <FileCheck className="h-6 w-6 text-emerald-600" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-255">Perfect Grammatical Cadence</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                        No structural corrections or developmental warnings were reported. You've established exceptional flow!
                      </p>
                    </div>
                  )}
                </div>

                {/* Key Strengths Grid */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 border-b border-gray-100 dark:border-slate-800 pb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Strong Aspects Detected (写作亮点):
                  </h4>
                  <ul className="space-y-2 list-none pl-0">
                    {feedback.strengths && feedback.strengths.map((str, sIdx) => (
                      <li key={sIdx} className="flex gap-2 items-start text-xs text-slate-605 dark:text-slate-350 font-medium">
                        <CornerDownRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded Polished Version Panel across bottom row */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 dark:bg-slate-950 border border-slate-850 rounded-2xl p-6 shadow-md text-white space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">AI Elevated Academic Edition (学术润色参考)</h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono">
                    Model: gemini-3.5-flash • Elevating syntax while maintaining semantic arguments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyPolished(feedback.polished_version)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-gray-200 hover:bg-slate-705 font-bold text-[11px] cursor-pointer shadow-3xs transition-all font-sans"
              >
                {copiedPolished ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 font-bold" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Polished Text
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 leading-relaxed text-xs">
              <div className="space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">Your Draft:</span>
                <p className="text-gray-300 font-medium whitespace-pre-wrap">{paragraph}</p>
              </div>

              <div className="space-y-1 bg-slate-950/70 p-4 rounded-xl border border-slate-850/60 shadow-inner">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-400 font-mono">AI Polished Version:</span>
                <p className="text-white font-semibold whitespace-pre-wrap leading-relaxed italic">
                  "{feedback.polished_version}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

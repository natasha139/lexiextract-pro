import React, { useState, useEffect } from "react";
import { CorpusAnalysisResult } from "../types";
import { API_BASE } from "../config";
import {
  Search,
  BookOpen,
  Languages,
  ClipboardList,
  Edit,
  Save,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Bookmark,
  X,
  FileCheck,
  Brain,
  Plus,
  Info,
  Sparkles,
  Activity,
  FileText,
  BarChart3,
  Check,
  Lightbulb,
  Loader2,
  Image,
  Eye
} from "lucide-react";
import cefrDictRaw from "../data/cefr_dictionary.json";
import cefrDetailsRaw from "../data/cefr_details.json";

const cefrDict = cefrDictRaw as Record<string, string>;
const cefrDetails = cefrDetailsRaw as Record<string, { pos: string; cefr: string }[]>;

const getCefrLevel = (word: string): string => {
  if (!word) return "";
  const cleanWord = word.trim().toLowerCase();
  return cefrDict[cleanWord] || "C1/C2";
};

const getCefrStyle = (level: string) => {
  switch (level) {
    case "A1": return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800/40";
    case "A2": return "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200 dark:border-teal-800/40";
    case "B1": return "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800/40";
    case "B2": return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40";
    default: return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/40";
  }
};

const getCefrName = (level: string) => {
  switch (level) {
    case "A1": return "A1 Beginner";
    case "A2": return "A2 Elementary";
    case "B1": return "B1 Intermediate";
    case "B2": return "B2 Upper-Int";
    default: return "C1/C2 Advanced";
  }
};

const countOccurrences = (text: string, term: string) => {
  if (!text || !term) return 0;
  try {
    // Escape regex characters
    const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    // For single word, use word boundary for precision
    const isSingleWord = !term.includes(" ");
    const regexStr = isSingleWord ? `\\b${escaped}\\b` : escaped;
    const regex = new RegExp(regexStr, "gi");
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  } catch (e) {
    const cleanText = text.toLowerCase();
    const cleanWord = term.toLowerCase();
    let count = 0;
    let pos = cleanText.indexOf(cleanWord);
    while (pos !== -1) {
      count++;
      pos = cleanText.indexOf(cleanWord, pos + cleanWord.length);
    }
    return count;
  }
};

const getWordCountOfText = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

const getAcademicFrequency = (item: string, cefrLevel: string, type: "word" | "phrase" | "pattern"): { pmw: number; label: "High" | "Medium" | "Low" | "Very Low" | "Rare" } => {
  const clean = item.trim().toLowerCase();
  
  const specialMap: Record<string, number> = {
    "epistemological": 3.8,
    "profound": 84.5,
    "inherent": 65.2,
    "unprecedented": 22.4,
    "mitigate": 34.1,
    "anoxia": 1.2,
    "hypoxia": 1.9,
    "phenotype": 12.5,
    "phenotypes": 11.2,
    "take for granted": 18.5,
    "bear in mind": 24.1,
    "provide an advantage for": 8.5,
    "urbanisation": 14.2,
    "microclimates": 2.1,
    "evapotranspiration": 1.5,
    "anoxic": 1.4,
    "sedimentary": 9.5,
    "extinction": 15.3,
    "weathering": 10.1,
    "catastrophe": 12.8,
    "shannon entropy": 0.8,
    "backpropagation": 2.4,
    "convex": 18.9,
    "gradients": 9.2,
    "spectral radius": 1.1,
    "hessian matrix": 1.3,
  };

  if (specialMap[clean]) {
    const pmw = specialMap[clean];
    let label: "High" | "Medium" | "Low" | "Very Low" | "Rare" = "Medium";
    if (pmw > 100) label = "High";
    else if (pmw > 30) label = "Medium";
    else if (pmw > 10) label = "Low";
    else if (pmw > 2) label = "Very Low";
    else label = "Rare";
    return { pmw, label };
  }

  if (type === "pattern") {
    return { pmw: 4.8, label: "Very Low" };
  }
  if (type === "phrase") {
    return { pmw: 12.2, label: "Low" };
  }

  switch (cefrLevel) {
    case "A1": return { pmw: 850, label: "High" };
    case "A2": return { pmw: 450, label: "High" };
    case "B1": return { pmw: 220, label: "Medium" };
    case "B2": return { pmw: 110, label: "Medium" };
    case "C1": return { pmw: 32, label: "Low" };
    case "C2": return { pmw: 12, label: "Very Low" };
    default: return { pmw: 15.5, label: "Low" };
  }
};

const getFrequencyMetrics = (item: string, type: "word" | "phrase" | "pattern", text: string, cefrLevel: string) => {
  const occurrences = countOccurrences(text, item);
  const totalWords = getWordCountOfText(text) || 150;
  const currentPmw = Math.round((occurrences / totalWords) * 1000000);
  
  const academicStandard = getAcademicFrequency(item, cefrLevel, type);
  
  const ratio = academicStandard.pmw > 0 ? currentPmw / academicStandard.pmw : 0;
  let densityBadge = { text: "Standard Academic Usage", color: "text-slate-650 bg-slate-100 border-slate-205 dark:bg-slate-800/60 dark:text-slate-350 dark:border-slate-700" };
  
  if (occurrences === 0) {
    densityBadge = { text: "External Target Term", color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40" };
  } else if (ratio > 5) {
    densityBadge = { text: "Hyper-Dense in Corpus", color: "text-rose-650 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/40" };
  } else if (ratio > 2) {
    densityBadge = { text: "Highly Concentrated", color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/40" };
  } else if (ratio > 0.5) {
    densityBadge = { text: "Representative Usage", color: "text-indigo-650 bg-indigo-50 border-indigo-150 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40" };
  } else {
    densityBadge = { text: "Scattered Occurrence", color: "text-sky-655 bg-sky-50 border-sky-150 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30" };
  }

  // Bar ratios for representation (capped at 100%)
  // Base scale: 100 PMW corresponds to ~50%
  const corpusBarPct = Math.min(100, Math.max(1, Math.round((currentPmw / 300) * 100)));
  const academicBarPct = Math.min(100, Math.max(1, Math.round((academicStandard.pmw / 300) * 100)));

  return {
    occurrences,
    currentPmw,
    academicPmw: Math.round(academicStandard.pmw * 10) / 10,
    academicLabel: academicStandard.label,
    densityBadge,
    corpusBarPct,
    academicBarPct,
    ratio: Math.round(ratio * 10) / 10
  };
};

interface WordBankViewProps {
  data: CorpusAnalysisResult;
  masteredIds: Set<string>;
  onToggleMastered: (id: string) => void;
  rawText?: string;
}

export default function WordBankView({ data, masteredIds, onToggleMastered, rawText = "" }: WordBankViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "word" | "phrase" | "pattern">("all");
  const [filterMastery, setFilterMastery] = useState<"all" | "mastered" | "learning">("all");
  const [filterBox, setFilterBox] = useState<number | null>(null);

  // AI Explanation cache & modal/loading states
  const [explanations, setExplanations] = useState<Record<string, {
    nuance_explanation: string;
    common_pitfalls: string[];
    collocation_suggestions: string[];
    tip: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem("corpus_ai_explanations");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeExplainItem, setActiveExplainItem] = useState<any | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const handleShowExplanation = async (x: any) => {
    setActiveExplainItem(x);
    setIsExplainModalOpen(true);
    setExplainError(null);

    // If already exists in cache, do not call API
    if (explanations[x.id]) {
      return;
    }

    setExplainLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/explain-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: x.item,
          type: x.type,
          partOfSpeech: x.part_of_speech || x.type,
          definition: x.definition_en,
          sentence: x.academic_example || x.contextual_sentence || ""
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate explanation. Server returned ${response.status}`);
      }

      const explanationData = await response.json();
      
      const updated = { ...explanations, [x.id]: explanationData };
      setExplanations(updated);
      localStorage.setItem("corpus_ai_explanations", JSON.stringify(updated));
    } catch (err: any) {
      console.error(err);
      setExplainError(err.message || "Something went wrong while connecting to the AI explainer.");
    } finally {
      setExplainLoading(false);
    }
  };

  // AI-powered Cognitive Visual Aid cache & loading states
  const [visualAids, setVisualAids] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("corpus_visual_aids");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [visualPrompts, setVisualPrompts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("corpus_visual_prompts");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeModalTab, setActiveModalTab] = useState<"explanation" | "visual">("explanation");
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);

  const generateVisualAid = async (x: any) => {
    setVisualError(null);
    if (visualAids[x.id]) {
      return;
    }

    setVisualLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/generate-visual-aid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: x.item,
          type: x.type,
          partOfSpeech: x.part_of_speech || x.type,
          definition: x.definition_en,
          sentence: x.academic_example || x.contextual_sentence || ""
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate visual aid. Server returned ${response.status}`);
      }

      const visualData = await response.json();
      if (!visualData.dataUrl) {
        throw new Error("No image data received from the AI designer.");
      }

      const updatedImages = { ...visualAids, [x.id]: visualData.dataUrl };
      const updatedPrompts = { ...visualPrompts, [x.id]: visualData.visualPrompt || "" };
      
      setVisualAids(updatedImages);
      setVisualPrompts(updatedPrompts);
      
      localStorage.setItem("corpus_visual_aids", JSON.stringify(updatedImages));
      localStorage.setItem("corpus_visual_prompts", JSON.stringify(updatedPrompts));
    } catch (err: any) {
      console.error(err);
      setVisualError(err.message || "Failed to generate custom memory illustration.");
    } finally {
      setVisualLoading(false);
    }
  };

  const handleShowVisualAid = (x: any) => {
    setActiveExplainItem(x);
    setActiveModalTab("visual");
    setIsExplainModalOpen(true);
    generateVisualAid(x);
  };

  // CEFR Offline Lookup & Profiler states
  const [isCefrHubOpen, setIsCefrHubOpen] = useState(false);
  const [cefrActiveSubTab, setCefrActiveSubTab] = useState<"lookup" | "profiler">("lookup");
  const [lookupQuery, setLookupQuery] = useState("");
  const [profileTextQuery, setProfileTextQuery] = useState("");
  
  // Local list of custom vocabulary added via offline lookup
  const [starredLocalWords, setStarredLocalWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("starred_cefr_words");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleStarWord = (word: string) => {
    const wordLower = word.trim().toLowerCase();
    if (!wordLower) return;
    
    setStarredLocalWords((prev) => {
      const isStarred = prev.includes(wordLower);
      let updated: string[];
      if (isStarred) {
        updated = prev.filter(w => w !== wordLower);
      } else {
        updated = [...prev, wordLower];
      }
      localStorage.setItem("starred_cefr_words", JSON.stringify(updated));
      return updated;
    });
  };

  // Custom User Study notes state
  const [studyNotes, setStudyNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("corpus_studynotes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");

  // Spaced-repetition data from localStorage to show Box level
  const [spacedRepData, setSpacedRepData] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("corpus-spaced-repetition");
      if (saved) {
        setSpacedRepData(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save notes helper
  const handleSaveNote = (id: string) => {
    const updated = { ...studyNotes, [id]: editingNote };
    setStudyNotes(updated);
    localStorage.setItem("corpus_studynotes", JSON.stringify(updated));
    setEditingId(null);
  };

  // Compile unified searchable items
  const getUnifiedItems = () => {
    const list: Array<{
      id: string;
      item: string;
      type: "word" | "phrase" | "pattern";
      part_of_speech?: string;
      definition_en?: string;
      contextual_sentence?: string;
      academic_example?: string;
      notes?: string;
      box: number;
    }> = [];

    data.vocabulary_blocks?.forEach((v) => {
      const srInfo = spacedRepData[v.item] || spacedRepData[v.id];
      list.push({
        id: v.id,
        item: v.item,
        type: "word",
        part_of_speech: v.part_of_speech,
        definition_en: v.definition_en,
        contextual_sentence: v.contextual_sentence,
        academic_example: v.academic_example,
        box: srInfo?.box || 1,
      });
    });

    // Merge starred offline lookup words
    starredLocalWords.forEach((word) => {
      const wordLower = word.toLowerCase();
      const existsInCorpus = list.some(item => item.item.toLowerCase() === wordLower);
      if (!existsInCorpus) {
        const details = cefrDetails[wordLower] || [{ pos: "vocabulary", cefr: "C1/C2" }];
        const primaryPos = details[0]?.pos || "word";
        const primaryCefr = details[0]?.cefr || "C1/C2";
        const srInfo = spacedRepData[word] || spacedRepData[`custom-${wordLower}`];

        list.push({
          id: `custom-${wordLower}`,
          item: word,
          type: "word",
          part_of_speech: `${primaryPos} (Custom)`,
          definition_en: `Personalized dictionary lookup card. Mapped as: ${primaryCefr} level.`,
          contextual_sentence: "Added locally from offline CEFR dictionary search.",
          academic_example: `A custom study word added for personal memorisation: "${word}".`,
          box: srInfo?.box || 1,
        });
      }
    });

    data.phrase_blocks?.forEach((p) => {
      const srInfo = spacedRepData[p.item] || spacedRepData[p.id];
      list.push({
        id: p.id,
        item: p.item,
        type: "phrase",
        part_of_speech: "Phrase",
        definition_en: p.definition_en,
        contextual_sentence: p.contextual_sentence,
        academic_example: p.academic_example,
        box: srInfo?.box || 1,
      });
    });

    data.sentence_patterns?.forEach((s) => {
      const srInfo = spacedRepData[s.pattern_structure] || spacedRepData[s.id];
      list.push({
        id: s.id,
        item: s.pattern_structure,
        type: "pattern",
        part_of_speech: "Syntactic structure",
        definition_en: s.functional_purpose,
        contextual_sentence: s.contextual_sentence,
        academic_example: s.academic_example,
        box: srInfo?.box || 1,
      });
    });

    return list;
  };

  const unifiedList = getUnifiedItems();

  // Filter the list
  const filteredList = unifiedList.filter((x) => {
    // 1. Search term
    const matchesSearch =
      x.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (x.definition_en || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (x.contextual_sentence || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Type filter
    if (filterType !== "all" && x.type !== filterType) return false;

    // 3. Mastery filter
    const isMastered = masteredIds.has(x.id);
    if (filterMastery === "mastered" && !isMastered) return false;
    if (filterMastery === "learning" && isMastered) return false;

    // 4. Leitner box filter
    if (filterBox !== null && x.box !== filterBox) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Desk */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-3xs transition-colors">
        <div className="space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
            <span>Academic Lexical Repository</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A comprehensive, searchable study bank compiled from current corpus data containing {unifiedList.length} total elements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 text-xs font-mono">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-750">
              单词 Words: {unifiedList.filter((i) => i.type === "word").length}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-750">
              搭配 Phrases: {unifiedList.filter((i) => i.type === "phrase").length}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-750">
              句式 Patterns: {unifiedList.filter((i) => i.type === "pattern").length}
            </span>
          </div>

          <button
            onClick={() => setIsCefrHubOpen(!isCefrHubOpen)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
              isCefrHubOpen
                ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>CEFR-J Hub</span>
          </button>
        </div>
      </div>

      {isCefrHubOpen && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 p-6 rounded-2xl space-y-5 shadow-sm transition-all animate-in fade-in slide-in-from-top-3 duration-250">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-150 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-150 flex items-center gap-2">
                <Brain className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                <span>CEFR-J Interactive Intelligence Hub</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-450">
                Offline analyzer and complete dictionary powered by open English profile datasets from CEFR-J.
              </p>
            </div>
            
            {/* Sub-tab selection */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
              <button
                onClick={() => setCefrActiveSubTab("lookup")}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  cefrActiveSubTab === "lookup"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-3xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-350"
                }`}
              >
                Dictionary Look-up
              </button>
              <button
                onClick={() => setCefrActiveSubTab("profiler")}
                className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  cefrActiveSubTab === "profiler"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-3xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-350"
                }`}
              >
                Text Level Profiler
              </button>
            </div>
          </div>

          {cefrActiveSubTab === "lookup" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Enter any verb, noun, adjective (e.g. abandon, ability, aboard)..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50/65 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-450 dark:focus:border-indigo-600 transition-colors"
                />
              </div>

              {lookupQuery.trim() ? (() => {
                const qLower = lookupQuery.trim().toLowerCase();
                // Filter matches
                const matches = Object.keys(cefrDict)
                  .filter(k => k.includes(qLower))
                  .slice(0, 8); // show max 8 matches for responsiveness

                if (matches.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-450 italic text-xs">
                      No matching lemmas found in CEFR-J syllabus. Note: You can star and add it as a C1/C2 word anyway!
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            handleStarWord(lookupQuery);
                            setLookupQuery("");
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 rounded-lg text-[10px] font-extrabold flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Star "{lookupQuery.trim()}" inside Leitner Study List</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {matches.map((match) => {
                      const level = getCefrLevel(match);
                      const isStarred = starredLocalWords.includes(match);
                      const detailsList = cefrDetails[match] || [];
                      
                      return (
                        <div key={match} className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20 flex items-center justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-colors">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 capitalize">{match}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold border ${getCefrStyle(level)}`}>
                                {getCefrName(level)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {detailsList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {detailsList.map((d, i) => (
                                    <span key={i} className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9.5px]">
                                      {d.pos}: {d.cefr}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span>No POS breakdown available.</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleStarWord(match)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isStarred
                                ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-400"
                                : "bg-white hover:bg-slate-100 border-gray-200 text-slate-400 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700"
                            }`}
                            title={isStarred ? "Remove from Leitner lists" : "Add word to Leitner List"}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${isStarred ? "fill-amber-400 text-amber-500" : ""}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="p-5 text-center bg-slate-50/50 dark:bg-slate-950/30 rounded-xl space-y-1.5">
                  <Info className="h-5 w-5 text-indigo-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Start typing to query 7,020 CEFR-J core items</p>
                  <p className="text-[10.5px] text-slate-450 max-w-sm mx-auto">
                    Every word is categorized according to official CEFR guidelines. Add any word to your customized Leitner spaced-repetition memory engine using the bookmark button.
                  </p>
                  
                  {starredLocalWords.length > 0 && (
                     <div className="pt-3 border-t border-gray-250/60 dark:border-slate-800/60 mt-3 text-left">
                       <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">My Handpicked CEFR Words ({starredLocalWords.length})</span>
                       <div className="flex flex-wrap gap-1.5">
                         {starredLocalWords.map(w => (
                           <span key={w} className="inline-flex items-center gap-1 text-[10px] bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-150/50 dark:border-indigo-900/30">
                             <span className="font-medium">{w}</span>
                             <X className="h-2.5 w-2.5 cursor-pointer text-indigo-400 hover:text-indigo-650" onClick={() => handleStarWord(w)} />
                           </span>
                         ))}
                       </div>
                     </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Paste English Paragraph to analyze</span>
                <textarea
                  value={profileTextQuery}
                  onChange={(e) => setProfileTextQuery(e.target.value)}
                  placeholder="Example: She abandoned her old cottage to find an exceptional ability abroad abnormally."
                  className="w-full p-3 bg-slate-50/60 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-xs"
                  rows={4}
                />
              </div>

              {profileTextQuery.trim() ? (() => {
                // Tokenize words
                const tokens = profileTextQuery
                  .split(/([a-zA-Z0-9'-]+|\s+|[.,!?;:()"])/g)
                  .filter(t => t !== undefined && t !== "");

                const stats = { A1: 0, A2: 0, B1: 0, B2: 0, "C1/C2": 0, Total: 0 };
                
                tokens.forEach((tk) => {
                  if (/^[a-zA-Z0-9'-]+$/.test(tk)) {
                    stats.Total++;
                    const lvl = getCefrLevel(tk);
                    if (lvl === "A1") stats.A1++;
                    else if (lvl === "A2") stats.A2++;
                    else if (lvl === "B1") stats.B1++;
                    else if (lvl === "B2") stats.B2++;
                    else stats["C1/C2"]++;
                  }
                });

                return (
                  <div className="space-y-4">
                    {/* Graph & Stats board */}
                    <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">CEFR Grade Distribution (%)</span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { label: "A1 Beginner", val: stats.A1, color: "bg-green-500", txtColor: "text-green-600 dark:text-green-400" },
                          { label: "A2 Elementary", val: stats.A2, color: "bg-teal-500", txtColor: "text-teal-600 dark:text-teal-400" },
                          { label: "B1 Intermediate", val: stats.B1, color: "bg-sky-500", txtColor: "text-sky-600 dark:text-sky-400" },
                          { label: "B2 Upper-Int", val: stats.B2, color: "bg-indigo-500", txtColor: "text-indigo-600 dark:text-indigo-400" },
                          { label: "C1/C2 Advanced", val: stats["C1/C2"], color: "bg-purple-500", txtColor: "text-purple-600 dark:text-purple-400" }
                        ].map((category) => {
                          const pct = stats.Total > 0 ? Math.round((category.val / stats.Total) * 100) : 0;
                          return (
                            <div key={category.label} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-850/60 text-center space-y-1">
                              <span className="text-[9.5px] font-bold text-gray-400 block leading-tight">{category.label}</span>
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${category.color} shrink-0`} />
                                <span className={`text-xs font-mono font-black ${category.txtColor}`}>{pct}%</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono block">({category.val} words)</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Cumulative bar list */}
                      {stats.Total > 0 && (
                        <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                          <div className="bg-green-500 h-full" style={{ width: `${(stats.A1 / stats.Total) * 100}%` }} title={`A1: ${stats.A1} words`} />
                          <div className="bg-teal-500 h-full" style={{ width: `${(stats.A2 / stats.Total) * 100}%` }} title={`A2: ${stats.A2} words`} />
                          <div className="bg-sky-500 h-full" style={{ width: `${(stats.B1 / stats.Total) * 100}%` }} title={`B1: ${stats.B1} words`} />
                          <div className="bg-indigo-500 h-full" style={{ width: `${(stats.B2 / stats.Total) * 100}%` }} title={`B2: ${stats.B2} words`} />
                          <div className="bg-purple-500 h-full" style={{ width: `${(stats["C1/C2"] / stats.Total) * 100}%` }} title={`C1/C2: ${stats["C1/C2"]} words`} />
                        </div>
                      )}
                    </div>

                    {/* Word highlighting board */}
                    <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs leading-relaxed font-sans select-all selection:bg-indigo-150 dark:selection:bg-indigo-950 max-h-52 overflow-y-auto">
                      {tokens.map((tk, idx) => {
                        const isWord = /^[a-zA-Z0-9'-]+$/.test(tk);
                        if (!isWord) {
                          return <span key={idx} className="whitespace-pre-wrap">{tk}</span>;
                        }
                        const level = getCefrLevel(tk);
                        let badgeColor = "hover:underline cursor-pointer decoration-2 transition-all duration-150 ";
                        if (level === "A1") badgeColor += "text-green-600 dark:text-green-400 decoration-green-400 font-semibold";
                        else if (level === "A2") badgeColor += "text-teal-600 dark:text-teal-400 decoration-teal-400 font-semibold";
                        else if (level === "B1") badgeColor += "text-sky-600 dark:text-sky-400 decoration-sky-400 font-semibold";
                        else if (level === "B2") badgeColor += "text-indigo-600 dark:text-indigo-400 decoration-indigo-400 font-semibold";
                        else badgeColor += "text-purple-600 dark:text-purple-400 decoration-purple-400 font-semibold";

                        return (
                          <span
                            key={idx}
                            onClick={() => {
                              // Set dictionary search lookup
                              setCefrActiveSubTab("lookup");
                              setLookupQuery(tk);
                            }}
                            className={badgeColor}
                            title={`${tk}: Level ${getCefrName(level)} (Click to view CEFR breakdown & star)`}
                          >
                            {tk}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (
                <div className="p-5 text-center bg-slate-50/50 dark:bg-slate-950/30 rounded-xl space-y-1.5">
                  <Sparkles className="h-5 w-5 text-indigo-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant Academic Analyzer</p>
                  <p className="text-[10.5px] text-slate-450 max-w-sm mx-auto">
                    Paste any scientific passage, research paper draft, or general text to analyze its CEFR lexical profile. Words will be color-coded dynamically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-3xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search words, definitions, concepts or phrases..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 placeholder-slate-400 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
          </div>

          {/* Type filters */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden transition-colors"
            >
              <option value="all">All Category Types</option>
              <option value="word">Vocabulary Words ONLY</option>
              <option value="phrase">Phrases / Collocations</option>
              <option value="pattern">Syntax structures</option>
            </select>
          </div>

          {/* Mastery filter */}
          <div className="md:col-span-2">
            <select
              value={filterMastery}
              onChange={(e: any) => setFilterMastery(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden transition-colors"
            >
              <option value="all">All Mastery States</option>
              <option value="mastered">Mastered Only</option>
              <option value="learning">Still Learning</option>
            </select>
          </div>

          {/* Leitner Box filter */}
          <div className="md:col-span-2">
            <select
              value={filterBox === null ? "" : String(filterBox)}
              onChange={(e) => setFilterBox(e.target.value === "" ? null : Number(e.target.value))}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden transition-colors"
            >
              <option value="">All Leitner Levels</option>
              <option value="1">Box 1 (Hardest / Reset)</option>
              <option value="2">Box 2 (Unfamiliar)</option>
              <option value="3">Box 3 (Consolidating)</option>
              <option value="4">Box 4 (Recall Safe)</option>
              <option value="5">Box 5 (Perfect Mastery)</option>
            </select>
          </div>
        </div>

        {/* Clear active filter tag bar */}
        {(searchTerm || filterType !== "all" || filterMastery !== "all" || filterBox !== null) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-850 text-[10px]">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Active Filters:</span>
            {searchTerm && (
              <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded px-2 py-0.5 border border-gray-200 dark:border-slate-750 flex items-center gap-1">
                Query: "{searchTerm}"
                <X className="h-3 w-3 text-slate-450 hover:text-slate-700 cursor-pointer" onClick={() => setSearchTerm("")} />
              </span>
            )}
            {filterType !== "all" && (
              <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded px-2 py-0.5 border border-gray-200 dark:border-slate-750 flex items-center gap-1">
                Category: {filterType}
                <X className="h-3 w-3 text-slate-450 hover:text-slate-700 cursor-pointer" onClick={() => setFilterType("all")} />
              </span>
            )}
            {filterMastery !== "all" && (
              <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded px-2 py-0.5 border border-gray-200 dark:border-slate-750 flex items-center gap-1">
                Mastery: {filterMastery}
                <X className="h-3 w-3 text-slate-450 hover:text-slate-700 cursor-pointer" onClick={() => setFilterMastery("all")} />
              </span>
            )}
            {filterBox !== null && (
              <span className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded px-2 py-0.5 border border-gray-200 dark:border-slate-750 flex items-center gap-1">
                Level: Box {filterBox}
                <X className="h-3 w-3 text-slate-450 hover:text-slate-700 cursor-pointer" onClick={() => setFilterBox(null)} />
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterMastery("all");
                setFilterBox(null);
              }}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold ml-auto font-mono underline"
            >
              Clear All Filtering
            </button>
          </div>
        )}
      </div>

      {/* Grid of Results */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-16 text-center space-y-3 transition-colors">
          <Bookmark className="h-8 w-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">No matching items found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting search terms, toggling different parts of speech, or resetting Leitner box filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((x) => {
            const isMastered = masteredIds.has(x.id);
            const userNote = studyNotes[x.id] || "";
            const isEditing = editingId === x.id;

            return (
              <div
                key={x.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 space-y-3.5 shadow-2xs hover:shadow-xs hover:border-gray-300 dark:hover:border-slate-700 transition-all ${
                  isMastered ? "ring-2 ring-emerald-500/20 dark:ring-emerald-500/30 border-emerald-100 dark:border-emerald-900/60" : "border-gray-200 dark:border-slate-800"
                }`}
              >
                {/* Header item */}
                <div className="flex items-start justify-between gap-3">
                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="text-sm font-extrabold font-display text-slate-900 dark:text-slate-100 truncate">
                        {x.item}
                      </h4>
                      <span className="text-[9px] uppercase font-bold tracking-wider font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-650 dark:text-slate-400 border border-gray-200 dark:border-slate-750 shrink-0">
                        {x.part_of_speech || x.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {/* Leitner Box dots */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 w-1.5 rounded-full ${
                              idx <= x.box
                                ? x.box === 1
                                  ? "bg-red-400"
                                  : x.box <= 3
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                                : "bg-gray-200 dark:bg-slate-850"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9.5px] font-bold font-mono text-slate-400 dark:text-slate-500">
                        Box {x.box} Status
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleMastered(x.id)}
                    className={`shrink-0 p-1 rounded-lg border transition-all cursor-pointer ${
                      isMastered
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                        : "bg-slate-50 hover:bg-slate-100 border-gray-200 text-slate-400 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700"
                    }`}
                    title={isMastered ? "Unmark as Mastered" : "Mark as Mastered"}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>

                {/* Definitions */}
                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-slate-200 leading-normal">
                    {x.definition_en}
                  </p>
                </div>

                {/* Usage Frequency visual analysis */}
                {(() => {
                  const freq = getFrequencyMetrics(x.item, x.type, rawText, data.meta_data.target_level);
                  return (
                    <div className="space-y-2.5 p-3 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-505 flex items-center gap-1 font-mono">
                          <BarChart3 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>Usage Frequency Profile</span>
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${freq.densityBadge.color}`}>
                          {freq.densityBadge.text}
                        </span>
                      </div>

                      {/* Side-by-side comparison visualization */}
                      <div className="space-y-2">
                        {/* Current text sample bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Analyzed Corpus Density:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {freq.occurrences} {freq.occurrences === 1 ? 'time' : 'times'} ({freq.currentPmw} PMW)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-805 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                              style={{ width: `${freq.corpusBarPct}%` }}
                            />
                          </div>
                        </div>

                        {/* General Academic English comparison bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">General Academic Benchmark:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {freq.academicPmw} PMW ({freq.academicLabel} Freq)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-805 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500" 
                              style={{ width: `${freq.academicBarPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500 pt-1 border-t border-gray-150/40 dark:border-slate-850/40 flex flex-wrap items-center justify-between gap-1.5">
                        <span>Standardized units express occurrences per million words (PMW).</span>
                        {freq.occurrences > 0 && freq.ratio > 0 && (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Locally matches {freq.ratio}x normal academic density.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Example blocks */}
                <div className="bg-slate-50/70 dark:bg-slate-950/55 p-3 rounded-xl border border-gray-150/60 dark:border-slate-850/50 space-y-2 mt-2 text-xs">
                  {x.contextual_sentence && (
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Occurrence in original text</span>
                      <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-medium mt-0.5">
                        "{x.contextual_sentence}"
                      </p>
                    </div>
                  )}
                  {x.academic_example && (
                    <div className="border-t border-gray-150 dark:border-slate-850 pt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Academic Output Example</span>
                      <p className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed mt-0.5">
                        {x.academic_example}
                      </p>
                    </div>
                  )}
                </div>

                {/* Custom note manager */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-850 text-xs">
                  {isEditing ? (
                    <div className="space-y-1.5 pt-1">
                      <textarea
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        placeholder="Write dynamic private notes, translation memory tips, or custom mnemonics..."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-hidden text-xs"
                        rows={2}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-[10px] text-gray-500 hover:text-slate-700 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(x.id)}
                          className="px-2.5 py-1 text-[10px] bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 font-bold rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Save className="h-3 w-3" />
                          Save Detail
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 pt-1">
                      <div className="min-w-0">
                        {userNote ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block font-mono">My Study Notes</span>
                            <p className="text-slate-750 dark:text-slate-350 font-sans italic leading-relaxed text-[11px]">
                              {userNote}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No custom notes. Add notes for exam preparation.</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-850/60 mt-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveModalTab("explanation");
                              handleShowExplanation(x);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100/60 hover:border-indigo-200 dark:border-indigo-900/30 flex items-center gap-1 cursor-pointer font-extrabold transition-all text-[9.5px]"
                            title="View dynamic AI-generated linguistic analysis"
                          >
                            <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span>Show Explanation</span>
                          </button>

                          <button
                            onClick={() => handleShowVisualAid(x)}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 px-2 py-1 bg-amber-50/50 dark:bg-amber-955/20 rounded-lg border border-amber-100/60 hover:border-amber-200 dark:border-amber-900/30 flex items-center gap-1 cursor-pointer font-extrabold transition-all text-[9.5px]"
                            title="Generate/view visual memory aid image for cognitive retention"
                          >
                            <Image className="h-3 w-3 text-amber-500 shrink-0" />
                            <span>Visual Aid</span>
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setEditingId(x.id);
                            setEditingNote(userNote);
                          }}
                          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-sm shrink-0 flex items-center gap-0.5 cursor-pointer"
                          title="Add/Edit Study Memory Note"
                        >
                          <Edit className="h-3 w-3" />
                          <span className="text-[9px] font-bold uppercase tracking-tight hidden sm:inline">Add Note</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Explanation Modal */}
      {isExplainModalOpen && activeExplainItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 animate-out fade-out">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl transition-all scale-in duration-200 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                     AI Linguistic Lens
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Linguistic Analysis for <span className="text-indigo-600 dark:text-indigo-400 font-display">"{activeExplainItem.item}"</span>
                </h3>
              </div>
              <button
                onClick={() => setIsExplainModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-850 dark:hover:text-slate-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-150 dark:border-slate-800 bg-slate-50/25 dark:bg-slate-955/10 px-4 shrink-0 select-none">
              <button
                onClick={() => setActiveModalTab("explanation")}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                  activeModalTab === "explanation"
                    ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Linguistic Breakdown</span>
              </button>
              {/* Visual Aid tab hidden — image generation not available with current AI provider */}
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm select-text flex-1">
              {activeModalTab === "explanation" ? (
                // --- EXPLANATION TAB CONTENT ---
                explainLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">Querying AI Grammar Core...</p>
                      <p className="text-[11px] text-slate-450 max-w-xs">Extracting registration checks, contextual nuances, collocation profiles, and exam mnemonics.</p>
                    </div>
                  </div>
                ) : explainError ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/10">
                      <Info className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-red-650 dark:text-red-400">Explanation Service Interrupted</p>
                      <p className="text-[11px] text-slate-450">{explainError}</p>
                    </div>
                    <button
                      onClick={() => handleShowExplanation(activeExplainItem)}
                      className="px-3.5 py-1.5 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Retry Generation
                    </button>
                  </div>
                ) : explanations[activeExplainItem.id] ? (() => {
                  const exp = explanations[activeExplainItem.id];
                  return (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Item context banner */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-150/70 dark:border-slate-850/60 space-y-1 text-xs shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 capitalize font-mono">
                            {activeExplainItem.part_of_speech || activeExplainItem.type}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-350" />
                          <span className="text-slate-500 dark:text-slate-450 leading-relaxed italic">
                            "{activeExplainItem.definition_en}"
                          </span>
                        </div>
                      </div>

                      {/* Nuance Section */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 flex items-center gap-1.5 font-mono">
                          <Brain className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Semantic Nuance & Registries</span>
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-amber-50/20 dark:bg-amber-955/10 p-3.5 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                          {exp.nuance_explanation}
                        </p>
                      </div>

                      {/* Collocations */}
                      {exp.collocation_suggestions?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 flex items-center gap-1.5 font-mono">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Natural Collocations & Usage</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {exp.collocation_suggestions.map((colloc, idx) => (
                              <span
                                key={idx}
                                className="text-[10.5px] font-bold bg-emerald-50/50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-100/60 dark:border-emerald-900/30"
                              >
                                {colloc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pitfalls */}
                      {exp.common_pitfalls?.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 flex items-center gap-1.5 font-mono">
                            <HelpCircle className="h-3.5 w-3.5 text-red-500" />
                            <span>Deceptive Pitfalls to Avoid</span>
                          </h4>
                          <ul className="space-y-1.5">
                            {exp.common_pitfalls.map((pitfall, idx) => (
                              <li key={idx} className="text-xs text-red-650 dark:text-red-450 flex items-start gap-2 leading-relaxed bg-red-50/10 dark:bg-red-955/5 p-2 rounded-lg border border-red-100/10 dark:border-red-900/5">
                                <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
                                <span>{pitfall}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Quick memory tips/Mnemonic */}
                      {exp.tip && (
                        <div className="p-4 rounded-xl bg-indigo-50/35 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
                            <Lightbulb className="h-4 w-4 animate-bounce text-yellow-500 shrink-0" />
                            <span>Linguistic Exam/Study Hack</span>
                          </div>
                          <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed italic">
                            "{exp.tip}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    Could not retrieve analysis details.
                  </div>
                )
              ) : (
                // --- VISUAL AID TAB CONTENT ---
                visualLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center">
                    <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                    <div className="space-y-1 block">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-250">Designing Cognitive Vector Aid...</p>
                      <p className="text-[11px] text-slate-450 max-w-xs mx-auto leading-relaxed mt-1">Connecting to Imagen 3.0 to construct an original, distraction-free visual memory retention model of "{activeExplainItem.item}".</p>
                    </div>
                  </div>
                ) : visualError ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/10">
                      <Info className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-red-650 dark:text-red-400">Visual Composer Interrupted</p>
                      <p className="text-[11px] text-slate-450">{visualError}</p>
                    </div>
                    <button
                      onClick={() => generateVisualAid(activeExplainItem)}
                      className="px-3.5 py-1.5 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Retry Generation
                    </button>
                  </div>
                ) : visualAids[activeExplainItem.id] ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="relative rounded-2xl overflow-hidden border border-gray-150 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center max-w-sm mx-auto aspect-square group shadow-md transition-all hover:shadow-lg">
                      <img
                        src={visualAids[activeExplainItem.id]}
                        alt={`Dynamic memory illustration for ${activeExplainItem.item}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover select-none"
                      />
                      
                      <div className="absolute top-2 right-2 bg-slate-900/70 dark:bg-slate-950/85 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider font-extrabold uppercase text-amber-400 text-center select-none backdrop-blur-xs">
                        Imagen 3.0 Mnemonic
                      </div>
                    </div>

                    {/* Show generated prompt so the user learns the visual symbolism */}
                    {visualPrompts[activeExplainItem.id] && (
                      <div className="p-4 rounded-xl bg-amber-50/20 dark:bg-amber-955/10 border border-amber-100/50 dark:border-amber-900/20 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-750 dark:text-amber-400">
                          <Eye className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>Cognitive Image Metaphor & Composition</span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-350 leading-relaxed italic">
                          "{visualPrompts[activeExplainItem.id]}"
                        </p>
                      </div>
                    )}

                    <div className="text-center px-4">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block leading-relaxed">
                        Visual association acts as a key semantic peg for the dual-coding memory rule
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 italic">
                    Could not retrieve visual aid. Please try again.
                  </div>
                )
              )}
            </div>

            {/* Sticky Modal Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50/30 dark:bg-slate-950/10">
              <button
                onClick={() => setIsExplainModalOpen(false)}
                className="px-4 py-2 bg-slate-955 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-extrabold rounded-xl shadow-3xs cursor-pointer transition-colors"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

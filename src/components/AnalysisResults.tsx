import React, { useState } from "react";
import { CorpusAnalysisResult, VocabularyBlock, PhraseBlock, SentencePattern } from "../types";
import { API_BASE } from "../config";
import { BookOpen, HelpCircle, Layers, Quote, ArrowRight, Play, Check, Edit3, Trash2, Save, Plus, Search, X } from "lucide-react";

interface AnalysisResultsProps {
  data: CorpusAnalysisResult;
  onUpdate: (updatedData: CorpusAnalysisResult) => void;
}

export default function AnalysisResults({ data, onUpdate }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<"words" | "phrases" | "patterns">("words");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPOS, setSelectedPOS] = useState("all");

  // Dictionary Lookup State & Hooks
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const triggerLookup = async (word: string) => {
    const cleaned = word.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"'“‘”’]+|[.,\/#!$%\^&\*;:{}=\-_`~()?"'“‘”’]+$/g, "").trim();
    if (!cleaned || cleaned.length < 2) return;

    setLookupWord(cleaned);
    setIsLookupLoading(true);
    setLookupError(null);
    setLookupData(null);

    try {
      const response = await fetch(`${API_BASE}/api/dictionary-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleaned }),
      });
      if (!response.ok) {
        throw new Error("Failed to retrieve definition details.");
      }
      const val = await response.json();
      setLookupData(val);
    } catch (err: any) {
      console.error(err);
      setLookupError("Unable to fetch definitions for this term dynamically. Please check your connection.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const makeTextClickable = (text: string) => {
    if (!text) return "";
    const segments = text.split(/(\s+)/);
    return segments.map((chunk, idx) => {
      if (/^\s+$/.test(chunk)) {
        return chunk;
      }
      const cleaned = chunk.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"'“‘”’]+|[.,\/#!$%\^&\*;:{}=\-_`~()?"'“‘”’]+$/g, "").trim();
      if (!cleaned || cleaned.length < 2) {
        return chunk;
      }
      return (
        <span
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            triggerLookup(cleaned);
          }}
          className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 px-0.5 rounded transition-all duration-150 underline decoration-dotted decoration-gray-300 dark:decoration-slate-700 hover:decoration-emerald-500 font-medium select-none"
          title={`Click to look up "${cleaned}"`}
        >
          {chunk}
        </span>
      );
    });
  };

  const normalizePOS = (pos: string): string => {
    if (!pos) return "Other";
    const p = pos.toLowerCase().trim();
    if (p.includes("noun") || p === "n" || p.startsWith("n.")) return "Noun";
    if (p.includes("verb") || p === "v" || p.startsWith("v.")) return "Verb";
    if (p.includes("adj") || p.startsWith("adj.")) return "Adjective";
    if (p.includes("adv") || p.startsWith("adv.")) return "Adverb";
    if (p.includes("prep") || p.startsWith("prep.")) return "Preposition";
    if (p.includes("conj") || p.startsWith("conj.")) return "Conjunction";
    return "Other";
  };

  const getPhrasePOS = (phrase: string): string => {
    const words = phrase.toLowerCase().trim().split(/\s+/);
    if (words.length === 0) return "Other Phrase";
    
    const prepositions = ["in", "on", "at", "by", "with", "for", "from", "of", "to", "under", "through", "ahead", "according", "due", "because", "upon", "out", "over"];
    if (prepositions.includes(words[0])) {
      return "Prepositional Phrase";
    }
    
    const commonVerbs = ["take", "bear", "make", "have", "do", "get", "give", "go", "keep", "set", "run", "play", "bring", "come", "find", "hold", "show", "turn", "call"];
    const containsVerb = words.some(w => commonVerbs.includes(w) || w.endsWith("ing") || w.endsWith("ed") || w.endsWith("es") || w.endsWith("s"));
    if (containsVerb) {
      return "Verb Phrase / Collocation";
    }
    
    return "Noun Phrase / Expression";
  };

  // For inline adding items
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newPOS, setNewPOS] = useState("n.");
  const [newDef, setNewDef] = useState("");
  const [newContext, setNewContext] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newPurpose, setNewPurpose] = useState("");

  // Speech helper
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Utility to highlight target item in contextual sentence
  const highlightMatch = (sentence: string, target: string) => {
    if (!sentence || !target) return sentence || "";
    try {
      const parts = sentence.split(new RegExp(`(${target})`, "gi"));
      return (
        <>
          {parts.map((part, index) =>
            part.toLowerCase() === target.toLowerCase() ? (
              <mark 
                key={index} 
                onClick={(e) => { e.stopPropagation(); triggerLookup(part); }}
                className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-200 text-gray-900 border-b-2 border-amber-500 px-0.5 rounded-sm font-semibold cursor-pointer select-none transition-colors"
                title={`Click to look up "${part}"`}
              >
                {part}
              </mark>
            ) : (
              makeTextClickable(part)
            )
          )}
        </>
      );
    } catch {
      return makeTextClickable(sentence);
    }
  };

  // Edit item inline handlers
  const handleStartEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSaveWord = (id: string, updatedFields: Partial<VocabularyBlock>) => {
    const updated = data.vocabulary_blocks.map((v) => (v.id === id ? { ...v, ...updatedFields } : v));
    onUpdate({ ...data, vocabulary_blocks: updated });
    setEditingId(null);
  };

  const handleSavePhrase = (id: string, updatedFields: Partial<PhraseBlock>) => {
    const updated = data.phrase_blocks.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    onUpdate({ ...data, phrase_blocks: updated });
    setEditingId(null);
  };

  const handleSavePattern = (id: string, updatedFields: Partial<SentencePattern>) => {
    const updated = data.sentence_patterns.map((s) => (s.id === id ? { ...s, ...updatedFields } : s));
    onUpdate({ ...data, sentence_patterns: updated });
    setEditingId(null);
  };

  const handleDeleteItem = (id: string, type: "word" | "phrase" | "pattern") => {
    if (type === "word") {
      const updated = data.vocabulary_blocks.filter((v) => v.id !== id);
      onUpdate({ ...data, vocabulary_blocks: updated });
    } else if (type === "phrase") {
      const updated = data.phrase_blocks.filter((p) => p.id !== id);
      onUpdate({ ...data, phrase_blocks: updated });
    } else {
      const updated = data.sentence_patterns.filter((s) => s.id !== id);
      onUpdate({ ...data, sentence_patterns: updated });
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !newDef.trim()) return;

    const id = `${activeTab === "words" ? "v" : activeTab === "phrases" ? "p" : "s"}-${Date.now()}`;

    if (activeTab === "words") {
      const newWord: VocabularyBlock = {
        id,
        type: "word",
        item: newItemText,
        part_of_speech: newPOS,
        definition_en: newDef,
        contextual_sentence: newContext || "Created item.",
        academic_example: newExample || "This is a model generated academic sentence."
      };
      onUpdate({
        ...data,
        vocabulary_blocks: [...data.vocabulary_blocks, newWord]
      });
    } else if (activeTab === "phrases") {
      const newPhrase: PhraseBlock = {
        id,
        type: "phrase_collocation_idiom",
        item: newItemText,
        definition_en: newDef,
        contextual_sentence: newContext || "Created item.",
        academic_example: newExample || "This is a model generated academic sentence."
      };
      onUpdate({
        ...data,
        phrase_blocks: [...data.phrase_blocks, newPhrase]
      });
    } else {
      const newPattern: SentencePattern = {
        id,
        type: "pattern",
        pattern_structure: newItemText,
        functional_purpose: newPurpose || "Rhetorical device",
        contextual_sentence: newContext || "Created structure.",
        academic_example: newExample || "This is a pattern-based academic sentence."
      };
      onUpdate({
        ...data,
        sentence_patterns: [...data.sentence_patterns, newPattern]
      });
    }

    // Reset Form
    setNewItemText("");
    setNewDef("");
    setNewPOS("n.");
    setNewContext("");
    setNewExample("");
    setNewPurpose("");
    setShowAddForm(false);
  };

  // Filtered lists based on search query and optional part of speech filter
  const filteredWords = data.vocabulary_blocks?.filter((block) => {
    // 1. Filter by selected part of speech
    if (selectedPOS !== "all") {
      const normalizedBlockPOS = normalizePOS(block.part_of_speech);
      if (normalizedBlockPOS !== selectedPOS) {
        return false;
      }
    }

    // 2. Filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      block.item.toLowerCase().includes(query) ||
      block.definition_en.toLowerCase().includes(query) ||
      block.part_of_speech.toLowerCase().includes(query) ||
      block.contextual_sentence.toLowerCase().includes(query)
    );
  }) || [];

  const filteredPhrases = data.phrase_blocks?.filter((block) => {
    // 1. Filter by selected phrase category
    if (selectedPOS !== "all") {
      const pPOS = getPhrasePOS(block.item);
      if (pPOS !== selectedPOS) {
        return false;
      }
    }

    // 2. Filter by search query
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      block.item.toLowerCase().includes(query) ||
      block.definition_en.toLowerCase().includes(query) ||
      block.contextual_sentence.toLowerCase().includes(query)
    );
  }) || [];

  const filteredPatterns = data.sentence_patterns?.filter((block) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      block.pattern_structure.toLowerCase().includes(query) ||
      block.functional_purpose.toLowerCase().includes(query) ||
      block.contextual_sentence.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Corpus Meta Dashboard */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider font-mono px-2 py-0.5 rounded bg-emerald-600 text-white leading-none">
              {data.meta_data.target_level} TARGET
            </span>
            <span className="text-xs text-gray-500 font-medium">Category: {data.meta_data.category}</span>
          </div>
          <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">
            {data.meta_data.title}
          </h3>
          <p className="text-xs text-slate-500 italic">
            Source: {data.meta_data.source}
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 font-mono self-start md:self-center bg-white px-4 py-2.5 rounded-lg border border-slate-100 divide-x divide-gray-150">
          <div className="pr-4 text-center">
            <span className="block text-gray-400 text-[10px] uppercase font-semibold">Words Extracted</span>
            <span className="text-base font-bold text-emerald-600">{data.vocabulary_blocks?.length || 0}</span>
          </div>
          <div className="px-4 text-center">
            <span className="block text-gray-400 text-[10px] uppercase font-semibold">Phrases / Idioms</span>
            <span className="text-base font-bold text-indigo-600">{data.phrase_blocks?.length || 0}</span>
          </div>
          <div className="pl-4 text-center">
            <span className="block text-gray-400 text-[10px] uppercase font-semibold">Syntax Patterns</span>
            <span className="text-base font-bold text-amber-600">{data.sentence_patterns?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs for categories */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-gray-200 pb-px gap-3">
        <div className="flex border-b sm:border-none border-gray-200">
          <button
            onClick={() => { setActiveTab("words"); setShowAddForm(false); setSearchQuery(""); setSelectedPOS("all"); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all leading-none ${
              activeTab === "words"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Core Academic Words
          </button>
          <button
            onClick={() => { setActiveTab("phrases"); setShowAddForm(false); setSearchQuery(""); setSelectedPOS("all"); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all leading-none ${
              activeTab === "phrases"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Layers className="h-4 w-4" />
            Phrases & Collocations
          </button>
          <button
            onClick={() => { setActiveTab("patterns"); setShowAddForm(false); setSearchQuery(""); setSelectedPOS("all"); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all leading-none ${
              activeTab === "patterns"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Quote className="h-4 w-4" />
            Productive Patterns
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 self-end sm:self-center text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom Item
        </button>
      </div>

      {/* Add Custom Item Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Add New {activeTab === "words" ? "Vocabulary Word" : activeTab === "phrases" ? "Phrase/Collocation" : "Sentence Pattern"}
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className={activeTab === "words" ? "md:col-span-8" : "md:col-span-12"}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {activeTab === "words" ? "Word / Lemma" : activeTab === "phrases" ? "Lexical Phrase" : "Pattern Formula"}
              </label>
              <input
                type="text"
                required
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder={activeTab === "words" ? "e.g., profound" : activeTab === "phrases" ? "e.g., bear in mind" : "e.g., An advantage of [X] lies in [Y]"}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              />
            </div>

            {activeTab === "words" && (
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">Part of Speech</label>
                <input
                  type="text"
                  required
                  value={newPOS}
                  onChange={(e) => setNewPOS(e.target.value)}
                  placeholder="e.g. adjective, v., n."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {activeTab === "patterns" ? "Functional Purpose" : "Pedagogical Definition / Meaning"}
            </label>
            <input
              type="text"
              required
              value={activeTab === "patterns" ? newPurpose : newDef}
              onChange={(e) => activeTab === "patterns" ? setNewPurpose(e.target.value) : setNewDef(e.target.value)}
              placeholder={activeTab === "patterns" ? "e.g., Illustrating comparative benefits" : "e.g., Deep, absolute, or philosophically intense"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contextual Sentence (Exact Source)</label>
              <textarea
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                rows={2}
                placeholder="Where does this appear in your text?"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Academic Reinforcement Example</label>
              <textarea
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                rows={2}
                placeholder="Create a model student sentence..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            Save Item to Dataset
          </button>
        </form>
      )}

      {/* Real-time Search and POS Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 shadow-3xs space-y-3.5 transition-colors">
        <div className="flex flex-col lg:flex-row gap-3.5 lg:items-center">
          {/* Search bar */}
          <div className="relative flex-1 flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10 transition-all duration-150">
            <Search className="h-4 w-4 text-gray-450 ml-3.5 shrink-0" />
            <input
              id="search-filter-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === "words" ? "words, POS, or definitions" : activeTab === "phrases" ? "phrases or meaning" : "sentence patterns and purpose"}...`}
              className="w-full pl-2.5 pr-8 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-hidden placeholder-gray-400 bg-transparent border-0"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Part of Speech / Classification Filter Dropdown */}
          {(activeTab === "words" || activeTab === "phrases") && (
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono select-none">
                Filter by {activeTab === "words" ? "Part of Speech" : "Phrase Category"}:
              </span>
              <select
                id="pos-filter-select"
                value={selectedPOS}
                onChange={(e) => setSelectedPOS(e.target.value)}
                className="py-2 pl-3 pr-8 text-xs bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 transition-colors"
              >
                <option value="all">All Items</option>
                {activeTab === "words" ? (
                  <>
                    <option value="Noun">Nouns (n.)</option>
                    <option value="Verb">Verbs (v.)</option>
                    <option value="Adjective">Adjectives (adj.)</option>
                    <option value="Adverb">Adverbs (adv.)</option>
                    <option value="Preposition">Prepositions (prep.)</option>
                    <option value="Conjunction">Conjunctions (conj.)</option>
                    <option value="Other">Other Category Types</option>
                  </>
                ) : (
                  <>
                    <option value="Prepositional Phrase">Prepositional Phrases</option>
                    <option value="Verb Phrase / Collocation">Verb Phrases & Collocations</option>
                    <option value="Noun Phrase / Expression">Noun Phrases & Expressions</option>
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Selected Filter Tags and Indicators */}
        {(searchQuery || (selectedPOS !== "all" && (activeTab === "words" || activeTab === "phrases"))) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-gray-100 dark:border-slate-850 text-[10px]">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider select-none">Active Filters:</span>
            {searchQuery && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold rounded px-2 py-0.5 border border-gray-200 dark:border-slate-750 flex items-center gap-1">
                Query: "{searchQuery}"
                <X className="h-3 w-3 text-slate-450 hover:text-slate-700 cursor-pointer" onClick={() => setSearchQuery("")} />
              </span>
            )}
            {selectedPOS !== "all" && (activeTab === "words" || activeTab === "phrases") && (
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1">
                Category: {selectedPOS}
                <X className="h-3 w-3 text-emerald-400 hover:text-emerald-600 cursor-pointer" onClick={() => setSelectedPOS("all")} />
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedPOS("all");
              }}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold ml-auto font-mono underline cursor-pointer"
            >
              Clear Filtering
            </button>
          </div>
        )}
      </div>

      {/* Item Blocks Grid */}
      <div className="space-y-4">
        {activeTab === "words" && (
          <>
            {data.vocabulary_blocks?.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No vocabulary items extracted for this target level. Try adjusting target metrics.</div>
            ) : filteredWords.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                🔍 No vocabulary words match your search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWords.map((block) => {
                  const isEditing = editingId === block.id;
                  return (
                    <div
                      key={block.id}
                      className="bg-white rounded-xl border border-emerald-100 hover:border-emerald-200 shadow-xs hover:shadow-md transition-all duration-200 p-5 relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Left color bar decorator */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500"></div>

                      <div className="pl-2 space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2.5">
                          {isEditing ? (
                            <div className="flex gap-2 items-center w-full">
                              <input
                                type="text"
                                defaultValue={block.item}
                                id={`edit-item-${block.id}`}
                                className="font-semibold text-gray-900 px-2 py-0.5 border rounded-md text-base w-32"
                              />
                              <input
                                type="text"
                                defaultValue={block.part_of_speech}
                                id={`edit-pos-${block.id}`}
                                className="font-mono text-[10px] uppercase tracking-wider text-slate-500 px-2 py-0.5 border rounded"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <h4 
                                onClick={() => triggerLookup(block.item)}
                                className="text-lg font-display font-bold text-slate-900 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors border-b border-dashed border-transparent hover:border-emerald-500"
                                title={`Click to look up "${block.item}"`}
                              >
                                {block.item}
                              </h4>
                              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {block.part_of_speech}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 no-print">
                            <button
                              onClick={() => handleSpeak(block.item)}
                              className="p-1 px-1.5 text-[10px] font-mono text-emerald-600 hover:bg-emerald-50 rounded flex items-center gap-1 cursor-pointer"
                              title="Listen to pronunciation"
                            >
                              <Play className="h-3 w-3 fill-emerald-600" />
                              PRON
                            </button>

                            {isEditing ? (
                              <button
                                onClick={() => {
                                  const itemVal = (document.getElementById(`edit-item-${block.id}`) as HTMLInputElement)?.value;
                                  const posVal = (document.getElementById(`edit-pos-${block.id}`) as HTMLInputElement)?.value;
                                  const defVal = (document.getElementById(`edit-def-${block.id}`) as HTMLInputElement)?.value;
                                  const contextVal = (document.getElementById(`edit-context-${block.id}`) as HTMLTextAreaElement)?.value;
                                  const exampleVal = (document.getElementById(`edit-example-${block.id}`) as HTMLTextAreaElement)?.value;
                                  handleSaveWord(block.id, {
                                    item: itemVal,
                                    part_of_speech: posVal,
                                    definition_en: defVal,
                                    contextual_sentence: contextVal,
                                    academic_example: exampleVal
                                  });
                                }}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(block.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteItem(block.id, "word")}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Definition */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Definition EN</span>
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={block.definition_en}
                              id={`edit-def-${block.id}`}
                              className="w-full px-2 py-1 border text-sm rounded-md"
                            />
                          ) : (
                            <p className="text-sm text-slate-700 leading-relaxed font-sans">{makeTextClickable(block.definition_en)}</p>
                          )}
                        </div>

                        {/* Context & Example */}
                        <div className="grid grid-cols-1 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              Origin Context
                            </span>
                            {isEditing ? (
                              <textarea
                                defaultValue={block.contextual_sentence}
                                id={`edit-context-${block.id}`}
                                className="w-full px-2 py-1 border text-xs rounded-md"
                                rows={2}
                              />
                            ) : (
                              <p className="text-xs text-slate-600 italic leading-relaxed">
                                "{highlightMatch(block.contextual_sentence, block.item)}"
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              Academic Writer Example
                              <ArrowRight className="h-2.5 w-2.5 text-emerald-500" />
                            </span>
                            {isEditing ? (
                              <textarea
                                defaultValue={block.academic_example}
                                id={`edit-example-${block.id}`}
                                className="w-full px-2 py-1 border text-xs rounded-md"
                                rows={2}
                              />
                            ) : (
                              <p className="text-xs text-slate-900 font-medium leading-relaxed">
                                {makeTextClickable(block.academic_example)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "phrases" && (
          <>
            {data.phrase_blocks?.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No phrases extracted for this target level. Try adjusting target metrics.</div>
            ) : filteredPhrases.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                🔍 No phrases match your search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPhrases.map((block) => {
                  const isEditing = editingId === block.id;
                  return (
                    <div
                      key={block.id}
                      className="bg-white rounded-xl border border-indigo-100 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all duration-200 p-5 relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Left color bar decorator */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500"></div>

                      <div className="pl-2 space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2.5">
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={block.item}
                              id={`edit-item-${block.id}`}
                              className="font-semibold text-gray-900 px-2 py-0.5 border rounded-md text-base w-full"
                            />
                          ) : (
                            <h4 
                              onClick={() => triggerLookup(block.item)}
                              className="text-lg font-display font-bold text-slate-900 leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors border-b border-dashed border-transparent hover:border-indigo-500"
                              title={`Click to look up "${block.item}"`}
                            >
                              {block.item}
                            </h4>
                          )}

                          <div className="flex items-center gap-1.5 no-print">
                            <button
                              onClick={() => handleSpeak(block.item)}
                              className="p-1 px-1.5 text-[10px] font-mono text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-indigo-600" />
                              PRON
                            </button>

                            {isEditing ? (
                              <button
                                onClick={() => {
                                  const itemVal = (document.getElementById(`edit-item-${block.id}`) as HTMLInputElement)?.value;
                                  const defVal = (document.getElementById(`edit-def-${block.id}`) as HTMLInputElement)?.value;
                                  const contextVal = (document.getElementById(`edit-context-${block.id}`) as HTMLTextAreaElement)?.value;
                                  const exampleVal = (document.getElementById(`edit-example-${block.id}`) as HTMLTextAreaElement)?.value;
                                  handleSavePhrase(block.id, {
                                    item: itemVal,
                                    definition_en: defVal,
                                    contextual_sentence: contextVal,
                                    academic_example: exampleVal
                                  });
                                }}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(block.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteItem(block.id, "phrase")}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Definition */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Usage Meaning</span>
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={block.definition_en}
                              id={`edit-def-${block.id}`}
                              className="w-full px-2 py-1 border text-sm rounded-md"
                            />
                          ) : (
                            <p className="text-sm text-slate-700 leading-relaxed font-sans">{makeTextClickable(block.definition_en)}</p>
                          )}
                        </div>

                        {/* Context & Example */}
                        <div className="grid grid-cols-1 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Origin Context</span>
                            {isEditing ? (
                              <textarea
                                defaultValue={block.contextual_sentence}
                                id={`edit-context-${block.id}`}
                                className="w-full px-2 py-1 border text-xs rounded-md"
                                rows={2}
                              />
                            ) : (
                              <p className="text-xs text-slate-600 italic leading-relaxed">
                                "{highlightMatch(block.contextual_sentence, block.item)}"
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              Natural Academic Usage
                              <ArrowRight className="h-2.5 w-2.5 text-indigo-500" />
                            </span>
                            {isEditing ? (
                              <textarea
                                defaultValue={block.academic_example}
                                id={`edit-example-${block.id}`}
                                className="w-full px-2 py-1 border text-xs rounded-md"
                                rows={2}
                              />
                            ) : (
                              <p className="text-xs text-slate-900 font-medium leading-relaxed">
                                {makeTextClickable(block.academic_example)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "patterns" && (
          <>
            {data.sentence_patterns?.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No sentence patterns extracted for this target level. Try adjusting target metrics.</div>
            ) : filteredPatterns.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                🔍 No sentence patterns match your search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPatterns.map((block) => {
                  const isEditing = editingId === block.id;
                  return (
                    <div
                      key={block.id}
                      className="bg-white rounded-xl border border-amber-100 hover:border-amber-200 shadow-xs hover:shadow-md transition-all duration-200 p-5 relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Left color bar decorator */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-500"></div>

                      <div className="pl-2 space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2.5">
                          {isEditing ? (
                            <div className="flex flex-col gap-2 w-full">
                              <input
                                type="text"
                                defaultValue={block.pattern_structure}
                                id={`edit-structure-${block.id}`}
                                className="font-mono text-sm px-2 py-1 border rounded bg-slate-50 w-full"
                              />
                              <input
                                type="text"
                                defaultValue={block.functional_purpose}
                                id={`edit-purpose-${block.id}`}
                                className="text-xs text-amber-800 px-2 py-0.5 border rounded-md"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-mono text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50/50 p-2 rounded-lg border border-amber-100/55 mb-1.5 leading-snug">
                                {block.pattern_structure}
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Purpose: {block.functional_purpose}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 no-print self-start">
                            {isEditing ? (
                              <button
                                onClick={() => {
                                  const structureVal = (document.getElementById(`edit-structure-${block.id}`) as HTMLInputElement)?.value;
                                  const purposeVal = (document.getElementById(`edit-purpose-${block.id}`) as HTMLInputElement)?.value;
                                  const contextVal = (document.getElementById(`edit-context-${block.id}`) as HTMLTextAreaElement)?.value;
                                  const exampleVal = (document.getElementById(`edit-example-${block.id}`) as HTMLTextAreaElement)?.value;
                                  handleSavePattern(block.id, {
                                    pattern_structure: structureVal,
                                    functional_purpose: purposeVal,
                                    contextual_sentence: contextVal,
                                    academic_example: exampleVal
                                  });
                                }}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(block.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteItem(block.id, "pattern")}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Context & Example */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Context In Text</span>
                            {isEditing ? (
                              <textarea
                                defaultValue={block.contextual_sentence}
                                id={`edit-context-${block.id}`}
                                className="w-full px-2 py-1 border text-xs rounded-md"
                                rows={2}
                              />
                            ) : (
                              <p className="text-xs text-slate-600 italic leading-relaxed">
                                "{makeTextClickable(block.contextual_sentence)}"
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-150 pt-3 md:pt-0 md:pl-4">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              Replicable Template Model
                              <ArrowRight className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                            </span>
                            {isEditing ? (
                              <textarea
                                defaultValue={block.academic_example}
                                id={`edit-example-${block.id}`}
                                className="w-full px-2 py-1 border text-xs rounded-md"
                                rows={2}
                              />
                            ) : (
                              <p className="text-xs text-slate-950 font-medium leading-relaxed">
                                {makeTextClickable(block.academic_example)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Real-time Dictionary Lookup Popover / Dialog Overlay */}
      {lookupWord && (
        <div 
          className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 no-print"
          onClick={() => setLookupWord(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-200 transform scale-100 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header portion */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Search className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white capitalize">
                      {lookupWord}
                    </h3>
                    <button
                      onClick={() => handleSpeak(lookupWord)}
                      className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg cursor-pointer transition-colors"
                      title="Listen to pronunciation"
                    >
                      <Play className="h-3.5 w-3.5 fill-emerald-600 dark:fill-emerald-400" />
                    </button>
                  </div>
                  {lookupData && (
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-slate-400 font-mono">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {lookupData.ipa}
                      </span>
                      <span>•</span>
                      <span className="italic">
                        {lookupData.part_of_speech}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setLookupWord(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content portion */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {isLookupLoading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-950 border-t-emerald-500 animate-spin"></div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Consulting Academic Corpus...</p>
                    <p className="text-xs text-gray-400">Fetching definitions, synonyms, and elegant examples.</p>
                  </div>
                </div>
              )}

              {lookupError && (
                <div className="py-8 text-center space-y-4">
                  <div className="inline-flex p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{lookupError}</p>
                  <button
                    onClick={() => triggerLookup(lookupWord)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    Retry Query
                  </button>
                </div>
              )}

              {lookupData && (
                <div className="space-y-5 animate-fade-in">
                  {/* Definition */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Definition & Sense</span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      {makeTextClickable(lookupData.definition)}
                    </p>
                  </div>

                  {/* Synonyms */}
                  {lookupData.synonyms && lookupData.synonyms.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Academic Synonyms & Nuance</span>
                      <div className="space-y-2.5">
                        {lookupData.synonyms.map((syn: any, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => triggerLookup(syn.word)}
                            className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-850 hover:border-emerald-200 dark:hover:border-emerald-950 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 rounded-xl transition-all duration-150 cursor-pointer group flex flex-col gap-1"
                            title={`Look up "${syn.word}"`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {syn.word}
                              </span>
                              <span className="text-[10px] text-emerald-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                click to look up →
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                              {syn.nuance}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {lookupData.examples && lookupData.examples.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Additional Academic Examples</span>
                      <ul className="space-y-2">
                        {lookupData.examples.map((ex: string, i: number) => (
                          <li 
                            key={i} 
                            className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-3.5 border-l-2 border-emerald-500 italic py-0.5 bg-slate-50/50 dark:bg-slate-950/10 p-2.5 rounded-r-lg"
                          >
                            "{makeTextClickable(ex)}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with hint */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border-t border-gray-100 dark:border-slate-800 text-center">
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                Click any word in definitions, synonyms, or examples for recursive corpus lookups.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

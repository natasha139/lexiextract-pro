import React, { useState } from "react";
import { CorpusAnalysisResult, VocabularyBlock, PhraseBlock, SentencePattern } from "../types";
import { Plus, Trash2, CheckCircle, PenLine } from "lucide-react";

interface ManualEntryFormProps {
  onSubmit: (data: CorpusAnalysisResult) => void;
}

type ActiveSection = "words" | "phrases" | "patterns";

function emptyWord(idx: number): VocabularyBlock {
  return { id: `mv${idx}`, type: "word", item: "", part_of_speech: "noun", definition_en: "", contextual_sentence: "", academic_example: "" };
}
function emptyPhrase(idx: number): PhraseBlock {
  return { id: `mp${idx}`, type: "phrase_collocation_idiom", item: "", definition_en: "", contextual_sentence: "", academic_example: "" };
}
function emptyPattern(idx: number): SentencePattern {
  return { id: `ms${idx}`, type: "pattern", pattern_structure: "", functional_purpose: "", contextual_sentence: "", academic_example: "" };
}

export default function ManualEntryForm({ onSubmit }: ManualEntryFormProps) {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [targetLevel, setTargetLevel] = useState("IELTS");
  const [category, setCategory] = useState("");
  const [section, setSection] = useState<ActiveSection>("words");

  const [words, setWords] = useState<VocabularyBlock[]>([emptyWord(0)]);
  const [phrases, setPhrases] = useState<PhraseBlock[]>([emptyPhrase(0)]);
  const [patterns, setPatterns] = useState<SentencePattern[]>([emptyPattern(0)]);

  const updateWord = (i: number, field: keyof VocabularyBlock, val: string) => {
    setWords(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: val } : w));
  };
  const updatePhrase = (i: number, field: keyof PhraseBlock, val: string) => {
    setPhrases(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };
  const updatePattern = (i: number, field: keyof SentencePattern, val: string) => {
    setPatterns(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const addWord = () => setWords(prev => [...prev, emptyWord(prev.length)]);
  const addPhrase = () => setPhrases(prev => [...prev, emptyPhrase(prev.length)]);
  const addPattern = () => setPatterns(prev => [...prev, emptyPattern(prev.length)]);

  const removeWord = (i: number) => setWords(prev => prev.filter((_, idx) => idx !== i));
  const removePhrase = (i: number) => setPhrases(prev => prev.filter((_, idx) => idx !== i));
  const removePattern = (i: number) => setPatterns(prev => prev.filter((_, idx) => idx !== i));

  const validWords = words.filter(w => w.item.trim());
  const validPhrases = phrases.filter(p => p.item.trim());
  const validPatterns = patterns.filter(s => s.pattern_structure.trim());
  const canSubmit = validWords.length + validPhrases.length + validPatterns.length > 0;

  const handleSubmit = () => {
    const data: CorpusAnalysisResult = {
      meta_data: { title: title || "Manual Entry", source: source || "User Input", category: category || "Manual", target_level: targetLevel },
      vocabulary_blocks: validWords,
      phrase_blocks: validPhrases,
      sentence_patterns: validPatterns,
    };
    onSubmit(data);
  };

  const sectionTabs: { id: ActiveSection; label: string; count: number; color: string }[] = [
    { id: "words",    label: "词汇 Words",    count: validWords.length,    color: "#059669" },
    { id: "phrases",  label: "短语 Phrases",  count: validPhrases.length,  color: "#4F46E5" },
    { id: "patterns", label: "句型 Patterns", count: validPatterns.length, color: "#D97706" },
  ];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E0DBD1" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#0F0F0E" }}>
        <div className="flex items-center gap-3">
          <PenLine className="h-5 w-5" style={{ color: "#1C4ED8" }} />
          <div>
            <h2 className="text-sm font-display font-semibold tracking-tight text-white leading-tight">手动录入 Manual Entry</h2>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>自己填写词汇、短语和句型，无需 AI 分析</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Meta fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FCE Reading 3"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Cambridge 18"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
            <select value={targetLevel} onChange={e => setTargetLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none">
              {["KET","PET","FCE","CAE","IELTS","TOEFL","GRE"].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Science"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 border-b" style={{ borderColor: "#E0DBD1" }}>
          {sectionTabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setSection(tab.id)}
              className="pb-2.5 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer"
              style={section === tab.id
                ? { borderColor: tab.color, color: tab.color }
                : { borderColor: "transparent", color: "#94A3B8" }}>
              {tab.label}
              {tab.count > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tab.color }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Words section */}
        {section === "words" && (
          <div className="space-y-3">
            {words.map((w, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 p-3 rounded-lg border" style={{ borderColor: "#E0DBD1", backgroundColor: "#F9FAF9" }}>
                <input value={w.item} onChange={e => updateWord(i, "item", e.target.value)} placeholder="Word *"
                  className="col-span-3 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-emerald-500" />
                <select value={w.part_of_speech} onChange={e => updateWord(i, "part_of_speech", e.target.value)}
                  className="col-span-2 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none bg-white">
                  {["noun","verb","adjective","adverb","phrase","other"].map(p => <option key={p}>{p}</option>)}
                </select>
                <input value={w.definition_en} onChange={e => updateWord(i, "definition_en", e.target.value)} placeholder="Definition"
                  className="col-span-4 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-emerald-500" />
                <input value={w.contextual_sentence} onChange={e => updateWord(i, "contextual_sentence", e.target.value)} placeholder="Example sentence"
                  className="col-span-2 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-emerald-500" />
                <button type="button" onClick={() => removeWord(i)} className="col-span-1 flex items-center justify-center text-gray-300 hover:text-red-400 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addWord}
              className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add word
            </button>
          </div>
        )}

        {/* Phrases section */}
        {section === "phrases" && (
          <div className="space-y-3">
            {phrases.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 p-3 rounded-lg border" style={{ borderColor: "#E0DBD1", backgroundColor: "#F9F9FF" }}>
                <input value={p.item} onChange={e => updatePhrase(i, "item", e.target.value)} placeholder="Phrase / idiom *"
                  className="col-span-3 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-500" />
                <input value={p.definition_en} onChange={e => updatePhrase(i, "definition_en", e.target.value)} placeholder="Definition"
                  className="col-span-4 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-500" />
                <input value={p.contextual_sentence} onChange={e => updatePhrase(i, "contextual_sentence", e.target.value)} placeholder="Example sentence"
                  className="col-span-4 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-indigo-500" />
                <button type="button" onClick={() => removePhrase(i)} className="col-span-1 flex items-center justify-center text-gray-300 hover:text-red-400 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addPhrase}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add phrase
            </button>
          </div>
        )}

        {/* Patterns section */}
        {section === "patterns" && (
          <div className="space-y-3">
            {patterns.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 p-3 rounded-lg border" style={{ borderColor: "#E0DBD1", backgroundColor: "#FFFBF2" }}>
                <input value={s.pattern_structure} onChange={e => updatePattern(i, "pattern_structure", e.target.value)} placeholder="Pattern structure *"
                  className="col-span-3 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-amber-500" />
                <input value={s.functional_purpose} onChange={e => updatePattern(i, "functional_purpose", e.target.value)} placeholder="Purpose"
                  className="col-span-4 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-amber-500" />
                <input value={s.contextual_sentence} onChange={e => updatePattern(i, "contextual_sentence", e.target.value)} placeholder="Example sentence"
                  className="col-span-4 px-2 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-amber-500" />
                <button type="button" onClick={() => removePattern(i)} className="col-span-1 flex items-center justify-center text-gray-300 hover:text-red-400 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addPattern}
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium cursor-pointer transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add pattern
            </button>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E0DBD1" }}>
          <p className="text-xs text-gray-400">
            {validWords.length} 词 · {validPhrases.length} 短语 · {validPatterns.length} 句型
          </p>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={canSubmit
              ? { backgroundColor: "#1C4ED8", color: "white" }
              : { backgroundColor: "#E0DBD1", color: "#94A3B8", cursor: "not-allowed" }}>
            <CheckCircle className="h-4 w-4" />
            Save & View Extracted
          </button>
        </div>
      </div>
    </div>
  );
}

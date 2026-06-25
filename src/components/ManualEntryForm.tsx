import React, { useRef, useState } from "react";
import { CorpusAnalysisResult, VocabularyBlock, PhraseBlock, SentencePattern } from "../types";
import { CheckCircle, PenLine, Trash2 } from "lucide-react";
import cefrDict from "../data/cefr_dictionary.json";

export type ManualItemType = "word" | "phrase" | "pattern";

export interface ManualExtractedItem {
  id: string;
  type: ManualItemType;
  text: string;
  cefr: string | null;
  contextual_sentence: string;
}

export interface ManualFormState {
  title: string;
  source: string;
  targetLevel: string;
  category: string;
  passage: string;
  items: ManualExtractedItem[];
}

export const MANUAL_FORM_INITIAL: ManualFormState = {
  title: "", source: "", targetLevel: "IELTS", category: "", passage: "", items: [],
};

interface ManualEntryFormProps {
  state: ManualFormState;
  onChange: (s: ManualFormState) => void;
  onSubmit: (data: CorpusAnalysisResult) => void;
}

function cefrLevel(text: string): string | null {
  const word = text.toLowerCase().trim().split(/\s+/)[0];
  return (cefrDict as Record<string, string>)[word] || null;
}

function extractSentence(fullText: string, selStart: number): string {
  const sentenceEnds = /[.!?]/;
  let start = selStart;
  while (start > 0 && !sentenceEnds.test(fullText[start - 1])) start--;
  let end = selStart;
  while (end < fullText.length && !sentenceEnds.test(fullText[end])) end++;
  if (end < fullText.length) end++;
  return fullText.substring(start, end).trim();
}

const TYPE_COLORS: Record<ManualItemType, { bg: string; text: string; border: string; label: string }> = {
  word:    { bg: "#D1FAE5", text: "#065F46", border: "#059669", label: "Word" },
  phrase:  { bg: "#E0E7FF", text: "#3730A3", border: "#4F46E5", label: "Phrase" },
  pattern: { bg: "#FEF3C7", text: "#92400E", border: "#D97706", label: "Pattern" },
};

export default function ManualEntryForm({ state, onChange, onSubmit }: ManualEntryFormProps) {
  const { title, source, targetLevel, category, passage, items } = state;
  const set = (patch: Partial<ManualFormState>) => onChange({ ...state, ...patch });

  const [menu, setMenu] = useState<{ x: number; y: number; text: string; sentence: string } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const ta = taRef.current;
    if (!ta) return;
    const text = ta.value.substring(ta.selectionStart, ta.selectionEnd).trim();
    if (!text || text.length < 2) return;
    const sentence = extractSentence(ta.value, ta.selectionStart);
    setMenu({ x: e.clientX - 40, y: e.clientY - 54, text, sentence });
  };

  const addItem = (type: ManualItemType) => {
    if (!menu) return;
    const newItem: ManualExtractedItem = {
      id: `m_${Date.now()}`, type, text: menu.text,
      cefr: cefrLevel(menu.text), contextual_sentence: menu.sentence,
    };
    set({ items: [...items, newItem] });
    setMenu(null);
  };

  const removeItem = (id: string) => set({ items: items.filter(i => i.id !== id) });

  const wordItems    = items.filter(i => i.type === "word");
  const phraseItems  = items.filter(i => i.type === "phrase");
  const patternItems = items.filter(i => i.type === "pattern");
  const canSubmit = items.length > 0;

  const handleSubmit = () => {
    const vocabulary_blocks: VocabularyBlock[] = wordItems.map(i => ({
      id: i.id, type: "word", item: i.text,
      part_of_speech: "noun", definition_en: "", contextual_sentence: i.contextual_sentence, academic_example: "",
    }));
    const phrase_blocks: PhraseBlock[] = phraseItems.map(i => ({
      id: i.id, type: "phrase_collocation_idiom", item: i.text,
      definition_en: "", contextual_sentence: i.contextual_sentence, academic_example: "",
    }));
    const sentence_patterns: SentencePattern[] = patternItems.map(i => ({
      id: i.id, type: "pattern", pattern_structure: i.text,
      functional_purpose: "", contextual_sentence: i.contextual_sentence, academic_example: "",
    }));
    onSubmit({
      meta_data: { title: title || "Manual Entry", source: source || "User Input", category: category || "Manual", target_level: targetLevel },
      vocabulary_blocks, phrase_blocks, sentence_patterns,
    });
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E0DBD1" }}
      onClick={() => menu && setMenu(null)}>

      <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: "#0F0F0E" }}>
        <PenLine className="h-5 w-5" style={{ color: "#1C4ED8" }} />
        <div>
          <h2 className="text-sm font-semibold text-white leading-tight">手动录入 Manual Entry</h2>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>选中文字后右键 → 选分类，自动匹配 CEFR 等级</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input value={title} onChange={e => set({ title: e.target.value })} placeholder="e.g. FCE Reading 3"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
            <input value={source} onChange={e => set({ source: e.target.value })} placeholder="e.g. Cambridge 18"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
            <select value={targetLevel} onChange={e => set({ targetLevel: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none bg-white">
              {["KET","PET","FCE","CAE","IELTS","TOEFL","GRE"].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <input value={category} onChange={e => set({ category: e.target.value })} placeholder="e.g. Science"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">原文 · 选中后右键选分类</label>
            <textarea
              ref={taRef}
              value={passage}
              onChange={e => set({ passage: e.target.value })}
              onContextMenu={handleContextMenu}
              rows={14}
              placeholder="在这里粘贴原文..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm leading-relaxed focus:outline-none focus:border-blue-400 resize-none"
              style={{ color: "#1e293b" }}
            />
          </div>
          <div className="rounded-lg border p-3 min-h-[200px]" style={{ borderColor: "#E0DBD1", backgroundColor: "#FAFAF8" }}>
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">已提取词条</p>
            {items.length === 0 ? (
              <p className="text-xs text-gray-300 text-center mt-12">选中左边文字后右键选分类</p>
            ) : (
              <div className="space-y-3">
                {(["word","phrase","pattern"] as ManualItemType[]).map(type => {
                  const group = items.filter(i => i.type === type);
                  if (!group.length) return null;
                  const c = TYPE_COLORS[type];
                  return (
                    <div key={type}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: c.border }}>{c.label}s</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.map(item => (
                          <span key={item.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: c.bg, color: c.text }}>
                            {item.text}
                            {item.cefr && (
                              <span className="text-[9px] font-black px-1 rounded" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>{item.cefr}</span>
                            )}
                            <button onClick={() => removeItem(item.id)} className="opacity-40 hover:opacity-100 cursor-pointer ml-0.5">
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#E0DBD1" }}>
          <p className="text-xs text-gray-400">{wordItems.length} 词 · {phraseItems.length} 短语 · {patternItems.length} 句型</p>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={canSubmit ? { backgroundColor: "#1C4ED8", color: "white" } : { backgroundColor: "#E0DBD1", color: "#94A3B8", cursor: "not-allowed" }}>
            <CheckCircle className="h-4 w-4" />
            Save & View Extracted
          </button>
        </div>
      </div>

      {menu && (
        <div className="fixed z-50 flex gap-1 p-1 rounded-lg shadow-xl"
          style={{ left: menu.x, top: menu.y, backgroundColor: "#0F0F0E" }}
          onMouseDown={e => e.stopPropagation()}>
          {(["word","phrase","pattern"] as ManualItemType[]).map(type => (
            <button key={type} onClick={() => addItem(type)}
              className="px-2.5 py-1.5 rounded text-[11px] font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: TYPE_COLORS[type].border }}>
              {TYPE_COLORS[type].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

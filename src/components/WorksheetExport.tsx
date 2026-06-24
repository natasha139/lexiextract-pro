import React, { useState, useEffect } from "react";
import { CorpusAnalysisResult } from "../types";
import { Printer, Copy, Check, FileCode, NotebookPen, AlertCircle, Download, BookOpen, Layers, HelpCircle, Sigma, BarChart3, PieChart } from "lucide-react";
import katex from "katex";

interface LatexRendererProps {
  text: string;
  className?: string;
  enabled?: boolean;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ text, className = "", enabled = true }) => {
  if (!text) return null;
  if (!enabled) return <span className={className}>{text}</span>;

  // Split content by inline ($...$, \(...\)) and block ($$...$$, \[...\]) math delimiters.
  // Regexp pattern for potential LaTeX markers:
  const regex = /(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$|\\\(.*?\\\))/gs;
  const parts = text.split(regex);

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        let isMath = false;
        let isDisplay = false;
        let mathContent = "";

        if (part.startsWith("$$") && part.endsWith("$$")) {
          isMath = true;
          isDisplay = true;
          mathContent = part.slice(2, -2);
        } else if (part.startsWith("\\[") && part.endsWith("\\]")) {
          isMath = true;
          isDisplay = true;
          mathContent = part.slice(2, -2);
        } else if (part.startsWith("$") && part.endsWith("$")) {
          isMath = true;
          isDisplay = false;
          mathContent = part.slice(1, -1);
        } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
          isMath = true;
          isDisplay = false;
          mathContent = part.slice(2, -2);
        }

        if (isMath && mathContent.trim()) {
          try {
            const html = katex.renderToString(mathContent, {
              displayMode: isDisplay,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className={isDisplay ? "block my-2 text-center" : "inline-block px-0.5 align-middle"}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            console.error("KaTeX render error:", err);
            return <code key={index} className="bg-red-50 text-red-600 px-1 py-0.5 rounded text-xs font-mono">{part}</code>;
          }
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

interface WorksheetExportProps {
  data: CorpusAnalysisResult;
}

export default function WorksheetExport({ data }: WorksheetExportProps) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"json" | "printable" | "anki">("printable");
  const [isStudentMode, setIsStudentMode] = useState(true); // Default to clean student worksheet formatting
  const [isIframe, setIsIframe] = useState(false);
  
  // Section toggle preferences for custom curriculum generation
  const [includeVocab, setIncludeVocab] = useState(true);
  const [includePhrases, setIncludePhrases] = useState(true);
  const [includePatterns, setIncludePatterns] = useState(true);
  const [includePractice, setIncludePractice] = useState(true);
  const [includeLatex, setIncludeLatex] = useState(true); // Active LaTeX rendering toggle

  // Anki Export Preferences
  const [includeVocabAnki, setIncludeVocabAnki] = useState(true);
  const [includePhrasesAnki, setIncludePhrasesAnki] = useState(true);
  const [includePatternsAnki, setIncludePatternsAnki] = useState(true);
  const [useHTMLFormat, setUseHTMLFormat] = useState(true);
  const [csvDelimiter, setCsvDelimiter] = useState<"," | "\t">(",");
  const [ankiCopied, setAnkiCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      setIsIframe(true);
    }
  }, []);

  const formattedJSON = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const generateAnkiCSV = () => {
    const rows: string[][] = [];
    // Header Row (Front, Back, Context)
    rows.push(["Front", "Back", "Context"]);

    if (includeVocabAnki && data.vocabulary_blocks) {
      data.vocabulary_blocks.forEach((b) => {
        let front = "";
        let back = "";
        let context = "";

        if (useHTMLFormat) {
          front = `<b>${b.item}</b> <span style="color:#64748b; font-style:italic;">(${b.part_of_speech})</span>`;
          back = `<span style="font-size:1.1em; color:#0f172a; font-weight:600;">${b.definition_en}</span>`;
          context = `<div><i>${b.contextual_sentence}</i></div>`;
          if (b.academic_example) {
            context += `<div style="margin-top:8px; font-size:0.9em; background:#f8fafc; padding:6px; border-radius:4px; border-left: 3px solid #10b981; color:#0f172a;"><b>Model Sentence:</b> ${b.academic_example}</div>`;
          }
        } else {
          front = `${b.item} (${b.part_of_speech})`;
          back = b.definition_en;
          context = b.contextual_sentence;
          if (b.academic_example) {
            context += `\nModel: ${b.academic_example}`;
          }
        }
        rows.push([front, back, context]);
      });
    }

    if (includePhrasesAnki && data.phrase_blocks) {
      data.phrase_blocks.forEach((b) => {
        let front = "";
        let back = "";
        let context = "";

        if (useHTMLFormat) {
          front = `<b>${b.item}</b>`;
          back = `<span style="font-size:1.1em; color:#0f172a; font-weight:600;">${b.definition_en}</span>`;
          context = `<div><i>${b.contextual_sentence}</i></div>`;
          if (b.academic_example) {
            context += `<div style="margin-top:8px; font-size:0.9em; background:#f8fafc; padding:6px; border-radius:4px; border-left: 3px solid #6366f1; color:#0f172a;"><b>Model Sentence:</b> ${b.academic_example}</div>`;
          }
        } else {
          front = b.item;
          back = b.definition_en;
          context = b.contextual_sentence;
          if (b.academic_example) {
            context += `\nModel: ${b.academic_example}`;
          }
        }
        rows.push([front, back, context]);
      });
    }

    if (includePatternsAnki && data.sentence_patterns) {
      data.sentence_patterns.forEach((b) => {
        let front = "";
        let back = "";
        let context = "";

        if (useHTMLFormat) {
          front = `<code style="font-family:monospace; background:#f1f5f9; padding:2px 4px; border-radius:3px; color:#b45309;">${b.pattern_structure}</code>`;
          back = `<span style="font-weight:600; color:#b45309;">${b.functional_purpose}</span>`;
          context = `<div><i>Sentence: ${b.contextual_sentence}</i></div>`;
          if (b.academic_example) {
            context += `<div style="margin-top:8px; font-size:0.9em; background:#f8fafc; padding:6px; border-radius:4px; border-left: 3px solid #f59e0b; color:#0f172a;"><b>Output Model:</b> ${b.academic_example}</div>`;
          }
        } else {
          front = b.pattern_structure;
          back = `Purpose: ${b.functional_purpose}`;
          context = `Sentence: ${b.contextual_sentence}`;
          if (b.academic_example) {
            context += `\nModel: ${b.academic_example}`;
          }
        }
        rows.push([front, back, context]);
      });
    }

    // Convert rows to delimiter separated text string
    const delimiter = csvDelimiter;
    return rows
      .map((row) =>
        row
          .map((val) => {
            if (!val) return "";
            // Double quotes are escaped as two double quotes
            const escaped = val.replace(/"/g, '""');
            // If the value contains quotes, delims, or linebreaks, enclose in quotes
            if (
              escaped.includes(delimiter) ||
              escaped.includes('"') ||
              escaped.includes("\n") ||
              escaped.includes("\r")
            ) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(delimiter)
      )
      .join("\n");
  };

  const handleDownloadAnkiCSV = () => {
    const csvContent = generateAnkiCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const rawTitle = data.meta_data.title || "anki_export";
    const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_").substring(0, 30);
    const extension = csvDelimiter === "," ? "csv" : "txt";
    link.setAttribute("download", `anki_import_${safeTitle}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAnkiCSV = () => {
    const csvContent = generateAnkiCSV();
    navigator.clipboard.writeText(csvContent);
    setAnkiCopied(true);
    setTimeout(() => setAnkiCopied(false), 2000);
  };

  const generateHTML = () => {
    const title = data.meta_data.title || "LexiExtract Worksheet";
    const level = data.meta_data.target_level || "";
    const source = data.meta_data.source || "";

    const vocabRows = (includeVocab && data.vocabulary_blocks) ? data.vocabulary_blocks.map((b) => `
      <div class="entry">
        <div class="entry-head">
          <span class="word">${b.item}</span>
          <span class="pos">${b.part_of_speech}</span>
        </div>
        <div class="definition">${b.definition_en}</div>
        <div class="context">"${b.contextual_sentence}"</div>
        ${!isStudentMode && b.academic_example ? `<div class="model"><strong>Model:</strong> ${b.academic_example}</div>` : ""}
        ${isStudentMode ? '<div class="write-line"></div><div class="write-line"></div>' : ""}
      </div>`).join("") : "";

    const phraseRows = (includePhrases && data.phrase_blocks) ? data.phrase_blocks.map((b) => `
      <div class="entry entry-phrase">
        <div class="entry-head">
          <span class="word">${b.item}</span>
        </div>
        <div class="definition">${b.definition_en}</div>
        <div class="context">"${b.contextual_sentence}"</div>
        ${!isStudentMode && b.academic_example ? `<div class="model"><strong>Model:</strong> ${b.academic_example}</div>` : ""}
        ${isStudentMode ? '<div class="write-line"></div><div class="write-line"></div>' : ""}
      </div>`).join("") : "";

    const patternRows = (includePatterns && data.sentence_patterns) ? data.sentence_patterns.map((b) => `
      <div class="entry entry-pattern">
        <div class="entry-head">
          <code class="pattern-code">${b.pattern_structure}</code>
        </div>
        <div class="definition">${b.functional_purpose}</div>
        <div class="context">"${b.contextual_sentence}"</div>
        ${!isStudentMode && b.academic_example ? `<div class="model"><strong>Model:</strong> ${b.academic_example}</div>` : ""}
        ${isStudentMode ? '<div class="write-line"></div><div class="write-line"></div>' : ""}
      </div>`).join("") : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: Georgia, serif; background: #F5F2EB; color: #0F0F0E; max-width: 800px; margin: 0 auto; padding: 40px 32px; }
  .header { border-bottom: 2px solid #0F0F0E; padding-bottom: 16px; margin-bottom: 32px; }
  .header h1 { margin: 0 0 6px; font-size: 1.6rem; }
  .header .meta { font-size: 0.8rem; color: #64748B; font-family: monospace; }
  .section-title { font-size: 0.7rem; font-family: monospace; text-transform: uppercase; letter-spacing: 0.12em; color: #1C4ED8; margin: 32px 0 12px; border-bottom: 1px solid #E0DBD1; padding-bottom: 6px; }
  .entry { border-left: 2px solid #1C4ED8; padding: 12px 16px; margin-bottom: 16px; background: #fff; }
  .entry-phrase { border-left-color: #7C3AED; }
  .entry-pattern { border-left-color: #B45309; }
  .entry-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }
  .word { font-size: 1.05rem; font-weight: 700; }
  .pos { font-size: 0.7rem; font-family: monospace; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; }
  .pattern-code { font-family: monospace; background: #FEF9C3; padding: 2px 6px; border-radius: 3px; color: #B45309; font-size: 0.9rem; }
  .definition { font-size: 0.9rem; color: #1e293b; margin-bottom: 6px; }
  .context { font-size: 0.85rem; color: #475569; font-style: italic; margin-bottom: 6px; }
  .model { font-size: 0.82rem; color: #0f172a; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #10b981; margin-top: 6px; }
  .write-line { border-bottom: 1px solid #CBD5E1; margin-top: 10px; height: 22px; }
  @media print { body { background: white; padding: 0; } .entry { background: white; } }
</style>
</head>
<body>
<div class="header">
  <h1>${title}</h1>
  <div class="meta">${level}${source ? " · " + source : ""} · ${isStudentMode ? "Student Handout" : "Teacher Key"}</div>
</div>
${vocabRows ? `<div class="section-title">Section 1 — Vocabulary</div>${vocabRows}` : ""}
${phraseRows ? `<div class="section-title">Section 2 — Phrases &amp; Collocations</div>${phraseRows}` : ""}
${patternRows ? `<div class="section-title">Section 3 — Sentence Patterns</div>${patternRows}` : ""}
</body>
</html>`;
  };

  const handleDownloadHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const rawTitle = data.meta_data.title || "worksheet";
    const safeTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_").substring(0, 30);
    link.download = `lexiextract_${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 no-print">
        <button
          onClick={() => setActiveSubTab("printable")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all leading-none ${
            activeSubTab === "printable"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <NotebookPen className="h-4 w-4 inline mr-1.5" />
          Worksheet Printout Workspace
        </button>
        <button
          onClick={() => setActiveSubTab("json")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all leading-none ${
            activeSubTab === "json"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <FileCode className="h-4 w-4 inline mr-1.5" />
          Pristine JSON Export
        </button>
        <button
          onClick={() => setActiveSubTab("anki")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all leading-none ${
            activeSubTab === "anki"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <BookOpen className="h-4 w-4 inline mr-1.5" />
          Anki CSV Export
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between no-print bg-slate-50 p-4 rounded-xl border border-slate-150 gap-4">
        <div className="space-y-1 flex-1">
          <p className="text-xs text-slate-700 font-medium">
            {activeSubTab === "printable"
              ? "Configure, preview, and print a custom classroom study guide or homework worksheet with standard writing blanks."
              : activeSubTab === "json"
              ? "Review or export the complete, structures-safe JSON file matching your designated university system schema."
              : "Export processed vocabulary, phrases, and sentence patterns into Anki-ready CSV/TSV formats for space-repetition learning."}
          </p>
          {activeSubTab === "printable" && (
            <div className="space-y-2.5 pt-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Format Preset:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="radio"
                    checked={isStudentMode}
                    onChange={() => setIsStudentMode(true)}
                    className="accent-emerald-600 h-3.5 w-3.5"
                  />
                  Student Handout (Clean Writing Lines)
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="radio"
                    checked={!isStudentMode}
                    onChange={() => setIsStudentMode(false)}
                    className="accent-emerald-600 h-3.5 w-3.5"
                  />
                  Teacher Key (Show Full Model Answers)
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Curriculum Sections:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeVocab}
                    onChange={(e) => setIncludeVocab(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Section 1: Vocabulary
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includePhrases}
                    onChange={(e) => setIncludePhrases(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Section 2: Phrases
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includePatterns}
                    onChange={(e) => setIncludePatterns(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Section 3: Sentence Patterns
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includePractice}
                    onChange={(e) => setIncludePractice(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Section 4: Writing Exercises
                </label>
                <div className="h-4 w-px bg-slate-350 self-center hidden sm:inline"></div>
                <label className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold cursor-pointer select-none hover:text-emerald-950 transition-colors bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/60 font-mono">
                  <input
                    type="checkbox"
                    checked={includeLatex}
                    onChange={(e) => setIncludeLatex(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Render LaTeX Math (KaTeX)
                </label>
              </div>
            </div>
          )}
          {activeSubTab === "anki" && (
            <div className="space-y-2.5 pt-2">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Format Options:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={useHTMLFormat}
                    onChange={(e) => setUseHTMLFormat(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Use pre-styled HTML fields (recommended for rich, elegant cards)
                </label>
                <div className="flex items-center gap-1.5 ml-0.5">
                  <span className="text-xs text-slate-600 font-medium">Delimiter:</span>
                  <select
                    value={csvDelimiter}
                    onChange={(e) => setCsvDelimiter(e.target.value as "," | "\t")}
                    className="py-1 pl-2 pr-6 text-xs bg-white text-slate-800 border border-gray-250 rounded-lg focus:outline-hidden cursor-pointer font-semibold"
                  >
                    <option value=",">Comma (Standard CSV)</option>
                    <option value="&#9;">Tab (Anki Preferred TSV)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Include Columns:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeVocabAnki}
                    onChange={(e) => setIncludeVocabAnki(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Vocabulary Items ({data.vocabulary_blocks?.length || 0})
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includePhrasesAnki}
                    onChange={(e) => setIncludePhrasesAnki(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Phrases & Collocations ({data.phrase_blocks?.length || 0})
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none hover:text-slate-950 transition-colors">
                  <input
                    type="checkbox"
                    checked={includePatternsAnki}
                    onChange={(e) => setIncludePatternsAnki(e.target.checked)}
                    className="rounded shadow-2xs accent-emerald-600 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                  />
                  Sentence Patterns ({data.sentence_patterns?.length || 0})
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 self-end sm:self-center">
          {activeSubTab === "json" ? (
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap mb-0.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied Schema
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Corpus JSON
                </>
              )}
            </button>
          ) : activeSubTab === "printable" ? (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadHTML}
                className="px-3.5 py-2 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-gray-300 shadow-2xs"
              >
                <FileCode className="h-3.5 w-3.5" />
                Download HTML
              </button>
              <button
                onClick={handlePrint}
                className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-600/10 hover:-translate-y-0.5"
              >
                <Printer className="h-4 w-4 stroke-[2.5]" />
                Print / Export to PDF
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCopyAnkiCSV}
                className="px-3.5 py-2 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-gray-300 shadow-2xs"
              >
                {ankiCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied CSV Data
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 animate-pulse" />
                    Copy CSV Content
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadAnkiCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-600/10 hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                Download Anki CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Export Summary Statistics Panel */}
      {(() => {
        const totalVocab = data.vocabulary_blocks?.length || 0;
        const totalPhrases = data.phrase_blocks?.length || 0;
        const totalPatterns = data.sentence_patterns?.length || 0;
        const totalAvailable = totalVocab + totalPhrases + totalPatterns;

        const selectedVocab = activeSubTab === "printable"
          ? (includeVocab ? totalVocab : 0)
          : activeSubTab === "anki"
          ? (includeVocabAnki ? totalVocab : 0)
          : totalVocab;

        const selectedPhrases = activeSubTab === "printable"
          ? (includePhrases ? totalPhrases : 0)
          : activeSubTab === "anki"
          ? (includePhrasesAnki ? totalPhrases : 0)
          : totalPhrases;

        const selectedPatterns = activeSubTab === "printable"
          ? (includePatterns ? totalPatterns : 0)
          : activeSubTab === "anki"
          ? (includePatternsAnki ? totalPatterns : 0)
          : totalPatterns;

        const totalReady = selectedVocab + selectedPhrases + selectedPatterns;

        const pctVocab = totalReady > 0 ? (selectedVocab / totalReady) * 100 : 0;
        const pctPhrases = totalReady > 0 ? (selectedPhrases / totalReady) * 100 : 0;
        const pctPatterns = totalReady > 0 ? (selectedPatterns / totalReady) * 100 : 0;

        return (
          <div className="no-print bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-3xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Metrics column */}
            <div className="lg:col-span-5 space-y-1 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                <PieChart className="h-3.5 w-3.5 text-emerald-500" /> Current Export Bundle Status
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {totalReady}
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-550">
                  out of {totalAvailable} total corpus items selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Dynamically calculated based on active configuration settings for the <span className="font-extrabold text-emerald-600 font-mono capitalize">{activeSubTab}</span> preset.
              </p>
            </div>

            {/* Right breakdown and progress chart column */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <span>Composition Segment Profile</span>
                  <span>{totalReady > 0 ? "100% Selected Scale" : "0% Selected Scale"}</span>
                </div>
                {/* Horizontal segmented chart */}
                <div className="h-3.5 w-full bg-slate-105 dark:bg-slate-800 rounded-full flex overflow-hidden border border-slate-200/40 dark:border-slate-700/60 shadow-3xs p-[2px]">
                  {totalReady > 0 ? (
                    <>
                      {selectedVocab > 0 && (
                        <div 
                          style={{ width: `${pctVocab}%` }} 
                          className="h-full bg-emerald-500 rounded-l-full first:rounded-l-full last:rounded-r-full transition-all duration-500" 
                          title={`Vocabulary Words: ${selectedVocab}`} 
                        />
                      )}
                      {selectedPhrases > 0 && (
                        <div 
                          style={{ width: `${pctPhrases}%` }} 
                          className="h-full bg-indigo-500 first:rounded-l-full last:rounded-r-full transition-all duration-500" 
                          title={`Phrases: ${selectedPhrases}`} 
                        />
                      )}
                      {selectedPatterns > 0 && (
                        <div 
                          style={{ width: `${pctPatterns}%` }} 
                          className="h-full bg-amber-500 last:rounded-r-full first:rounded-l-full transition-all duration-500" 
                          title={`Sentence Patterns: ${selectedPatterns}`} 
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center text-[9px] text-gray-450 dark:text-slate-550 font-bold flex items-center justify-center leading-none">
                      All sections toggled off – nothing in preview bundle
                    </div>
                  )}
                </div>
              </div>

              {/* Three-column label breakdown */}
              <div className="grid grid-cols-3 gap-3.5 text-left text-xs pt-1 border-t border-slate-100 dark:border-slate-850">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Selected Words</span>
                  </div>
                  <p className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {selectedVocab} <span className="text-[10px] font-medium text-slate-400">/ {totalVocab}</span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    <span>Selected Phrases</span>
                  </div>
                  <p className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {selectedPhrases} <span className="text-[10px] font-medium text-slate-400">/ {totalPhrases}</span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Selected Formulae</span>
                  </div>
                  <p className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {selectedPatterns} <span className="text-[10px] font-medium text-slate-400">/ {totalPatterns}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {activeSubTab === "printable" && isIframe && (
        <div className="p-4.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900 no-print max-w-3xl mx-auto shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 font-bold" />
            <div className="space-y-1 font-medium leading-relaxed">
              <p className="font-bold text-slate-900 text-[13px]">
                ⚠️ 浏览器安全限制提醒 (iFrame Sandboxing Alert)
              </p>
              <p className="text-slate-700">
                当前应用程序正嵌套在 AI Studio 开发预览面板的 <strong>iFrame 沙箱</strong> 中运行。现代浏览器默认会阻止此类沙盒内嵌套页面调用 <code>window.print()</code> 打印及导出 PDF 弹窗。
              </p>
              <div className="pt-1.5 flex flex-col gap-1 text-slate-900">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-mono leading-none">⚡ 快速解决方法</span>
                </p>
                <p className="text-slate-700">
                  请点击当前应用预览窗口右上角的 <strong>“在新标签页中打开” (Open in New Tab)</strong> 按钮/图标。
                  在新窗口加载完毕后，点击该处的 <strong>“Print / Export to PDF”</strong>，便可以顺畅地调出浏览器的系统打印和保存 PDF 菜单！
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "json" ? (
        <div className="relative">
          <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[500px]">
            <code>{formattedJSON}</code>
          </pre>
        </div>
      ) : activeSubTab === "anki" ? (
        <div className="space-y-6 max-w-3xl mx-auto text-left">
          {/* Anki Instructions Block */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-150 dark:border-slate-800 pb-3">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Anki Bulk Import Guidelines (导入到 Anki 说明)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">💡 Import Configuration Setup:</h3>
                <ol className="list-decimal pl-4.5 space-y-1.5">
                  <li>Choose your preferred <strong>Delimiter</strong> above (Anki fits standard CSV commas and preferred TSV tabs).</li>
                  <li>Enable <strong>"pre-styled HTML fields"</strong> to output italicized collocations, highlighted parts-of-speech tags, and boxed context definitions.</li>
                  <li>Click <strong>"Download Anki CSV"</strong> to save the optimized file directly.</li>
                </ol>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">🎯 Sequential Field Mapping in Anki:</h3>
                <ul className="space-y-1.5 list-none pl-0">
                  <li className="flex items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">Field 1</span> 
                    <span>Maps directly to card <strong>Front</strong> (Word/Phrase/POS)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">Field 2</span> 
                    <span>Maps directly to card <strong>Back</strong> (Definition)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">Field 3</span> 
                    <span>Maps directly to card <strong>Context</strong> (Usage and model example)</span>
                  </li>
                </ul>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
                  *Important: When importing CSVs with HTML formatting into Anki, remember to check <strong>"Allow HTML in fields"</strong> in the import pane.
                </p>
              </div>
            </div>
          </div>

          {/* Anki Live Flashcard Rendering Preview */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Flashcard Preview Examples (预览卡片渲染效果)</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                {useHTMLFormat ? "HTML Styling Active" : "Plaintext Mode"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 Front */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-950 relative min-h-[140px] flex flex-col justify-between shadow-3xs">
                <span className="absolute top-2.5 right-2 text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.5 rounded">Front Side</span>
                <div className="py-4 text-center text-sm dark:text-slate-100">
                  {useHTMLFormat ? (
                    <div dangerouslySetInnerHTML={{ __html: `<b>conspicuous</b> <span style="color:#64748b; font-style:italic;">(adjective)</span>` }} />
                  ) : (
                    <div>conspicuous (adjective)</div>
                  )}
                </div>
                <div className="text-[9px] text-center text-slate-400 dark:text-slate-500 italic">Click back of card to reveal definition...</div>
              </div>

              {/* Card 1 Back */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 relative min-h-[140px] flex flex-col justify-between shadow-3xs">
                <span className="absolute top-2.5 right-2 text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-950/40 px-1 py-0.5 rounded">Back Side</span>
                <div className="space-y-3 py-2">
                  <div className="text-center text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                    {useHTMLFormat ? (
                      <div dangerouslySetInnerHTML={{ __html: `<span style="font-size:1.1em; color:#0f172a; font-weight:600;">standing out so as to be clearly visible; attracting attention</span>` }} />
                    ) : (
                      <div>standing out so as to be clearly visible; attracting attention</div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2 text-left">
                    {useHTMLFormat ? (
                      <div dangerouslySetInnerHTML={{ __html: `<div><i>The conspicuous red warning light was impossible to ignore.</i></div><div style="margin-top:4px; font-size:0.9em; background:#f8fafc; padding:4px; border-radius:4px; border-left: 3px solid #10b981; color:#0f172a;"><b>Model Sentence:</b> The error remains conspicuous when referencing metrics.</div>` }} />
                    ) : (
                      <div>
                        <i>The conspicuous red warning light was impossible to ignore.</i>
                        <div className="mt-1 font-semibold text-slate-600 dark:text-slate-400">Model: The error remains conspicuous when referencing metrics.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actual CSV Raw Preview Grid */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-900 dark:text-slate-100 font-bold text-sm tracking-tight">Structured Row Data Grid</span>
              <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">Total Cards Configured: {(includeVocabAnki ? (data.vocabulary_blocks?.length || 0) : 0) + (includePhrasesAnki ? (data.phrase_blocks?.length || 0) : 0) + (includePatternsAnki ? (data.sentence_patterns?.length || 0) : 0)} items</span>
            </div>

            <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-3xs max-h-[350px] overflow-y-auto">
              <table className="w-full text-xs font-medium border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">#</th>
                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Front (Card Front)</th>
                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Back (Card Back)</th>
                    <th className="px-4 py-3">Context (Card Context)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {/* Vocabulary rendering in Preview */}
                  {includeVocabAnki && data.vocabulary_blocks && data.vocabulary_blocks.length > 0 ? (
                    data.vocabulary_blocks.map((b, i) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500 border-r border-slate-150 dark:border-slate-800">{i + 1}</td>
                        <td className="px-4 py-3 border-r border-slate-150 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold break-all max-w-[150px]">{b.item} <span className="text-gray-450 dark:text-gray-500 italic font-normal">({b.part_of_speech})</span></td>
                        <td className="px-4 py-3 border-r border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-words max-w-[200px]">{b.definition_en}</td>
                        <td className="px-4 py-3 text-slate-550 dark:text-slate-450 italic break-words max-w-[220px]">{b.contextual_sentence}</td>
                      </tr>
                    ))
                  ) : null}

                  {/* Phrase rendering in Preview */}
                  {includePhrasesAnki && data.phrase_blocks && data.phrase_blocks.length > 0 ? (
                    data.phrase_blocks.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors bg-indigo-50/10 dark:bg-indigo-950/10">
                        <td className="px-4 py-3 font-mono text-indigo-400 dark:text-indigo-500 border-r border-slate-150 dark:border-slate-800 font-bold">P{i + 1}</td>
                        <td className="px-4 py-3 border-r border-slate-150 dark:border-slate-800 text-indigo-900 dark:text-indigo-300 font-bold break-all max-w-[150px]">{p.item}</td>
                        <td className="px-4 py-3 border-r border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-words max-w-[200px]">{p.definition_en}</td>
                        <td className="px-4 py-3 text-slate-550 dark:text-slate-450 italic break-words max-w-[220px]">{p.contextual_sentence}</td>
                      </tr>
                    ))
                  ) : null}

                  {/* Patterns rendering in Preview */}
                  {includePatternsAnki && data.sentence_patterns && data.sentence_patterns.length > 0 ? (
                    data.sentence_patterns.map((s, i) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors bg-amber-50/10 dark:bg-amber-950/10">
                        <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-500 border-r border-slate-150 dark:border-slate-800 font-bold">F{i + 1}</td>
                        <td className="px-4 py-3 border-r border-slate-150 dark:border-slate-800 text-amber-900 dark:text-amber-300 font-mono break-all max-w-[150px] text-[11px] font-bold">{s.pattern_structure}</td>
                        <td className="px-4 py-3 border-r border-slate-150 dark:border-slate-800 text-slate-705 dark:text-slate-350 break-words max-w-[200px] font-semibold text-amber-800 dark:text-amber-500">Purpose: {s.functional_purpose}</td>
                        <td className="px-4 py-3 text-slate-550 dark:text-slate-450 italic break-words max-w-[220px]">{s.contextual_sentence}</td>
                      </tr>
                    ))
                  ) : null}

                  {/* Default fallback */}
                  {(!includeVocabAnki || !data.vocabulary_blocks?.length) &&
                   (!includePhrasesAnki || !data.phrase_blocks?.length) &&
                   (!includePatternsAnki || !data.sentence_patterns?.length) && (
                     <tr>
                       <td colSpan={4} className="px-4 py-8 text-center text-slate-450 dark:text-slate-500 font-medium italic bg-slate-50 dark:bg-slate-950 text-xs">
                         No source vocabulary columns selected. Choose toggles above to preview dataset structure sample.
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick CSV Syntax Output Terminal Box */}
            <div className="space-y-1.5 pt-1 text-left">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-mono">Raw File CSV Row Samples:</span>
              <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-[150px] leading-relaxed text-left border border-slate-900">
                <code>
                  {generateAnkiCSV().split("\n").slice(0, 5).join("\n")}
                  {"\n"}... (truncated preview - Download CSV to export full dataset)
                </code>
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border text-left border-gray-200 rounded-2xl p-8 sm:p-12 shadow-xs space-y-8 max-w-3xl mx-auto print-page">
          <div className="border-b-4 border-slate-900 pb-5 space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Linguistic Corpus study list / homework
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 self-center sm:self-auto">
                {data.meta_data.target_level} Level
              </span>
            </div>
            <h1 className="text-3xl font-display font-extrabold text-slate-900">
              {data.meta_data.title}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
              <span>Category: <strong className="text-slate-800">{data.meta_data.category}</strong></span>
              <span>Source: <strong className="text-slate-800">{data.meta_data.source}</strong></span>
              <span>Generated in LexiPrep Corpus Labs</span>
            </div>
          </div>

          {/* Section A: Words */}
          {includeVocab && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                <span>Section 1: Academic Vocabulary Core Study</span>
                <span className="text-[10px] font-mono font-medium text-gray-400 no-print">
                  {isStudentMode ? "Student Mode" : "Teacher Key Mode"}
                </span>
              </h2>
              <div className="divide-y divide-gray-150">
                {data.vocabulary_blocks?.map((block, index) => (
                  <div key={block.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5 print-avoid-break">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400">0{index + 1}.</span>
                      <h3 className="text-base font-bold text-slate-900">
                        <LatexRenderer text={block.item} enabled={includeLatex} />
                      </h3>
                      <span className="text-xs italic text-slate-500">({block.part_of_speech})</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      <strong className="text-slate-900 font-semibold block sm:inline mr-1">Definition:</strong>
                      <LatexRenderer text={block.definition_en} enabled={includeLatex} />
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong className="text-slate-800 font-semibold italic block sm:inline mr-1">Contextual sentence:</strong>
                      "<LatexRenderer text={block.contextual_sentence} enabled={includeLatex} />"
                    </p>
                    {!isStudentMode ? (
                      <p className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-emerald-700 font-bold block sm:inline mr-1">Writer Model:</strong>
                        <LatexRenderer text={block.academic_example} enabled={includeLatex} />
                      </p>
                    ) : (
                      <div className="py-2.5">
                        <span className="text-xs text-slate-400 block font-semibold mb-1 uppercase tracking-wider text-[9px]">Your Custom Sentence Practice:</span>
                        <div className="border-b border-dashed border-gray-300 pt-7 w-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Phrases */}
          {includePhrases && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                <span>Section 2: Lexical Phrases & Collocations</span>
                <span className="text-[10px] font-mono font-medium text-gray-400 no-print">
                  {isStudentMode ? "Student Mode" : "Teacher Key Mode"}
                </span>
              </h2>
              <div className="divide-y divide-gray-150">
                {data.phrase_blocks?.map((block, index) => (
                  <div key={block.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5 print-avoid-break">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400">0{index + 1}.</span>
                      <h3 className="text-base font-bold text-slate-900">
                        <LatexRenderer text={block.item} enabled={includeLatex} />
                      </h3>
                    </div>
                    <p className="text-xs text-slate-700">
                      <strong className="text-slate-900 font-medium block sm:inline mr-1">Grammar/Explanation:</strong>
                      <LatexRenderer text={block.definition_en} enabled={includeLatex} />
                    </p>
                    <p className="text-xs text-slate-500">
                      <strong className="text-slate-800 font-medium italic block sm:inline mr-1">Contextual sentence:</strong>
                      "<LatexRenderer text={block.contextual_sentence} enabled={includeLatex} />"
                    </p>
                    {!isStudentMode ? (
                      <p className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-indigo-700 font-bold block sm:inline mr-1">Writer Model:</strong>
                        <LatexRenderer text={block.academic_example} enabled={includeLatex} />
                      </p>
                    ) : (
                      <div className="py-2.5">
                        <span className="text-xs text-slate-400 block font-semibold mb-1 uppercase tracking-wider text-[9px]">Your Custom Sentence Practice:</span>
                        <div className="border-b border-dashed border-gray-300 pt-7 w-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section C: Patterns */}
          {includePatterns && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800 border-b border-gray-200 pb-2 flex justify-between items-center">
                <span>Section 3: Productive Sentence Structures</span>
                <span className="text-[10px] font-mono font-medium text-gray-400 no-print">
                  {isStudentMode ? "Student Mode" : "Teacher Key Mode"}
                </span>
              </h2>
              <div className="space-y-4">
                {data.sentence_patterns?.map((block, index) => (
                  <div key={block.id} className="p-4 bg-slate-50/50 rounded-xl border border-gray-150 space-y-2 print-avoid-break">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-800">Formula [P{index + 1}]</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Purpose: <LatexRenderer text={block.functional_purpose} enabled={includeLatex} />
                      </span>
                    </div>

                    <p className="font-mono text-xs text-amber-950 font-semibold bg-white p-2.5 rounded-lg border border-amber-100">
                      <LatexRenderer text={block.pattern_structure} enabled={includeLatex} />
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1.5">
                      <div>
                        <strong className="text-slate-500 block uppercase text-[9px] font-bold tracking-wider mb-0.5">Occurrence in Text</strong>
                        <p className="italic text-slate-600 leading-relaxed">
                          "<LatexRenderer text={block.contextual_sentence} enabled={includeLatex} />"
                        </p>
                      </div>
                      <div>
                        <strong className="text-amber-800 block uppercase text-[9px] font-bold tracking-wider mb-0.5">
                          {isStudentMode ? "Synthesis Sentence Output Practice" : "Authentic Student Output Model"}
                        </strong>
                        {!isStudentMode ? (
                          <p className="font-medium text-slate-900 leading-relaxed">
                            <LatexRenderer text={block.academic_example} enabled={includeLatex} />
                          </p>
                        ) : (
                          <div className="space-y-2.5 pt-1.5">
                            <div className="border-b border-dashed border-gray-300 pb-1 w-full"></div>
                            <div className="border-b border-dashed border-gray-300 pb-1 w-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section D: Active Production Worksheet (Blanks) */}
          {includePractice && (
            <div className="space-y-5 pt-6 print-break-before">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                  Section 4: Active Writing Practice Exercises
                </h2>
                <p className="text-xs text-gray-500">Provide complete academic sentence output utilizing the specified curriculum structures</p>
              </div>

              <div className="space-y-6">
                {data.vocabulary_blocks?.slice(0, 3).map((w, index) => (
                  <div key={w.id} className="space-y-2 print-avoid-break">
                    <p className="text-xs text-slate-800 font-semibold">
                      Exercise 1.{index + 1}: Write an academic sentence containing the word <strong className="text-emerald-700 font-bold">"<LatexRenderer text={w.item} enabled={includeLatex} />"</strong> ({w.part_of_speech}), showing an active understanding of its formal semantic meaning.
                    </p>
                    <div className="border-b border-gray-350 pt-8 w-full"></div>
                  </div>
                ))}

                {data.sentence_patterns?.slice(0, 2).map((s, index) => (
                  <div key={s.id} className="space-y-2 pt-2 print-avoid-break">
                    <p className="text-xs text-slate-800 font-semibold">
                      Exercise 2.{index + 1}: Construct a complex sentence related to biotechnology, economics, or environmental sciences using the structure:
                    </p>
                    <p className="font-mono text-xs text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-100">
                      <LatexRenderer text={s.pattern_structure} enabled={includeLatex} />
                    </p>
                    <div className="border-b border-gray-350 pt-8 w-full"></div>
                    <div className="border-b border-gray-350 pt-8 w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!includeVocab && !includePhrases && !includePatterns && !includePractice && (
            <div className="py-16 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl space-y-3.5 no-print">
              <AlertCircle className="h-9 w-9 text-slate-400 mx-auto" strokeWidth={1.5} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">All curriculum sections are deselected</p>
                <p className="text-xs text-gray-400">Please toggle at least one section in the configuration panel above to construct custom worksheets.</p>
              </div>
            </div>
          )}

          <div className="pt-10 border-t border-gray-250 text-center text-[10px] text-gray-400 font-mono">
            <span>© 2026 Academic English Corpus Labs. Licensed for educational purposes.</span>
          </div>
        </div>
      )}
    </div>
  );
}

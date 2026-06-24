import React, { useState } from "react";
import { ACADEMIC_SAMPLES, AcademicSample } from "../data/samples";
import { Sparkles, FileText, Settings, HelpCircle, GraduationCap } from "lucide-react";

interface TextAnalysisFormProps {
  onSubmit: (data: {
    text: string;
    targetLevel: string;
    title: string;
    source: string;
    category: string;
    density: "low" | "standard" | "high";
  }) => void;
  isLoading: boolean;
}

export default function TextAnalysisForm({ onSubmit, isLoading }: TextAnalysisFormProps) {
  const [text, setText] = useState("");
  const [targetLevel, setTargetLevel] = useState("IELTS");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [density, setDensity] = useState<"low" | "standard" | "high">("standard");

  const handleSelectSample = (sample: AcademicSample) => {
    setText(sample.text);
    setTargetLevel(sample.target_level);
    setTitle(sample.title);
    setSource(sample.source);
    setCategory(sample.category);
  };

  const getWordCount = () => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({ text, targetLevel, title, source, category, density });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="px-6 py-5 bg-linear-to-r from-gray-900 to-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-emerald-400" />
          <div>
            <h2 id="form-heading" className="text-lg font-display font-semibold tracking-tight text-white leading-tight">
              Create New Corpus Analysis
            </h2>
            <p className="text-xs text-gray-300">Submit a passage to pull curriculum vocabulary, lexical bundles, and structural syntax</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono uppercase tracking-wide text-emerald-300">Corpus Engine Active</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">
            Quick-Load High-Stakes Target Samples
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ACADEMIC_SAMPLES.map((sample) => {
              const isActive = text === sample.text;
              return (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all duration-200 group relative flex flex-col justify-between h-24 ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                      : "border-gray-250 hover:border-gray-400 bg-gray-50 hover:bg-gray-100/70"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-900 text-white leading-none">
                        {sample.target_level}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate max-w-[100px]" title={sample.category}>
                        {sample.category}
                      </span>
                    </div>
                    <p className="font-medium text-gray-950 line-clamp-2 leading-tight py-0.5 group-hover:text-emerald-700 transition-colors">
                      {sample.title}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-gray-400 truncate block mt-1 w-full" title={sample.source}>
                    {sample.source}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-8 space-y-4">
            <div>
              <label htmlFor="source-text" className="block text-sm font-semibold text-gray-800 mb-1.5">
                Passage / Reading Selection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="source-text"
                rows={9}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your essay, editorial, journal segment, or reading target here (e.g., 100 to 1000 words)..."
                className="w-full px-4 py-3 rounded-xl border border-gray-250 font-sans text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder-gray-400 transition-all bg-white"
              ></textarea>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5 px-1 font-mono">
                <span>Word count: <strong className="text-gray-800">{getWordCount()}</strong></span>
                <span>Min suggested: 50 words</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 bg-slate-50/70 rounded-xl p-5 border border-gray-100 flex flex-col justify-between space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-slate-500" />
              Extraction Metrics
            </h3>

            <div className="space-y-3.5">
              <div>
                <label htmlFor="target-level" className="block text-xs font-medium text-gray-700 mb-1">
                  Target Proficiency Level
                </label>
                <select
                  id="target-level"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="KET">KET (A2 Basic Key)</option>
                  <option value="PET">PET (B1 Intermediate Preliminary)</option>
                  <option value="FCE">FCE (B2 Upper-Int First Certificate)</option>
                  <option value="CAE">CAE (C1 Advanced Certificate)</option>
                  <option value="IELTS">IELTS (Academic High Band)</option>
                  <option value="TOEFL">TOEFL iBT (University/Academic)</option>
                  <option value="GRE">GRE (Verbal Graduate-Level)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Extraction Density (提取密度)</span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-800 leading-none">
                    {density === "low" ? "Low Focus" : density === "high" ? "High Exhaustive" : "Standard"}
                  </span>
                </label>
                
                <div className="px-1.5 py-3 bg-slate-50/50 rounded-xl border border-gray-200/50 space-y-2">
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="1"
                      value={density === "low" ? 0 : density === "high" ? 2 : 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val === 0) setDensity("low");
                        else if (val === 2) setDensity("high");
                        else setDensity("standard");
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 px-0.5">
                    <button
                      type="button"
                      onClick={() => setDensity("low")}
                      className={`hover:text-gray-900 transition-colors cursor-pointer ${
                        density === "low" ? "text-emerald-700 font-extrabold" : ""
                      }`}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setDensity("standard")}
                      className={`hover:text-gray-900 transition-colors cursor-pointer ${
                        density === "standard" ? "text-emerald-700 font-extrabold" : ""
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setDensity("high")}
                      className={`hover:text-gray-900 transition-colors cursor-pointer ${
                        density === "high" ? "text-emerald-700 font-extrabold" : ""
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>

                <p className="text-[9.5px] text-gray-400 mt-1 leading-normal">
                  {density === "low" && "🎯 Parses 3+ core words, 2+ phrases, 1+ syntax patterns."}
                  {density === "standard" && "⚖️ Parses 5+ words, 4+ phrases, 3+ syntax patterns."}
                  {density === "high" && "📚 Deep corpus scan: 12+ words, 8+ phrases, 5+ patterns."}
                </p>
              </div>

              <div>
                <label htmlFor="text-title" className="block text-xs font-medium text-gray-700 mb-1">
                  Custom Title (Optional)
                </label>
                <input
                  id="text-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bio-Ethics Reading"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="text-source" className="block text-xs font-medium text-gray-700 mb-1">
                  Custom Source/Author (Optional)
                </label>
                <input
                  id="text-source"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Nature Mag, IELTS book"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="text-category" className="block text-xs font-medium text-gray-700 mb-1">
                  Thematic Category (Optional)
                </label>
                <input
                  id="text-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Biology, Ecology, Arts"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className={`w-full py-2 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLoading || !text.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/15 accent-emerald-500 ring-2 ring-emerald-500/10 hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              <Sparkles className="h-4 w-4 animate-pulse text-emerald-300" />
              {isLoading ? "Running Extraction..." : "Analyze & Extract"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

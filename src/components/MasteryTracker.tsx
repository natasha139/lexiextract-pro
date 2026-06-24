import React, { useState, useEffect } from "react";
import { CorpusAnalysisResult } from "../types";
import { 
  TrendingUp, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Flame, 
  Check, 
  Clock, 
  Activity, 
  BookMarked,
  Sparkles,
  RefreshCw,
  Info
} from "lucide-react";

interface SessionLog {
  id: string;
  sessionName: string;
  date: string;
  wordsRecalled: number;
  totalWords: number;
  accuracy: number; // percentage
}

interface MasteryTrackerProps {
  data: CorpusAnalysisResult;
  masteredIds: Set<string>;
  onToggleMastered: (id: string) => void;
}

export default function MasteryTracker({ data, masteredIds, onToggleMastered }: MasteryTrackerProps) {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [customSessionName, setCustomSessionName] = useState("");
  const [customWordsRecalled, setCustomWordsRecalled] = useState(3);
  const [customTotalWords, setCustomTotalWords] = useState(5);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const totalVocabWords = data.vocabulary_blocks?.length || 0;
  const masteredVocabCount = data.vocabulary_blocks?.filter(v => masteredIds.has(v.id)).length || 0;
  const currentMasteryPercent = totalVocabWords > 0 ? Math.round((masteredVocabCount / totalVocabWords) * 105) : 0; // standard mastery index

  // Load session logs with smart pre-population for testing
  useEffect(() => {
    const saved = localStorage.getItem("corpus_mastery_session_logs");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved session logs:", e);
      }
    } else {
      // Default beautiful demo sessions to let the line chart shine on first click!
      const initialLogs: SessionLog[] = [
        {
          id: "log-1",
          sessionName: "Orientation Check",
          date: "2026-06-18",
          wordsRecalled: 1,
          totalWords: 5,
          accuracy: 20
        },
        {
          id: "log-2",
          sessionName: "Self-Review #1",
          date: "2026-06-19",
          wordsRecalled: 2,
          totalWords: 5,
          accuracy: 40
        },
        {
          id: "log-3",
          sessionName: "Context matching",
          date: "2026-06-20",
          wordsRecalled: 4,
          totalWords: 6,
          accuracy: 66
        },
        {
          id: "log-4",
          sessionName: "Active Recall Run",
          date: "2026-06-21",
          wordsRecalled: 5,
          totalWords: 6,
          accuracy: 83
        },
        {
          id: "log-5",
          sessionName: "Morning Mock Quiz",
          date: "2026-06-22",
          wordsRecalled: 7,
          totalWords: 8,
          accuracy: 87
        }
      ];
      setSessions(initialLogs);
      localStorage.setItem("corpus_mastery_session_logs", JSON.stringify(initialLogs));
    }
  }, []);

  // Save session logs when modified
  const saveSessions = (updatedLogs: SessionLog[]) => {
    setSessions(updatedLogs);
    localStorage.setItem("corpus_mastery_session_logs", JSON.stringify(updatedLogs));
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customSessionName.trim() || `Recall Check #${sessions.length + 1}`;
    const newLog: SessionLog = {
      id: "log-" + Date.now(),
      sessionName: name,
      date: new Date().toISOString().split("T")[0],
      wordsRecalled: Math.min(customWordsRecalled, customTotalWords),
      totalWords: customTotalWords,
      accuracy: Math.round((Math.min(customWordsRecalled, customTotalWords) / customTotalWords) * 100)
    };

    const next = [...sessions, newLog];
    saveSessions(next);
    setCustomSessionName("");
    setIsAddingLog(false);
    setSelectedPointIndex(next.length - 1);
  };

  const handleDeleteSession = (id: string) => {
    const next = sessions.filter(s => s.id !== id);
    saveSessions(next);
    if (selectedPointIndex !== null && selectedPointIndex >= next.length) {
      setSelectedPointIndex(next.length > 0 ? next.length - 1 : null);
    }
  };

  const handleResetSessions = () => {
    if (confirm("Are you sure you want to revert all session history to baseline demos?")) {
      localStorage.removeItem("corpus_mastery_session_logs");
      window.location.reload();
    }
  };

  const handleLogCurrentState = () => {
    // Automatically capture the user's current card mastery state as a logged session
    const totalCurrentWordCards = data.vocabulary_blocks?.length || 0;
    const masteredCurrentCount = data.vocabulary_blocks?.filter(v => masteredIds.has(v.id)).length || 0;
    
    const newLog: SessionLog = {
      id: "log-" + Date.now(),
      sessionName: `Dashboard Auto-Capture`,
      date: new Date().toISOString().split("T")[0],
      wordsRecalled: masteredCurrentCount,
      totalWords: totalCurrentWordCards || 5,
      accuracy: totalCurrentWordCards > 0 ? Math.round((masteredCurrentCount / totalCurrentWordCards) * 100) : 100
    };

    const next = [...sessions, newLog];
    saveSessions(next);
    setSelectedPointIndex(next.length - 1);
  };

  // SVG Line Chart Constants & Coordinates
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const drawableWidth = chartWidth - paddingX * 2;
  const drawableHeight = chartHeight - paddingY * 2;

  // Generate points list
  const points = sessions.map((s, index) => {
    const x = sessions.length > 1 
      ? paddingX + (index / (sessions.length - 1)) * drawableWidth 
      : paddingX + drawableWidth / 2;
    
    // Normalise accuracy (0 to 100) on the Y axis
    // 0% at bottom (chartHeight - paddingY), 100% at top (paddingY)
    const normalizedY = s.accuracy / 100;
    const y = chartHeight - paddingY - normalizedY * drawableHeight;
    return { x, y, session: s, index };
  });

  // SVG Path generation
  let lPath = "";
  let areaPath = "";
  if (points.length > 1) {
    lPath = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");

    // Create shadow area path
    areaPath = `${lPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  // Get active selected card meta-data for detail rendering
  const activeDetailSession = selectedPointIndex !== null && sessions[selectedPointIndex] 
    ? sessions[selectedPointIndex] 
    : sessions[sessions.length - 1];

  return (
    <div className="space-y-6">
      {/* Upper Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">Current Mastery Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">{masteredVocabCount}</span>
              <span className="text-xs text-gray-400">/ {totalVocabWords} items</span>
            </div>
            <p className="text-[10.5px] text-gray-500">
              Unique academic terms checked & fully logged.
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">Multi-session Strength</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">
                {sessions.length > 0 ? `${Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length)}%` : "0%"}
              </span>
              <span className="text-xs text-emerald-600 font-bold">Avg Recalled</span>
            </div>
            <p className="text-[10.5px] text-gray-500">
              Average accuracy recorded over {sessions.length} sessions.
            </p>
          </div>
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">Daily Review Streak</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">5 Days</span>
              <span className="text-xs text-amber-600 font-bold">Active Streak</span>
            </div>
            <p className="text-[10.5px] text-gray-500">
              Maintain daily reviews to fortify neuro-retention.
            </p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100 flex items-center justify-center">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Graph Content Panel */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Dynamic Line Chart Display Area */}
        <div className="p-6 lg:col-span-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-200/80">
          <div className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 font-sans">Active Recall Mastery Curve</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogCurrentState}
                  disabled={totalVocabWords === 0}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Logs your current flashcards mastered state as a new session checkpoint"
                >
                  <Plus className="h-3 w-3" />
                  Auto-Log Current State
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingLog(!isAddingLog)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-gray-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Calendar className="h-3 w-3" />
                  Add Manual Log
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              This line chart displays active recall accuracy ratios (%) analyzed across sequential training runs. Hover over or tap circles to isolate metrics.
            </p>
          </div>

          {/* SVG Canvas rendering the interactive line chart */}
          <div className="relative w-full aspect-video sm:aspect-auto sm:h-[240px] flex items-center justify-center bg-slate-50/50 rounded-xl border border-gray-150/50 p-2 overflow-hidden">
            {sessions.length === 0 ? (
              <div className="text-center space-y-2 p-6">
                <Info className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs text-gray-500 font-medium">No recorded session coordinates available. Click 'Add Manual Log' or use auto-cap above!</p>
              </div>
            ) : (
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full max-h-[230px] font-mono select-none"
              >
                {/* SVG Definitions for premium gradients */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                  </linearGradient>
                  <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Reference Gridlines */}
                {[0, 25, 50, 75, 100].map((gridPercent) => {
                  const yVal = chartHeight - paddingY - (gridPercent / 100) * drawableHeight;
                  return (
                    <g key={gridPercent} className="opacity-70">
                      <line 
                        x1={paddingX} 
                        y1={yVal} 
                        x2={chartWidth - paddingX} 
                        y2={yVal} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={paddingX - 10} 
                        y={yVal + 3} 
                        textAnchor="end" 
                        fontSize="8px" 
                        fill="#94a3b8" 
                        fontWeight="bold"
                      >
                        {gridPercent}%
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Session Label indicators */}
                {sessions.map((s, index) => {
                  const xVal = sessions.length > 1 
                    ? paddingX + (index / (sessions.length - 1)) * drawableWidth 
                    : paddingX + drawableWidth / 2;
                  return (
                    <text
                      key={s.id}
                      x={xVal}
                      y={chartHeight - paddingY + 16}
                      textAnchor="middle"
                      fontSize="7.5px"
                      fill="#64748b"
                      fontWeight="500"
                      className="max-w-[40px] truncate"
                    >
                      {index + 1}
                    </text>
                  );
                })}

                {/* Line shadow gradient path */}
                {points.length > 1 && (
                  <path d={areaPath} fill="url(#chartGradient)" />
                )}

                {/* The central main curve line path */}
                {points.length > 1 ? (
                  <path 
                    d={lPath} 
                    fill="none" 
                    stroke="url(#chartLineGradient)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-xs"
                  />
                ) : points.length === 1 ? (
                  /* Single point fallback straight line across */
                  <line 
                    x1={paddingX} 
                    y1={points[0].y} 
                    x2={chartWidth - paddingX} 
                    y2={points[0].y} 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    strokeDasharray="2 2"
                  />
                ) : null}

                {/* Interactive coordinate points circles */}
                {points.map((pt) => {
                  const isHoveredOrSelected = selectedPointIndex === pt.index;
                  return (
                    <g key={pt.session.id}>
                      {/* Interactive broad hit target circle (for tap/hover ease) */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setSelectedPointIndex(pt.index)}
                        onClick={() => setSelectedPointIndex(pt.index)}
                      />
                      {/* Secondary halo circle with animation properties on focus */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHoveredOrSelected ? "8" : "4.5"}
                        fill={isHoveredOrSelected ? "#10b981" : "#059669"}
                        fillOpacity={isHoveredOrSelected ? "0.35" : "1"}
                        className="transition-all duration-150 pointer-events-none"
                      />
                      {/* Core center coordinate highlight dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHoveredOrSelected ? "4.5" : "2.5"}
                        fill={isHoveredOrSelected ? "#ffffff" : "#ffffff"}
                        stroke={isHoveredOrSelected ? "#047857" : "none"}
                        strokeWidth={isHoveredOrSelected ? "2.5" : "0"}
                        className="transition-all duration-150 pointer-events-none"
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Quick Legend information */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold pt-2">
            <span>xAxis: Assessment Session Index ({sessions.length} logged)</span>
            <span className="flex items-center gap-1.5 leading-none">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Active Recall Accuracy Curve
            </span>
          </div>
        </div>

        {/* Selected Data Point Detail Panel */}
        <div className="p-6 lg:col-span-4 bg-slate-50/70 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
                Session Inspection
              </h4>
              <span className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-tight bg-gray-200 px-2 py-0.5 rounded">
                Index #{selectedPointIndex !== null ? selectedPointIndex + 1 : sessions.length}
              </span>
            </div>

            {activeDetailSession ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider font-mono">Session Name</span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {activeDetailSession.sessionName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-250/60 shadow-2xs space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase font-mono">Performance</span>
                    <p className="text-base font-extrabold text-emerald-800">
                      {activeDetailSession.accuracy}%
                    </p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-250/60 shadow-2xs space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase font-mono">Count (Recalled)</span>
                    <p className="text-sm font-bold text-slate-800">
                      <strong className="text-slate-950 font-bold">{activeDetailSession.wordsRecalled}</strong> / {activeDetailSession.totalWords}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 bg-white border border-gray-150 p-2.5 rounded-xl text-[11px] leading-relaxed text-gray-600">
                  <span className="text-[9px] font-bold uppercase text-slate-500 block font-mono">Analysis Assessment</span>
                  <p>
                    {activeDetailSession.accuracy >= 80 && "🥇 Outstanding retention! The candidate demonstrated nearly flawless cognitive retrieval."}
                    {activeDetailSession.accuracy >= 50 && activeDetailSession.accuracy < 80 && "⚖️ Stable progress. Continuing spaced repetitions of these items is advised."}
                    {activeDetailSession.accuracy < 50 && "⚠️ High cognitive load or rapid forgetting detected. Retesting within 12 hours is highly recommended."}
                  </p>
                </div>

                {/* Date stamps formatting */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Logged Date: {activeDetailSession.date}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No session highlighted. Click on any coordinate point chart vertex to view contextual analysis logs.</p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-200 flex justify-between gap-2.5">
            <button
              onClick={handleResetSessions}
              className="text-[10px] uppercase font-bold tracking-tight text-gray-400 hover:text-red-700 transition-colors flex items-center gap-1 font-mono cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Baselines
            </button>
            {activeDetailSession && (
              <button
                onClick={() => handleDeleteSession(activeDetailSession.id)}
                className="text-[10px] uppercase font-bold tracking-tight text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 font-mono cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Remove session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slideout overlay drawer state for manually logging custom sessions */}
      {isAddingLog && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4 animate-fadeIn/10 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-400" />
              Log Spaced Study Session Baseline
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingLog(false)}
              className="text-xs text-gray-400 hover:text-yellow-400"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddSession} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1 md:col-span-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Session Identifier</label>
              <input
                type="text"
                required
                placeholder="e.g. Speed run review"
                value={customSessionName}
                onChange={(e) => setCustomSessionName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Words Recalled</label>
              <input
                type="number"
                min="0"
                max={customTotalWords}
                required
                value={customWordsRecalled}
                onChange={(e) => setCustomWordsRecalled(Math.max(0, parseInt(e.target.value, 10)))}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Evaluated</label>
              <input
                type="number"
                min="1"
                required
                value={customTotalWords}
                onChange={(e) => setCustomTotalWords(Math.max(1, parseInt(e.target.value, 10)))}
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 transition-colors text-xs font-bold text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Record Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vocabulary items listing with quick toggler status */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="border-b border-gray-150 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
              <BookMarked className="h-4 w-4 text-emerald-600" />
              Direct Vocabulary Mastery Table
            </h3>
            <p className="text-xs text-gray-500">
              Select or check terms as "Mastered" to synchronize parameters with Active Recall study cards.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-1 bg-slate-100 border border-gray-200 rounded text-slate-700">
            Current: {masteredVocabCount} mastered / {totalVocabWords} total
          </span>
        </div>

        {totalVocabWords === 0 ? (
          <p className="text-xs text-gray-400 italic py-4 text-center">No vocabulary blocks extracted. Please submit or select a live academic corpus piece to populate values.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.vocabulary_blocks?.map((block) => {
              const isMastered = masteredIds.has(block.id);
              return (
                <div 
                  key={block.id}
                  onClick={() => onToggleMastered(block.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 justify-between ${
                    isMastered 
                      ? "bg-emerald-50/70 border-emerald-200 text-slate-900" 
                      : "bg-slate-50/50 hover:bg-slate-50 border-gray-200/80 text-slate-700 hover:border-gray-300"
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold font-sans text-slate-900 truncate">
                        {block.item}
                      </h4>
                      <span className="text-[8.5px] uppercase font-semibold font-mono tracking-wider opacity-60">
                        ({block.part_of_speech})
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-1">
                      {block.definition_en}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isMastered 
                        ? "bg-emerald-600 border-emerald-600 text-white" 
                        : "border-gray-350 bg-white hover:border-emerald-500"
                    }`}
                  >
                    {isMastered && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

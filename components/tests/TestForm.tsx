"use client";

import { useState, useMemo } from "react";
import { TEST_CONFIGS, TestType, TestConfig } from "./TestConfig";

interface TestFormProps {
  testType: TestType;
  initialAnswers?: Record<string, number>;
  onSubmit: (testType: TestType, results: Record<string, number>) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function TestForm({ testType, initialAnswers = {}, onSubmit, onCancel, saving }: TestFormProps) {
  const config = TEST_CONFIGS[testType];
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    const a: Record<string, number> = {};
    config.items.forEach(item => {
      a[item.id] = initialAnswers[item.id] ?? config.scaleMin;
    });
    return a;
  });

  const scores = useMemo(() => config.calculateScores(answers), [answers, config]);

  const handleSelect = (itemId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = () => {
    onSubmit(testType, { ...answers, ...scores });
  };

  return (
    <div className="space-y-4 pb-2">
      <div className="text-xs text-slate-400 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="font-bold text-primary uppercase tracking-widest text-[10px] mb-1">{config.label}</p>
        <p>{config.description}</p>
        <p className="mt-1">Seleccioná el nivel que mejor describa tu situación.</p>
      </div>

      {config.items.map((item) => (
        <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug mb-3">{item.label}</p>
          <SegmentedBar
            segments={config.segments}
            min={config.scaleMin}
            max={config.scaleMax}
            labels={config.scaleLabels}
            value={answers[item.id]}
            onChange={(val) => handleSelect(item.id, val)}
          />
        </div>
      ))}

      {/* Calculated Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {Object.entries(scores)
          .filter(([k]) => k !== 'total' && !config.items.some(i => i.id === k))
          .map(([key, val]) => (
            <div key={key} className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-primary uppercase text-center mb-1">{key}</span>
              <span className="text-xl font-black text-primary">{String(val)}</span>
            </div>
          ))}
        <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase text-center mb-1">Total</span>
          <span className="text-xl font-black text-slate-700 dark:text-white">{scores.total ?? scores.avg ?? '-'}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all">Cancelar</button>
        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? "Guardando..." : "Guardar Test"}
        </button>
      </div>
    </div>
  );
}

function SegmentedBar({ segments, min, max, labels, value, onChange }: {
  segments: number;
  min: number;
  max: number;
  labels: string[];
  value: number;
  onChange: (val: number) => void;
}) {
  // Each segment represents one discrete value
  const step = (max - min + 1) / segments;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => {
          const segmentValue = min + i;
          const isActive = segmentValue <= value;
          const isSelected = segmentValue === value;
          return (
            <button
              key={i}
              onClick={() => onChange(segmentValue)}
              className={`flex-1 h-8 rounded-lg transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : isActive
                    ? 'bg-primary/40 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <span className="text-[10px] font-bold">{segmentValue}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        {labels.map((label, i) => (
          <span key={i} className="text-[9px] text-slate-400 leading-tight text-center" style={{ width: `${100 / labels.length}%` }}>{label}</span>
        ))}
      </div>
    </div>
  );
}

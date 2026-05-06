"use client";

import { useState, useEffect } from "react";
import { TestType, getTestDefinition, calculateScores } from "@/lib/test-definitions";

interface TestFormProps {
  pacienteId: string;
  testType: TestType;
  onSave: () => void;
  onCancel: () => void;
}

export default function TestForm({ pacienteId, testType, onSave, onCancel }: TestFormProps) {
  const def = getTestDefinition(testType);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Initialize responses
  useEffect(() => {
    const initial: Record<string, number> = {};
    def.items.forEach(item => {
      initial[item.id] = def.scale.values[0];
    });
    setResponses(initial);
  }, [testType, def]);

  const handleResponse = (id: string, value: number) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const scores = calculateScores(testType, responses);
      
      const res = await fetch(`/api/pacientes/${pacienteId}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          responses,
          totalScore: scores.total,
          subScores: scores
        })
      });

      if (!res.ok) throw new Error("Error al guardar");
      
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
        <h3 className="text-sm font-bold text-primary">{def.title}</h3>
        <p className="text-[11px] text-slate-500 mt-1">{def.description}</p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {def.items.map((item, idx) => (
          <div key={item.id} className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex gap-3 mb-4">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{item.label}</p>
            </div>

            {/* Scale labels ABOVE for non-SPADI tests */}
            {def.scale.segments <= 7 && (
              <div className="flex gap-1 mb-2 px-0.5">
                {def.scale.labels.map((label, lIdx) => (
                  <div key={lIdx} className="flex-1 text-[8px] leading-[10px] text-slate-400 text-center flex items-end justify-center min-h-[24px] px-0.5">
                    {label}
                  </div>
                ))}
              </div>
            )}

            {/* Segmented Selector */}
            <div className="flex gap-1">
              {def.scale.values.map((val, vIdx) => {
                const isSelected = responses[item.id] === val;
                
                return (
                  <button
                    key={vIdx}
                    onClick={() => handleResponse(item.id, val)}
                    className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10' 
                        : 'bg-white dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary/30'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>

            {/* Scale labels BELOW for SPADI (large scales) */}
            {def.scale.segments > 7 && (
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[9px] text-slate-400">{def.scale.labels[0]}</span>
                <span className="text-[9px] text-slate-400 text-right">{def.scale.labels[1]}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500 text-center font-bold">{error}</p>}

      <div className="flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">save</span>}
          {saving ? 'Guardando...' : 'Guardar Evaluación'}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TestType, TEST_DEFINITIONS, TEST_TYPES_LIST, calculateScores, getTestDefinition } from "@/lib/test-definitions";
import TestForm from "./TestForm";

interface PatientTest {
  id: string;
  pacienteId: string;
  testType: TestType;
  responses: Record<string, number>;
  totalScore: number;
  subScores: Record<string, number> | null;
  createdAt: string;
}

interface TestsTabProps {
  pacienteId: string;
}

export default function TestsTab({ pacienteId }: TestsTabProps) {
  const [tests, setTests] = useState<PatientTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'new'>('history');
  const [selectedTestType, setSelectedTestType] = useState<TestType>('SPADI');
  const [filterType, setFilterType] = useState<TestType | 'ALL'>('ALL');

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/tests`);
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleSave = () => {
    fetchTests();
    setActiveTab('history');
  };

  const handleDelete = async (testId: string) => {
    if (!confirm("¿Estás seguro de eliminar este test?")) return;
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/tests/${testId}`, { method: 'DELETE' });
      if (res.ok) fetchTests();
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  const filteredTests = tests.filter(t => filterType === 'ALL' || t.testType === filterType);
  
  // Chart data for progress visualization
  const chartData = tests
    .filter(t => t.testType === (filterType === 'ALL' ? 'SPADI' : filterType))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(t => ({
      fecha: new Date(t.createdAt).toLocaleDateString(),
      puntaje: Math.round(t.totalScore)
    }));

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-500'}`}
        >
          Historial
        </button>
        <button 
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'new' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-500'}`}
        >
          Nueva Evaluación
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-6">
          {/* Filters & Chart */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
              <button 
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${filterType === 'ALL' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-slate-800'}`}
              >
                Todos
              </button>
              {TEST_TYPES_LIST.map(t => (
                <button 
                  key={t.type}
                  onClick={() => setFilterType(t.type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${filterType === t.type ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                >
                  {t.type}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Visualization */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Progreso: {filterType === 'ALL' ? 'SPADI' : filterType}</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} />
                    <XAxis dataKey="fecha" fontSize={10} tick={{ fill: '#888' }} />
                    <YAxis fontSize={10} tick={{ fill: '#888' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      itemStyle={{ color: '#ff6d00' }}
                    />
                    <Bar dataKey="puntaje" fill="#ff6d00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredTests.length === 0 ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">No se encontraron tests registrados.</p>
            ) : (
              filteredTests.map(test => {
                const def = getTestDefinition(test.testType);
                return (
                  <div key={test.id} className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{def.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(test.createdAt).toLocaleDateString()} · Score: <span className="text-primary font-bold">{Math.round(test.totalScore)}%</span></p>
                    </div>
                    <button 
                      onClick={() => handleDelete(test.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Test Selector for new evaluation */}
          <div className="grid grid-cols-2 gap-3">
            {TEST_TYPES_LIST.map(t => (
              <button 
                key={t.type}
                onClick={() => setSelectedTestType(t.type)}
                className={`p-3 rounded-2xl border text-left transition-all ${selectedTestType === t.type ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-slate-800'}`}
              >
                <p className={`text-xs font-bold ${selectedTestType === t.type ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{t.type}</p>
                <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">{t.title}</p>
              </button>
            ))}
          </div>

          <TestForm 
            pacienteId={pacienteId} 
            testType={selectedTestType} 
            onSave={handleSave} 
            onCancel={() => setActiveTab('history')}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Dot } from 'recharts';
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
  
  // Prepare data for the multi-line chart
  const currentTestType = filterType === 'ALL' ? 'SPADI' : filterType;
  const definition = getTestDefinition(currentTestType as TestType);
  
  const typeTests = tests
    .filter(t => t.testType === currentTestType)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Limit to last 5 tests for visual clarity if needed, or show all
  // The user asked for "5 tests" as an example, so we'll show what's available
  const chartData = definition.items.map(item => {
    const node: any = {
      id: item.id,
      label: item.id.toUpperCase(),
      fullName: item.label,
    };
    typeTests.forEach(t => {
      const dateKey = new Date(t.createdAt).toLocaleDateString();
      node[dateKey] = t.responses[item.id] || 0;
    });
    return node;
  });

  const testDates = Array.from(new Set(typeTests.map(t => new Date(t.createdAt).toLocaleDateString())));
  const COLORS = ['#ff6d00', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#eab308'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl max-w-xs">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{item.label}</p>
          <p className="text-xs text-white mb-2 leading-relaxed">{item.fullName}</p>
          <div className="space-y-1 border-t border-white/10 pt-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10px] text-slate-400">{entry.name}</span>
                </div>
                <span className="text-[10px] font-bold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

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
          {typeTests.length > 0 && (
            <div className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Evolución por Pregunta: {currentTestType}</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      fontSize={9} 
                      tick={{ fill: '#888' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      fontSize={9} 
                      tick={{ fill: '#888' }} 
                      axisLine={false}
                      tickLine={false}
                      domain={[0, definition.scale.values[definition.scale.values.length - 1]]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }}
                    />
                    {testDates.map((date, index) => (
                      <Line 
                        key={date}
                        type="monotone"
                        dataKey={date}
                        name={date}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 2, fill: COLORS[index % COLORS.length] }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    ))}
                  </LineChart>
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

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface AdminConfig {
  phone: string | null;
  slotDuration: number;
}

interface Horario {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Excepcion {
  id: string;
  date: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function CalendarConfigPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [config, setConfig] = useState<AdminConfig>({ phone: "", slotDuration: 45 });
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [excepciones, setExcepciones] = useState<Excepcion[]>([]);
  
  const [newExcepcion, setNewExcepcion] = useState({ date: "", isClosed: false, startTime: "", endTime: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const adminStr = localStorage.getItem("admin");
    if (adminStr) {
      const adminObj = JSON.parse(adminStr);
      setAdminId(adminObj.id);
    }
  }, []);

  useEffect(() => {
    if (adminId) {
      fetchData();
    }
  }, [adminId]);

  const fetchData = async () => {
    try {
      const [confRes, horRes, excRes] = await Promise.all([
        fetch(`/api/admin/config?adminId=${adminId}`),
        fetch(`/api/horarios?adminId=${adminId}`),
        fetch(`/api/horarios/excepciones?adminId=${adminId}`)
      ]);
      
      if (confRes.ok) setConfig(await confRes.json());
      if (horRes.ok) setHorarios(await horRes.json());
      if (excRes.ok) setExcepciones(await excRes.json());
    } catch (e) {
      console.error("Error fetching config", e);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, ...config })
      });
      alert("Configuración general guardada");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
    setLoading(false);
  };

  const handleHorariosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/horarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, horarios })
      });
      alert("Horario semanal guardado");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    }
    setLoading(false);
  };

  const addHorario = (day: number) => {
    setHorarios([...horarios, { dayOfWeek: day, startTime: "08:00", endTime: "12:00" }]);
  };

  const removeHorario = (index: number) => {
    setHorarios(horarios.filter((_, i) => i !== index));
  };

  const updateHorario = (index: number, field: keyof Horario, value: string) => {
    const newH = [...horarios];
    newH[index] = { ...newH[index], [field]: value };
    setHorarios(newH);
  };

  const handleAddExcepcion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/horarios/excepciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, ...newExcepcion })
      });
      if (res.ok) {
        setNewExcepcion({ date: "", isClosed: false, startTime: "", endTime: "" });
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleRemoveExcepcion = async (id: string) => {
    if (!confirm("¿Eliminar excepción?")) return;
    try {
      await fetch(`/api/horarios/excepciones?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Configuración de Calendario</h1>
      
      {/* Configuración General */}
      <section className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Ajustes Generales</h2>
        <form onSubmit={handleConfigSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Duración del Turno (minutos)</label>
            <input 
              type="number" 
              value={config.slotDuration} 
              onChange={e => setConfig({...config, slotDuration: Number(e.target.value)})}
              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Teléfono (WhatsApp Notificaciones)</label>
            <input 
              type="text" 
              placeholder="+549..."
              value={config.phone || ""} 
              onChange={e => setConfig({...config, phone: e.target.value})}
              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <button disabled={loading} type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-primary/90 transition-all">Guardar Ajustes</button>
          </div>
        </form>
      </section>

      {/* Horario Semanal */}
      <section className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Horario Base Semanal</h2>
        <form onSubmit={handleHorariosSubmit}>
          <div className="space-y-4 mb-6">
            {DAYS.map((dayName, dayIndex) => {
              const dayHorarios = horarios.filter(h => h.dayOfWeek === dayIndex);
              return (
                <div key={dayIndex} className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold w-24">{dayName}</h3>
                    <button type="button" onClick={() => addHorario(dayIndex)} className="text-xs text-primary font-bold hover:underline">+ Añadir Rango</button>
                  </div>
                  {dayHorarios.length === 0 ? (
                    <p className="text-xs text-slate-500">Sin atención (Cerrado)</p>
                  ) : (
                    <div className="space-y-2">
                      {dayHorarios.map((h, i) => {
                        const globalIndex = horarios.findIndex(x => x === h);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <input type="time" value={h.startTime} onChange={e => updateHorario(globalIndex, 'startTime', e.target.value)} className="bg-slate-100 dark:bg-white/5 rounded p-2 text-sm" />
                            <span>a</span>
                            <input type="time" value={h.endTime} onChange={e => updateHorario(globalIndex, 'endTime', e.target.value)} className="bg-slate-100 dark:bg-white/5 rounded p-2 text-sm" />
                            <button type="button" onClick={() => removeHorario(globalIndex)} className="text-red-500 hover:text-red-700 ml-2">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button disabled={loading} type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-primary/90 transition-all">Guardar Horarios</button>
        </form>
      </section>

      {/* Excepciones (Feriados / Cambios puntuales) */}
      <section className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Excepciones (Feriados y Vacaciones)</h2>
        <form onSubmit={handleAddExcepcion} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-semibold mb-1">Fecha</label>
            <input required type="date" value={newExcepcion.date} onChange={e => setNewExcepcion({...newExcepcion, date: e.target.value})} className="w-full bg-white dark:bg-card-dark rounded p-2 text-sm" />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="isClosed" checked={newExcepcion.isClosed} onChange={e => setNewExcepcion({...newExcepcion, isClosed: e.target.checked})} />
            <label htmlFor="isClosed" className="text-sm font-semibold text-red-500">Día Cerrado</label>
          </div>
          {!newExcepcion.isClosed && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Inicio</label>
                <input required type="time" value={newExcepcion.startTime} onChange={e => setNewExcepcion({...newExcepcion, startTime: e.target.value})} className="w-full bg-white dark:bg-card-dark rounded p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Hora Fin</label>
                <input required type="time" value={newExcepcion.endTime} onChange={e => setNewExcepcion({...newExcepcion, endTime: e.target.value})} className="w-full bg-white dark:bg-card-dark rounded p-2 text-sm" />
              </div>
            </>
          )}
          <div className="md:col-span-4 mt-2">
            <button disabled={loading} type="submit" className="bg-slate-800 text-white dark:bg-white dark:text-black font-bold py-2 px-6 rounded-xl transition-all">Añadir Excepción</button>
          </div>
        </form>

        <div className="space-y-2">
          {excepciones.length === 0 && <p className="text-sm text-slate-500">No hay excepciones configuradas.</p>}
          {excepciones.map(exc => (
            <div key={exc.id} className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-3 rounded-lg">
              <div className="text-sm">
                <strong className="block">{format(new Date(exc.date), 'dd/MM/yyyy')}</strong>
                {exc.isClosed ? <span className="text-red-500 text-xs font-bold">CERRADO</span> : <span className="text-slate-500 text-xs">{exc.startTime} a {exc.endTime}</span>}
              </div>
              <button onClick={() => handleRemoveExcepcion(exc.id)} className="text-red-500 p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

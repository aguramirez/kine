"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface Turno {
  id: string;
  pacienteId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paciente: {
    fullName: string;
    dni: string;
    phone: string | null;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Turno;
}

export default function CalendarioPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
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
      fetchTurnos();
      fetchPacientes();
    }
  }, [adminId]);

  const fetchTurnos = async () => {
    try {
      const res = await fetch(`/api/turnos?adminId=${adminId}`);
      if (res.ok) {
        const turnos: Turno[] = await res.json();
        const formattedEvents = turnos
          .filter((t) => t.status !== "CANCELLED")
          .map((t) => ({
            id: t.id,
            title: `${t.paciente.fullName}`,
            start: new Date(t.startTime),
            end: new Date(t.endTime),
            resource: t,
          }));
        setEvents(formattedEvents);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPacientes = async () => {
    try {
      const res = await fetch(`/api/pacientes?adminId=${adminId}`);
      if (res.ok) {
        setPacientes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowModal(true);
  }, []);

  const handleCreateTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;

    let start, end;

    if (selectedSlot) {
      start = selectedSlot.start;
      end = selectedSlot.end;
    } else if (manualDate && manualTime) {
      start = new Date(`${manualDate}T${manualTime}`);
      end = new Date(start.getTime() + 45 * 60000);
    } else {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          pacienteId: selectedPacienteId,
          date: start.toISOString(),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setSelectedSlot(null);
        setManualDate("");
        setManualTime("");
        setSelectedPacienteId("");
        setLoading(false);
        fetchTurnos();
      } else {
        const err = await res.json();
        alert(err.error || "Error al crear turno");
      }
    } catch (error) {
      console.error(error);
      alert("Error al agendar");
    }
    setLoading(false);
  };

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const handleCancelTurno = async () => {
    if (!selectedEvent) return;
    if (confirm(`¿Cancelar turno de ${selectedEvent.resource.paciente.fullName}? Se le avisará por WhatsApp.`)) {
      try {
        await fetch(`/api/turnos?id=${selectedEvent.id}`, { method: "DELETE" });
        fetchTurnos();
        setShowEventModal(false);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const eventStyleGetter = useCallback(() => ({
    style: {
      backgroundColor: "#ff6d00",
      borderRadius: "8px",
      border: "none",
      color: "#fff",
      fontWeight: 600,
      fontSize: "12px",
      padding: "2px 6px",
      boxShadow: "0 2px 8px rgba(255,109,0,0.3)",
    },
  }), []);

  const dayPropGetter = useCallback((date: Date) => {
    const isToday = new Date().toDateString() === date.toDateString();
    return {
      style: isToday
        ? { backgroundColor: "rgba(255,109,0,0.04)" }
        : {},
    };
  }, []);

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 bg-background-dark overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Calendario
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedSlot(null);
              setManualDate("");
              setManualTime("");
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Agendar Turno
          </button>
          <Link
            href="/calendario/configuracion"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white rounded-xl text-sm font-bold hover:bg-white/10 border border-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            Configurar Horarios
          </Link>
        </div>
      </div>

      <div
        className="flex-1 bg-card-dark rounded-2xl border border-slate-800 p-3 sm:p-4"
        style={{ minHeight: "600px" }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          culture="es"
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            noEventsInRange: "No hay turnos en este rango.",
          }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
        />
      </div>

      {/* Modal for manual booking */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-card-dark rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-500"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">calendar_add_on</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Agendar Turno</h2>
                  <p className="text-xs text-slate-400">
                    {selectedSlot
                      ? `${format(selectedSlot.start, "EEEE dd 'de' MMMM, HH:mm", { locale: es })} hs`
                      : "Completá la fecha y hora manualmente"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTurno} className="space-y-4">
              {!selectedSlot && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full bg-white/5 border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Hora
                    </label>
                    <input
                      type="time"
                      required
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full bg-white/5 border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Paciente
                </label>
                <select
                  required
                  value={selectedPacienteId}
                  onChange={(e) => setSelectedPacienteId(e.target.value)}
                  className="w-full bg-white/5 border border-slate-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                >
                  <option value="" className="bg-card-dark text-slate-400">Seleccione un paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id} className="bg-card-dark text-white">
                      {p.fullName} — DNI: {p.dni}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-white/5 text-slate-300 hover:bg-white/10 border border-slate-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  disabled={loading || !selectedPacienteId}
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 text-sm shadow-lg shadow-primary/20"
                >
                  {loading ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Event Details */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-card-dark rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-500"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {selectedEvent.resource.paciente.fullName}
                  </h2>
                  <p className="text-sm text-slate-400">
                    DNI: {selectedEvent.resource.paciente.dni}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEventModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fecha</span>
                <span className="text-sm font-semibold text-white capitalize">
                  {format(selectedEvent.start, "EEEE dd/MM/yy", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Horario</span>
                <span className="text-sm font-semibold text-primary">
                  {format(selectedEvent.start, "HH:mm")} - {format(selectedEvent.end, "HH:mm")} hs
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Teléfono</span>
                <span className="text-sm font-semibold text-white">
                  {selectedEvent.resource.paciente.phone || 'No registrado'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push(`/pacientes/${selectedEvent.resource.pacienteId}`)}
                className="w-full py-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                Ver Ficha del Paciente
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancelTurno}
                  className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">event_busy</span>
                  Cancelar
                </button>
                <button
                  onClick={() => router.push(`/turnos/agendar?modifyId=${selectedEvent.id}&from=admin`)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                  Modificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        /* ===== Calendar Dark Theme ===== */
        .rbc-calendar {
          font-family: "Inter", sans-serif;
          color: #e2e8f0;
        }

        /* Toolbar */
        .rbc-toolbar {
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
          padding: 0;
        }
        .rbc-toolbar button {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .rbc-toolbar button.rbc-active {
          background: #ff6d00 !important;
          color: #fff !important;
          border-color: #ff6d00 !important;
          box-shadow: 0 2px 12px rgba(255, 109, 0, 0.3);
        }
        .rbc-toolbar-label {
          font-weight: 800;
          font-size: 16px;
          text-transform: capitalize;
          color: #fff;
        }

        /* Headers */
        .rbc-header {
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          padding: 10px 4px;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .rbc-header + .rbc-header {
          border-left: 1px solid rgba(255, 255, 255, 0.04) !important;
        }

        /* Time view */
        .rbc-time-view,
        .rbc-month-view {
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 12px;
          overflow: hidden;
        }
        .rbc-time-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        .rbc-time-content {
          border-top: none !important;
        }
        .rbc-time-content > * + * > * {
          border-left: 1px solid rgba(255, 255, 255, 0.04) !important;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
          min-height: 48px;
        }
        .rbc-time-slot .rbc-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          padding: 0 8px;
        }
        .rbc-time-gutter {
          background: rgba(255, 255, 255, 0.01);
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid rgba(255, 255, 255, 0.02);
        }
        .rbc-allday-cell {
          display: none;
        }
        .rbc-time-header-content > .rbc-row.rbc-row-resource {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        /* Day backgrounds */
        .rbc-day-bg {
          background: transparent;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.04) !important;
        }
        .rbc-off-range-bg {
          background: rgba(0, 0, 0, 0.2) !important;
        }
        .rbc-today {
          background-color: rgba(255, 109, 0, 0.04) !important;
        }

        /* Month cells */
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .rbc-date-cell {
          padding: 6px 8px;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
        }
        .rbc-date-cell.rbc-now {
          color: #ff6d00;
          font-weight: 800;
        }

        /* Events */
        .rbc-event {
          border-radius: 8px !important;
          border: none !important;
          font-size: 12px;
          font-weight: 600;
        }
        .rbc-event:focus {
          outline: 2px solid rgba(255, 109, 0, 0.5);
          outline-offset: 1px;
        }
        .rbc-event-label {
          font-size: 10px;
          font-weight: 700;
          opacity: 0.8;
        }
        .rbc-event-content {
          font-size: 12px;
        }
        .rbc-show-more {
          color: #ff6d00;
          font-weight: 700;
          font-size: 12px;
        }
        .rbc-selected {
          background-color: #e65100 !important;
        }

        /* Agenda view */
        .rbc-agenda-view table {
          border: none;
        }
        .rbc-agenda-view table thead th {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 12px;
        }
        .rbc-agenda-view table tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .rbc-agenda-view table tbody td {
          padding: 10px 12px;
          font-size: 13px;
          color: #cbd5e1;
        }
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          white-space: nowrap;
          color: #94a3b8;
          font-weight: 600;
        }
        .rbc-agenda-event-cell {
          color: #fff;
          font-weight: 600;
        }

        /* Current time indicator */
        .rbc-current-time-indicator {
          background-color: #ff6d00;
          height: 2px;
        }
        .rbc-current-time-indicator::before {
          content: '';
          position: absolute;
          left: -4px;
          top: -3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff6d00;
        }

        /* Selection slot */
        .rbc-slot-selection {
          background: rgba(255, 109, 0, 0.15) !important;
          border: 1px solid rgba(255, 109, 0, 0.4) !important;
          border-radius: 8px;
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

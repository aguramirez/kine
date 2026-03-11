"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

interface Exercise {
  id: string;
  name: string;
  description: string;
  videoUrl: string | null;
}

interface EjercicioEnDia {
  id: string;
  sets: number;
  reps: number;
  time: string | null;
  exercise: Exercise | null;
}

interface Dia {
  id: string;
  name: string;
  ejercicios: EjercicioEnDia[];
}

interface Rutina {
  id: string;
  name: string;
  description: string;
  dias: Dia[];
}

interface PacienteData {
  id: string;
  fullName: string;
  dni: string;
  sessionsCount: number;
  totalSessions: number;
  lastSessionDate: string | null;
  isActive: boolean;
}

export default function PacienteHomePage() {
  const router = useRouter();
  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRutinaId, setOpenRutinaId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<Record<string, number>>({});
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [playingVideo, setPlayingVideo] = useState<{url: string; name: string} | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const stored = localStorage.getItem("paciente");
      if (!stored) { router.push("/"); return; }
      const { id } = JSON.parse(stored);

      const res = await fetch(`/api/pacientes/${id}/profile`);
      if (!res.ok) { router.push("/"); return; }

      const data = await res.json();
      setPaciente(data.paciente);
      setRutinas(data.rutinas);

      // Check if session was already done today
      if (data.paciente.lastSessionDate) {
        const last = new Date(data.paciente.lastSessionDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (last >= today) setSessionDone(true);
      }

      // Auto-open first routine
      if (data.rutinas.length > 0) {
        setOpenRutinaId(data.rutinas[0].id);
      }
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    const handlePopState = () => {
      setPlayingVideo((prev) => {
        if (prev) return null;
        return prev;
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openVideo = (url: string, name: string) => {
    window.history.pushState({ videoModal: true }, "");
    setPlayingVideo({ url, name });
  };

  const closeVideo = () => {
    if (window.history.state?.videoModal) {
      window.history.back(); // Triggers popstate
    } else {
      setPlayingVideo(null);
    }
  };

  const handleFinishSession = async () => {
    if (!paciente || sessionDone) return;
    setSessionLoading(true);
    try {
      const res = await fetch(`/api/pacientes/${paciente.id}/session`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al registrar sesión", "error");
        return;
      }
      setPaciente((prev) =>
        prev ? { ...prev, sessionsCount: data.sessionsCount } : prev
      );
      setSessionDone(true);
      showToast("¡Sesión finalizada! 💪", "success");
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("paciente");
    router.push("/");
  };

  const getFirstName = (fullName: string) => fullName.split(" ")[0];

  const sessionProgress =
    paciente && paciente.totalSessions > 0
      ? Math.min(Math.round((paciente.sessionsCount / paciente.totalSessions) * 100), 100)
      : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo animate className="w-12 h-12 text-primary" />
          <p className="text-sm text-slate-400 font-medium">Cargando tu rutina...</p>
        </div>
      </div>
    );
  }

  if (!paciente) return null;

  return (
    <>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Greeting & Session Progress */}
        <section className="px-4 pt-6 pb-5">
          <h1 className="text-white text-2xl font-black mb-1">
            Hola, {getFirstName(paciente.fullName)} 👋
          </h1>
          <p className="text-slate-400 text-sm mb-5">
            {sessionDone
              ? "¡Ya completaste tu sesión de hoy!"
              : "Revisá tu rutina y completá tu sesión"}
          </p>

          {/* Session Progress Card */}
          <div className="bg-card-dark p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">
                  trending_up
                </span>
                <span className="text-sm font-bold text-white">
                  Progreso de Sesiones
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {paciente.sessionsCount}
                {paciente.totalSessions > 0
                  ? ` / ${paciente.totalSessions}`
                  : ""}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${sessionProgress}%` }}
              />
            </div>
            {paciente.totalSessions > 0 && (
              <p className="text-xs text-slate-500 mt-2">
                {paciente.totalSessions - paciente.sessionsCount > 0
                  ? `Te faltan ${paciente.totalSessions - paciente.sessionsCount} sesiones`
                  : "🎉 ¡Completaste todas las sesiones!"}
              </p>
            )}
            {paciente.totalSessions === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Tu kinesiólogo no definió un total de sesiones aún
              </p>
            )}
          </div>
        </section>

        {/* Routine Section */}
        <section className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Tu Plan Actual</h3>
            {rutinas.length > 0 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {rutinas.length} {rutinas.length === 1 ? "rutina" : "rutinas"}
              </span>
            )}
          </div>

          {rutinas.length === 0 ? (
            <div className="bg-card-dark rounded-2xl border border-slate-800 p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">
                fitness_center
              </span>
              <p className="text-sm text-slate-400 font-medium">
                Aún no tenés una rutina asignada
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Tu kinesiólogo te asignará una pronto
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rutinas.map((rutina) => {
                const isOpen = openRutinaId === rutina.id;
                const dayIdx = selectedDayIndex[rutina.id] || 0;
                const currentDay = rutina.dias[dayIdx];

                return (
                  <div
                    key={rutina.id}
                    className={`bg-card-dark rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? "border-primary/30"
                        : "border-slate-800"
                    }`}
                  >
                    {/* Routine header */}
                    <button
                      onClick={() =>
                        setOpenRutinaId(isOpen ? null : rutina.id)
                      }
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg">
                            fitness_center
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {rutina.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {rutina.dias.length}{" "}
                            {rutina.dias.length === 1 ? "día" : "días"} ·{" "}
                            {rutina.dias.reduce(
                              (acc, d) => acc + d.ejercicios.length,
                              0
                            )}{" "}
                            ejercicios
                          </p>
                        </div>
                      </div>
                      <span
                        className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        expand_more
                      </span>
                    </button>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 animate-[fadeIn_0.2s_ease-out]">
                        {/* Day tabs */}
                        {rutina.dias.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar -mx-1 px-1">
                            {rutina.dias.map((dia, idx) => (
                              <button
                                key={dia.id}
                                onClick={() =>
                                  setSelectedDayIndex({
                                    ...selectedDayIndex,
                                    [rutina.id]: idx,
                                  })
                                }
                                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                                  dayIdx === idx
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-slate-800 text-slate-400 hover:text-slate-300"
                                }`}
                              >
                                {dia.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Exercises */}
                        {currentDay ? (
                          <div className="space-y-2.5">
                            {currentDay.ejercicios.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-4">
                                No hay ejercicios para este día
                              </p>
                            ) : (
                              currentDay.ejercicios.map((ej) => (
                                <div
                                  key={ej.id}
                                  className="flex items-center gap-3 p-3 bg-background-dark/50 border border-slate-800 rounded-xl"
                                >
                                  {/* Video thumbnail or icon */}
                                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                                    {ej.exercise?.videoUrl ? (
                                      <video
                                        src={ej.exercise.videoUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-slate-600 text-2xl">
                                        exercise
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">
                                      {ej.exercise?.name || "Ejercicio"}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {ej.sets} series
                                      </span>
                                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {ej.reps} reps
                                      </span>
                                      {ej.time && (
                                        <>
                                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                                          <span className="text-[11px] text-primary font-medium">
                                            {ej.time}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {ej.exercise?.videoUrl && (
                                    <button
                                      onClick={() => openVideo(ej.exercise!.videoUrl!, ej.exercise!.name)}
                                      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-primary text-lg">
                                        play_arrow
                                      </span>
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-4">
                            Seleccioná un día
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Bottom Actions — sticky */}
      <div className="p-4 border-t border-slate-800/50 bg-background-dark/80 backdrop-blur-md space-y-3 flex-shrink-0">
        {/* Finish Session Button */}
        <button
          onClick={handleFinishSession}
          disabled={sessionLoading || sessionDone}
          className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2.5 text-sm transition-all duration-300 ${
            sessionDone
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
              : "bg-gradient-to-r from-primary to-primary-dark text-white shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          }`}
        >
          {sessionLoading ? (
            <>
              <Logo animate className="w-5 h-5 text-current" />
              <span>Registrando...</span>
            </>
          ) : sessionDone ? (
            <>
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              <span>Sesión de Hoy Completada ✓</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">
                task_alt
              </span>
              <span>Terminar Sesión de Hoy</span>
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-950/50 hover:bg-red-900/50 text-red-400 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition-all border border-red-900/30"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-bold shadow-2xl animate-[slideDown_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/30"
              : "bg-red-500 text-white shadow-red-500/30"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Video Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
            <h3 className="text-white font-bold text-lg drop-shadow-md truncate pr-4">{playingVideo.name}</h3>
            <button 
              onClick={closeVideo} 
              className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-md border border-white/10 flex-shrink-0 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center bg-black pt-16 pb-4">
            <video
              src={playingVideo.url}
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -16px) scale(0.97); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

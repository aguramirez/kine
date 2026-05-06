"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import Logo from "@/components/Logo";

interface Turno {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  admin: { fullName: string };
}

export default function BuscarTurnoPage() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pacienteName, setPacienteName] = useState("");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [focusedInput, setFocusedInput] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) return;

    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const res = await fetch(`/api/turnos/buscar?dni=${dni.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setPacienteName(data.paciente.fullName);
        setTurnos(data.turnos);
        setSearched(true);
      } else {
        const err = await res.json();
        setError(err.error || "No se encontraron turnos");
        setSearched(true);
        setTurnos([]);
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  };

  const handleCancel = async (turno: Turno) => {
    const isPast = isAfter(new Date(), new Date(turno.startTime));
    if (isPast) {
      alert("No podés cancelar un turno que ya pasó.");
      return;
    }
    if (!confirm("¿Seguro que querés cancelar este turno?")) return;

    try {
      const res = await fetch(`/api/turnos?id=${turno.id}`, { method: "DELETE" });
      if (res.ok) {
        // Refresh
        setTurnos((prev) => prev.filter((t) => t.id !== turno.id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const upcomingTurnos = turnos.filter(
    (t) => t.status !== "CANCELLED" && !isAfter(new Date(), new Date(t.startTime))
  );
  const pastTurnos = turnos.filter(
    (t) => t.status !== "CANCELLED" && isAfter(new Date(), new Date(t.startTime))
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background-dark">
      {/* Header */}
      <header className="p-4 border-b border-slate-800 bg-card-dark/80 backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push("/")}
          className="text-slate-400 hover:text-white p-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <Logo className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-white">Mis Turnos</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Search form */}
        <div className="bg-card-dark/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/40 overflow-hidden">
          <div className="px-5 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">
                  search
                </span>
              </div>
              <h2 className="text-base font-bold text-white">Buscar turno</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Ingresá tu DNI para ver tus turnos agendados
            </p>
          </div>

          <form onSubmit={handleSearch} className="px-5 pb-6 space-y-4">
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors duration-300"
                style={{ color: focusedInput ? "#ff6d00" : "#64748b" }}
              >
                badge
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder="Ej: 99888777"
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-slate-700/50 rounded-2xl text-white text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                required
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary rounded-full transition-all duration-500"
                style={{ width: focusedInput ? "80%" : "0%" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !dni}
              className="w-full py-4 bg-gradient-to-r from-primary to-orange-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-primary/25 transition-all disabled:opacity-40 disabled:shadow-none hover:shadow-primary/40 text-sm"
            >
              {loading ? (
                <>
                  <Logo animate className="w-5 h-5 text-current" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>Buscar Turnos</span>
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && searched && (
          <div className="flex flex-col items-center justify-center pt-4 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-500">
                person_search
              </span>
            </div>
            <p className="text-white font-bold mb-1">{error}</p>
            <p className="text-sm text-slate-400 mb-6">
              Verificá que el DNI sea correcto
            </p>
          </div>
        )}

        {/* Results */}
        {searched && !error && (
          <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
            <p className="text-sm text-slate-400">
              Turnos de{" "}
              <span className="text-white font-bold">{pacienteName}</span>
            </p>

            {upcomingTurnos.length === 0 && pastTurnos.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-4 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-slate-500">
                    event_busy
                  </span>
                </div>
                <p className="text-white font-bold mb-1">No tenés turnos</p>
                <p className="text-sm text-slate-400 mb-6">
                  Aún no agendaste ningún turno
                </p>
                <button
                  onClick={() => router.push("/turnos/agendar")}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all"
                >
                  Agendar un Turno
                </button>
              </div>
            )}

            {upcomingTurnos.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Próximos Turnos
                </h2>
                <div className="space-y-3">
                  {upcomingTurnos.map((t) => (
                    <div
                      key={t.id}
                      className="bg-card-dark border border-slate-800 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-primary font-bold uppercase mb-1">
                          {format(
                            new Date(t.date),
                            "EEEE dd 'de' MMMM",
                            { locale: es }
                          )}
                        </p>
                        <p className="text-white font-black text-xl mb-1">
                          {format(new Date(t.startTime), "HH:mm")}
                        </p>
                        <p className="text-slate-400 text-xs">
                          Lic. {t.admin.fullName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/turnos/agendar?modifyId=${t.id}`)}
                          className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center"
                          title="Modificar Turno"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleCancel(t)}
                          className="p-3 bg-red-950/30 text-red-400 rounded-xl hover:bg-red-900/50 transition-colors flex items-center justify-center"
                          title="Cancelar Turno"
                        >
                          <span className="material-symbols-outlined text-lg">
                            cancel
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pastTurnos.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Turnos Pasados
                </h2>
                <div className="space-y-3 opacity-60">
                  {pastTurnos.map((t) => (
                    <div
                      key={t.id}
                      className="bg-card-dark border border-slate-800 rounded-2xl p-4 grayscale"
                    >
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                        {format(new Date(t.date), "dd/MM/yyyy", { locale: es })}
                      </p>
                      <p className="text-white font-black text-lg mb-1">
                        {format(new Date(t.startTime), "HH:mm")}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Lic. {t.admin.fullName}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

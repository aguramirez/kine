"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import Logo from "@/components/Logo";

interface Admin {
  id: string;
  fullName: string;
  slotDuration: number;
}

export default function AgendarTurnoPublicPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Patient data (manual entry)
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");

  // Booking flow
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState("");
  const [modifyId, setModifyId] = useState<string | null>(null);
  const [fromAdmin, setFromAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAdmins();
    const urlParams = new URLSearchParams(window.location.search);
    const mId = urlParams.get("modifyId");
    if (urlParams.get("from") === "admin") {
      setFromAdmin(true);
    }
    if (mId) {
      setModifyId(mId);
      fetch("/api/turnos")
        .then(r => r.json())
        .then(data => {
          const t = data.find((x: any) => x.id === mId);
          if (t) {
            setFullName(t.paciente.fullName);
            setDni(t.paciente.dni);
            setPhone(t.paciente.phone || "");
            setFormattedPhone(t.paciente.phone || "");
            setSelectedAdmin(t.adminId);
          }
        })
        .catch(console.error);
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
        // Auto-select if only 1
        if (data.length === 1) setSelectedAdmin(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedDate && selectedAdmin) {
      setLoadingSlots(true);
      setSelectedSlot("");
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      fetch(`/api/turnos/disponibles?adminId=${selectedAdmin}&date=${dateStr}`)
        .then((r) => r.json())
        .then(setAvailableSlots)
        .catch(console.error)
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, selectedAdmin]);

  const handlePreConfirm = () => {
    if (!fullName.trim() || !dni.trim() || !phone.trim()) {
      setError("Completá tu nombre, DNI y teléfono");
      return;
    }
    if (!selectedAdmin || !selectedSlot) return;

    if (!modifyId) {
      let p = phone.trim().replace(/[^0-9+]/g, "");
      if (!p.startsWith("+549") && !p.startsWith("549") && !p.startsWith("+")) {
        p = "+549" + p;
      } else if (p.startsWith("549")) {
        p = "+" + p;
      }
      setFormattedPhone(p);
    }
    setShowConfirmModal(true);
  };

  const submitBooking = async () => {
    setBooking(true);
    setError("");
    setShowConfirmModal(false);

    const slotDate = new Date(selectedSlot);
    const admin = admins.find((a) => a.id === selectedAdmin);
    const duration = admin?.slotDuration || 45;
    const endSlot = new Date(slotDate.getTime() + duration * 60000);

    try {
      let res;
      if (modifyId) {
        res = await fetch("/api/turnos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: modifyId,
            date: slotDate.toISOString(),
            startTime: slotDate.toISOString(),
            endTime: endSlot.toISOString(),
          }),
        });
      } else {
        res = await fetch("/api/turnos/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminId: selectedAdmin,
            fullName: fullName.trim(),
            dni: dni.trim(),
            phone: formattedPhone,
            date: slotDate.toISOString(),
            startTime: slotDate.toISOString(),
            endTime: endSlot.toISOString(),
          }),
        });
      }

      if (res.ok) {
        setSuccess(true);
      } else {
        const err = await res.json();
        setError(err.error || "Error al agendar el turno");
      }
    } catch {
      setError("Error de conexión");
    }
    setBooking(false);
  };

  const next14Days = Array.from({ length: 14 }).map((_, i) =>
    addDays(new Date(), i)
  );

  if (success) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-5">
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/30">
            <span className="material-symbols-outlined text-4xl text-emerald-400">
              check_circle
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            ¡Turno Confirmado!
          </h1>
          <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
            {modifyId ? "El turno fue reprogramado exitosamente." : "Tu turno fue agendado correctamente. Te enviaremos un recordatorio por WhatsApp."}
          </p>
          <div className="flex flex-col gap-3">
            {fromAdmin ? (
              <button
                onClick={() => router.push("/calendario")}
                className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Volver al Calendario
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all"
                >
                  Volver al Inicio
                </button>
                <button
                  onClick={() => router.push("/turnos/buscar")}
                  className="px-6 py-3 bg-white/5 text-slate-300 font-bold rounded-2xl border border-slate-700 hover:bg-white/10 transition-all"
                >
                  Ver Mis Turnos
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active step
  const step = !fullName || !dni || !phone
    ? 0
    : !selectedAdmin
    ? 1
    : !selectedDate
    ? 2
    : 3;

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
          <h1 className="text-lg font-bold text-white">
            {modifyId ? "Reprogramar Turno" : "Agendar Turno"}
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-7">
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Step 1: Patient data (Hidden if modifying) */}
        {!modifyId && (
          <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Tus datos
            </h2>
          </div>
          <div className="bg-card-dark border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-white/[0.03] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  DNI
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="99888777"
                  className="w-full bg-white/[0.03] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="3885956441"
                  className="w-full bg-white/[0.03] border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Step 2: Profesional */}
        {step >= 1 && (
          <section className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                2
              </div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Profesional
              </h2>
            </div>
            <div className="bg-card-dark border border-slate-800 rounded-2xl p-2 space-y-1">
              {admins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => setSelectedAdmin(admin.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedAdmin === admin.id
                      ? "bg-primary/10 border border-primary"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold text-sm">
                    {admin.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="text-white font-bold text-sm flex-1 text-left">
                    Lic. {admin.fullName}
                  </p>
                  {selectedAdmin === admin.id && (
                    <span className="material-symbols-outlined text-primary">
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 3: Date */}
        {step >= 2 && (
          <section className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                3
              </div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Fecha
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
              {next14Days.map((d, i) => {
                const isSelected = selectedDate && isSameDay(selectedDate, d);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center min-w-[70px] p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-card-dark border-slate-800 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold mb-1">
                      {format(d, "EEE", { locale: es })}
                    </span>
                    <span className="text-xl font-black">{format(d, "dd")}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 4: Time Slot */}
        {step >= 3 && (
          <section className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                4
              </div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Horario
              </h2>
            </div>
            {loadingSlots ? (
              <div className="p-6 text-center">
                <Logo animate className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cargando horarios...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-6 text-center border border-slate-800 border-dashed rounded-2xl bg-card-dark/50">
                <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">
                  event_busy
                </span>
                <p className="text-sm text-slate-400">
                  No hay turnos disponibles para este día
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slotStr) => {
                  const d = new Date(slotStr);
                  const isSelected = selectedSlot === slotStr;
                  return (
                    <button
                      key={slotStr}
                      onClick={() => setSelectedSlot(slotStr)}
                      className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10"
                          : "bg-card-dark border-slate-800 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {format(d, "HH:mm")}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Footer Confirm */}
      {selectedAdmin && selectedDate && selectedSlot && fullName && dni && phone && (
        <div className="fixed bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-card-dark/90 backdrop-blur-md animate-[slideUp_0.3s_ease-out]">
          <button
            disabled={booking}
            onClick={handlePreConfirm}
            className="w-full py-4 bg-gradient-to-r from-primary to-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/25 transition-all disabled:opacity-50 text-sm"
          >
            {booking ? (
              <>
                <Logo animate className="w-5 h-5 text-current" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">
                  calendar_add_on
                </span>
                <span>Confirmar Turno</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-card-dark border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-500"></div>
            
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">help</span>
              </div>
              <h3 className="text-lg font-black text-white">¿Son correctos estos datos?</h3>
            </div>

            <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Nombre</span>
                <span className="text-sm font-semibold text-white">{fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">DNI</span>
                <span className="text-sm font-semibold text-white">{dni}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Teléfono (WA)</span>
                <span className="text-sm font-semibold text-white">{formattedPhone}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Profesional</span>
                <span className="text-sm font-semibold text-white">Lic. {admins.find(a => a.id === selectedAdmin)?.fullName}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Turno</span>
                <div className="text-right">
                  <span className="block text-sm font-semibold text-white">{selectedSlot && format(new Date(selectedSlot), "dd/MM/yyyy")}</span>
                  <span className="block text-xs text-primary font-black">{selectedSlot && format(new Date(selectedSlot), "HH:mm")} hs</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white/5 text-slate-300 rounded-xl font-bold text-sm border border-slate-700 hover:bg-white/10 transition-all"
              >
                Modificar
              </button>
              <button
                onClick={submitBooking}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
              >
                {modifyId ? "Sí, Reprogramar" : "Sí, Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

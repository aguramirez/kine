"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

interface RecentPaciente {
  id: string;
  fullName: string;
  dni: string;
  diagnoses: string[];
  isActive: boolean;
  sessionsCount: number;
  totalSessions: number;
  createdAt: string;
}

interface DashboardData {
  activePacientes: number;
  sessionsToday: number;
  totalPacientes: number;
  recentPacientes: RecentPaciente[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Logo animate className="w-12 h-12 text-primary" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Cargando panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
          Panel de Control
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-sm md:text-base capitalize">
          {today}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Pacientes Activos */}
        <div className="bg-white dark:bg-card-dark p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Pacientes Activos
              </p>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-1">
                {data?.activePacientes ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-xl text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-slate-400 text-sm font-medium">
            <span className="material-symbols-outlined text-sm">person</span>
            <span>
              {data?.totalPacientes ?? 0} pacientes en total
            </span>
          </div>
        </div>

        {/* Sesiones Hoy */}
        <div className="bg-white dark:bg-card-dark p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Sesiones Hoy
              </p>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-1">
                {String(data?.sessionsToday ?? 0).padStart(2, "0")}
              </h3>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 rounded-xl text-emerald-500 flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">
                event_available
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-emerald-500 text-sm font-medium">
            <span className="material-symbols-outlined text-sm">
              check_circle
            </span>
            <span>Pacientes que entrenaron hoy</span>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-bold dark:text-white">
            Pacientes Recientes
          </h3>
          <Link
            href="/pacientes"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>

        {!data?.recentPacientes?.length ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
              groups
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay pacientes registrados aún
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 text-xs font-bold uppercase">
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">DNI</th>
                    <th className="px-6 py-4">Diagnóstico</th>
                    <th className="px-6 py-4 text-center">Sesiones</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.recentPacientes.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 text-sm font-bold uppercase">
                            {p.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {p.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {p.dni}
                      </td>
                      <td className="px-6 py-4">
                        {p.diagnoses.length > 0 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {p.diagnoses[0]}
                            {p.diagnoses.length > 1 && (
                              <span className="text-primary font-bold ml-1">
                                +{p.diagnoses.length - 1}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin diagnóstico
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-primary">
                          {p.sessionsCount}
                          {p.totalSessions > 0 && (
                            <span className="text-slate-400 font-normal">
                              /{p.totalSessions}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            p.isActive
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {p.isActive ? "Activo" : "Alta"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href="/pacientes"
                          className="text-primary hover:underline text-xs font-bold"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {data.recentPacientes.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 text-sm font-bold uppercase">
                    {p.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {p.fullName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      DNI: {p.dni}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        p.isActive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {p.isActive ? "Activo" : "Alta"}
                    </span>
                    <span className="text-xs text-primary font-bold">
                      {p.sessionsCount}
                      {p.totalSessions > 0 && `/${p.totalSessions}`} ses.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

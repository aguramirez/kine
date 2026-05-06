"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import NotificationsBell from "./NotificationsBell";

const navItems = [
  { href: "/dashboard", label: "Panel de Control", icon: "dashboard" },
  { href: "/calendario", label: "Calendario", icon: "calendar_month" },
  { href: "/ejercicios", label: "Ejercicios", icon: "fitness_center" },
  { href: "/rutinas", label: "Rutinas", icon: "assignment" },
  { href: "/pacientes", label: "Pacientes", icon: "groups" },
];

interface SidebarAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarAdmin({ isOpen, onClose }: SidebarAdminProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const adminStr = localStorage.getItem("admin");
    if (adminStr) {
      const adminObj = JSON.parse(adminStr);
      setAdminName(adminObj.fullName || "Admin");
      setAdminUsername(adminObj.username || adminObj.fullName?.split(" ")[0].toLowerCase() || "admin");
    }
  }, []);

  const adminInitials = adminName
    ? adminName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const handleLogout = () => {
    // Clear any stored tokens
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    router.push("/admin");
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-[fadeIn_0.2s_ease-out]"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto
          w-72 h-full
          bg-white dark:bg-card-dark border-r border-slate-200 dark:border-slate-800
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6 pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 text-primary" />
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              Omega<span className="text-primary">Fit</span>
            </h2>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden relative shrink-0">
              {!imageError && adminUsername ? (
                <Image
                  fill
                  className="object-cover"
                  alt={`Lic. ${adminName}`}
                  src={`/${adminUsername}.jpg`}
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-primary font-bold text-xs">{adminInitials}</span>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white leading-none truncate w-32">
                {adminName || "Cargando..."}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                Administrador
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-4">
            Gestión Principal
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "text-primary bg-primary/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mt-8 mb-4">
            Configuración
          </div>

          <Link
            href="/ajustes"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              isActive("/ajustes")
                ? "text-primary bg-primary/10"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Ajustes</span>
          </Link> */}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

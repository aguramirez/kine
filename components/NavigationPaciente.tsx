"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavigationPaciente() {
  const pathname = usePathname();

  // Helper para determinar si la ruta "activa" incluye el path
  const isActive = (path: string) => pathname?.includes(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-20">
      <Link 
        href="/home" 
        className={`flex flex-col items-center gap-1 ${isActive('/home') ? 'text-primary' : 'text-slate-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/home') ? 'font-variation-fill' : ''}`}>home</span>
        <span className="text-[10px] font-bold">Inicio</span>
      </Link>

      <Link 
        href="/ejercicios" 
        className={`flex flex-col items-center gap-1 ${isActive('/ejercicios') ? 'text-primary' : 'text-slate-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/ejercicios') ? 'font-variation-fill' : ''}`}>exercise</span>
        <span className="text-[10px] font-bold">Ejercicios</span>
      </Link>

      <Link 
        href="/progreso" 
        className={`flex flex-col items-center gap-1 ${isActive('/progreso') ? 'text-primary' : 'text-slate-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/progreso') ? 'font-variation-fill' : ''}`}>analytics</span>
        <span className="text-[10px] font-bold">Progreso</span>
      </Link>

      <Link 
        href="/chat" 
        className={`flex flex-col items-center gap-1 ${isActive('/chat') ? 'text-primary' : 'text-slate-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/chat') ? 'font-variation-fill' : ''}`}>chat_bubble</span>
        <span className="text-[10px] font-bold">Chat</span>
      </Link>
    </nav>
  );
}

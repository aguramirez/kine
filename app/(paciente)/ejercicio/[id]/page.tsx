"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function EjercicioDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    return (
        <div className="relative max-w-md mx-auto min-h-screen pb-24 bg-background-light dark:bg-background-dark">
            {/* Top Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <button 
                  onClick={() => router.back()} 
                  className="flex items-center justify-center size-10 rounded-full bg-background-dark/50 backdrop-blur-md text-white border border-white/10"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            </div>

            {/* Video Placeholder Area */}
            <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden">
                <Image 
                    fill 
                    className="object-cover" 
                    alt="Persona realizando ejercicio" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS0M40ayCCBYDsSWGFAGZ0KwwGp0R3E60oBpQ54oF66Cnn04lI9v7Zgw2VyYX4-hzl79JvkNDqj9Z_y_9h_KbJJ7R6sxa1QS7Jtu848FIDyFpXNo6y9QNrxnzEo68N9hMv1zhck8FQWzWlrbQyiSB5fT04N9UcMiXNe72EcIBIz93qus4kLurPPtGyY9J-YhFWUR03rhlI0UieTGqr8ctZx8nUZlGPxV1cduAytZsZuYkxptfAXNkDu9cpvDEtnN1kJys_Qwe8uhyJ" 
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button className="flex items-center justify-center size-16 rounded-full bg-primary text-white shadow-lg shadow-primary/40">
                        <span className="material-symbols-outlined !text-4xl">play_arrow</span>
                    </button>
                </div>
                
                {/* Fake Video progress bar */}
                <div className="absolute inset-x-0 bottom-0 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex h-1.5 items-center justify-center mb-2">
                        <div className="h-1 flex-1 rounded-full bg-primary"></div>
                        <div className="relative"><div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-white shadow-sm"></div></div>
                        <div className="h-1 w-2/3 rounded-full bg-white/20"></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-white text-[10px] font-medium opacity-80 uppercase tracking-wider">0:45 / 2:30</p>
                        <span className="material-symbols-outlined text-white text-sm">fullscreen</span>
                    </div>
                </div>
            </div>

            <div className="px-5 pt-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">Kinesiología</span>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">Hombro</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Rotación Externa con Banda</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    Este ejercicio es fundamental para la estabilidad del manguito rotador y la rehabilitación de lesiones subacromiales.
                </p>

                <div className="flex items-center gap-4 mb-8 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center flex-1 border-r border-slate-200 dark:border-slate-800">
                        <span className="text-primary font-bold text-lg">3</span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Series</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-slate-200 dark:border-slate-800">
                        <span className="text-primary font-bold text-lg">12</span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Reps</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-primary font-bold text-lg">45"</span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Descanso</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">format_list_numbered</span>
                        Instrucciones
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-none size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug pt-0.5">Sujeta la banda elástica con ambas manos, manteniendo los codos en un ángulo de 90 grados.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-none size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug pt-0.5">Mantén los codos pegados a los costados del cuerpo durante todo el movimiento.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-none size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug pt-0.5">Rota los antebrazos hacia afuera lentamente, estirando la banda.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-none size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">4</div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug pt-0.5">Regresa a la posición inicial controlando la tensión de la banda.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                        <h4 className="font-bold text-primary text-sm uppercase tracking-wider">Consejos Clínicos</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                        "Evita compensar encogiendo los hombros. Si sientes dolor punzante, reduce el rango de movimiento o la resistencia de la banda."
                    </p>
                </div>
            </div>
        </div>
    );
}

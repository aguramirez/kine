import Image from "next/image";

export default function RutinaAccordionItem({ title, active }: { title: string, active?: boolean }) {
    return (
        // Component mockup
        <div className={`border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-card-dark overflow-hidden ${active ? '' : 'opacity-70'}`}>
            <button className="w-full flex items-center justify-between p-4 text-left">
                <div className={`flex items-center gap-3 ${active ? '' : 'text-slate-500'}`}>
                    <span className={`material-symbols-outlined ${active ? 'text-primary' : ''}`}>
                        {active ? 'fitness_center' : 'history'}
                    </span>
                    <span className="font-bold text-sm">{title}</span>
                </div>
                <span className={`material-symbols-outlined ${active ? 'transform rotate-180' : ''}`}>expand_more</span>
            </button>
            
            {active && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Day Selection Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-primary text-white text-xs font-bold">Día 1 - Movilidad</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">Día 2 - Fuerza</button>
                        <button className="whitespace-nowrap px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">Día 3 - Estiramiento</button>
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-3 bg-white dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                            <div className="size-16 rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative">
                                <Image fill className="object-cover" alt="Rotación Externa" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA3DNwJ8NoCAPfeN0STSwIEqwaeYzm2vFF-lba5P4jwSecrFuIR8dshU94f-CrytaoAUGvavpHtt6U2e9zFtQOI0BOfM5RjmvpTGztaTm-rCVby879ulnVIgXMXgsOf7Y4UdfEd-10yT36O5IIfa3m7pWeV4mzM3ecc9j8MBVCefZ9C7annelIzkivlrlrRncwNwSsK0Ee1dlIuqEF3TjWz7TcAgPNGaVs2wcjnLa9xVry5u8DzGDlzNf65IjZKOZkF8P66IsQSQGw" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold">Rotación Externa</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">3 series • 12 reps</p>
                            </div>
                            <div className="size-8 rounded-full border-2 border-primary/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-lg">check</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-white dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                            <div className="size-16 rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative">
                                <Image fill className="object-cover" alt="Wall slides" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7hJRaVIC8wjYoNjgIchwpyspmhloOek0UFsTW7RDEv5UjTVjWgjlzmJ4BmhCnwoSc17PAvtwU1mw385Fg6TSv9aFgCoyus3gbfvncLAaiwPly0vURaKErhkHEc1u4fkZLz51sOfGuO2Tur-rQV72vE0ZfuZRDJHlYJF8chGAHIpwIAHg-yRVzgAzL-gmp04oSvvOVKjAjO6rBDCLxGv6JZywxtL1M8oWUbWjIsREiSuJQ7NCPYcTRjFuN7pKc4DONHDcukdUBbWbY" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold">Wall Slides</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">3 series • 10 reps</p>
                            </div>
                            <button className="size-8 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400 text-lg">play_arrow</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

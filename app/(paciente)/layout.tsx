export default function PacienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto min-h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark">
      {children}
    </div>
  );
}

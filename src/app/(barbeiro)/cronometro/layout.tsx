import { AbasCronometro } from "./abas";

export default function CronometroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Cronômetro de corte</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Marque cada fase do corte e descubra onde você perde mais tempo.
        </p>
      </header>
      <div className="mb-5">
        <AbasCronometro />
      </div>
      {children}
    </div>
  );
}

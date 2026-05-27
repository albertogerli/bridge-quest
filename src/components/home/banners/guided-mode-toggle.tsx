import { Globe } from "lucide-react";

interface GuidedModeToggleProps {
  onToggle: () => void;
}

export function GuidedModeToggle({ onToggle }: GuidedModeToggleProps) {
  return (
    <section className="px-4 sm:px-5 pt-2 pb-2">
      <div className="mx-auto max-w-lg text-center">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3040] bg-white dark:bg-[#1a1f2e] px-4 py-2 text-xs font-semibold text-[#5c677d] dark:text-gray-400 shadow-sm hover:text-[#12305f] dark:hover:text-gray-200 hover:border-[#c8a44e]/30 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          Mostra tutto (Modalità esperto)
        </button>
      </div>
    </section>
  );
}

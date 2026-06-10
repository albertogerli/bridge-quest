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
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm hover:text-foreground hover:border-[#c8a44e]/30 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          Mostra tutto (Modalità esperto)
        </button>
      </div>
    </section>
  );
}

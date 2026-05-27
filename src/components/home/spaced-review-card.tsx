import { motion } from "motion/react";
import Link from "next/link";
import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpacedReviewCardProps {
  reviewCount: number;
}

export function SpacedReviewCard({ reviewCount }: SpacedReviewCardProps) {
  return (
    <section className="px-4 sm:px-5 pt-4 lg:hidden">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Link href="/ripasso">
            <div className={`btn-squishy rounded-2xl p-4 cursor-pointer transition-colors ${
              reviewCount > 0
                ? "bg-[#1B5E3B]/5 border border-[#1B5E3B]/15"
                : "bg-white border border-[#E8E4DC]"
            }`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B5E3B]/10">
                  <Brain className="w-5 h-5 text-[#1B5E3B]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Ripasso del giorno
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {reviewCount > 0
                      ? `${reviewCount} ${reviewCount === 1 ? "domanda" : "domande"} da ripassare`
                      : "Completa lezioni per sbloccare il ripasso"
                    }
                  </p>
                </div>
                {reviewCount > 0 && (
                  <Badge className="bg-[#1B5E3B] text-white text-xs font-bold hover:bg-[#1B5E3B]">
                    {reviewCount}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

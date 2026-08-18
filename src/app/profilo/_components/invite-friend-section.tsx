"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, MessageCircle, Send, Share2, UserPlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/contexts/traduzioni-provider";

/** Blocco "Invita un Amico": codice referral, condivisione e toast di feedback. */
export function InviteFriendSection({
  referralCode,
  invitesSent,
  linkCopied,
  inviteToast,
  inviteXpToast,
  onCopyLink,
  onWhatsApp,
  onInvite,
}: {
  referralCode: string | null;
  invitesSent: number;
  linkCopied: boolean;
  inviteToast: string | null;
  inviteXpToast: boolean;
  onCopyLink: () => void;
  onWhatsApp: () => void;
  onInvite: () => void;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.58 }}
      className="mb-6"
    >
      <div className="rounded-2xl bg-gradient-to-r from-figb/5 to-indigo-50 dark:from-primary/10 dark:to-indigo-950/30 border-2 border-figb/20 dark:border-primary/30 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-figb text-white shadow-md shadow-figb/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{t("Invita un Amico")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Condividi Bridge LAB e guadagna +25 XP")}
            </p>
          </div>
          {invitesSent > 0 && (
            <div className="flex items-center gap-1.5 bg-figb/10 dark:bg-primary/15 rounded-full px-3 py-1">
              <Send className="w-3 h-3 text-figb dark:text-primary" />
              <span className="text-[12px] font-bold text-figb dark:text-primary">
                {invitesSent} invit{invitesSent === 1 ? "o" : "i"}
              </span>
            </div>
          )}
        </div>

        {/* Referral code card */}
        {referralCode && (
          <div className="mb-4 rounded-xl bg-card/80 border border-figb/10 dark:border-primary/20 p-3.5">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("Il tuo codice referral")}
            </p>
            <div className="flex items-center gap-2">
              <span className="flex-1 font-mono text-lg font-bold text-figb dark:text-primary tracking-widest">
                {referralCode}
              </span>
              <button
                onClick={onCopyLink}
                className="flex items-center gap-1.5 rounded-lg bg-figb/10 hover:bg-figb/20 text-figb dark:bg-primary/15 dark:hover:bg-primary/25 dark:text-primary px-3 py-1.5 text-xs font-bold transition-colors"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {t("Copiato!")}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {t("Copia link")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Share buttons row */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* WhatsApp button */}
          <Button
            onClick={onWhatsApp}
            className="rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold h-11 text-sm shadow-md shadow-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t("WhatsApp")}
          </Button>
          {/* Generic share button */}
          <Button
            onClick={onInvite}
            className="rounded-xl bg-figb hover:bg-figb-dark text-white font-semibold h-11 text-sm shadow-md shadow-figb/20 transition-colors"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t("Condividi")}
          </Button>
        </div>

        {/* Invite toast feedback */}
        <AnimatePresence>
          {inviteToast && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 text-center"
            >
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full px-3 py-1.5">
                <Check className="h-3.5 w-3.5" />
                {inviteToast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* XP award toast */}
        <AnimatePresence>
          {inviteXpToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-2 text-center"
            >
              <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full px-3 py-1.5">
                <Zap className="h-3.5 w-3.5" />
                +25 XP guadagnati!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

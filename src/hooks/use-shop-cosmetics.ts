"use client";

import { useState, useEffect } from "react";

export interface ShopCosmetics {
  /** Active avatar frame CSS classes (ring + gradient) */
  avatarFrame: string | null;
  /** Active card back gradient classes */
  cardBackGradient: string;
  /** Active card back pattern overlay color */
  cardBackOverlay: string;
  /** Active table background CSS gradient */
  tableBg: string;
  /** Active title (if purchased) */
  activeTitle: string | null;
}

// Card back gradient mappings
const CARD_BACK_STYLES: Record<string, { gradient: string; overlay: string }> = {
  "classico-blu": {
    gradient: "from-[#003DA5] to-[#0052CC]",
    overlay: "rgba(255,255,255,0.05)",
  },
  "elegante-nero": {
    gradient: "from-gray-800 via-gray-900 to-black",
    overlay: "rgba(255,255,255,0.03)",
  },
  "figb-ufficiale": {
    gradient: "from-[#003DA5] via-[#0052CC] to-[#003DA5]",
    overlay: "rgba(255,255,255,0.08)",
  },
  "reale-oro": {
    gradient: "from-amber-600 via-yellow-500 to-amber-700",
    overlay: "rgba(255,255,255,0.1)",
  },
  "platino": {
    gradient: "from-slate-300 via-gray-100 to-slate-400",
    overlay: "rgba(0,0,0,0.05)",
  },
  "rosso-velluto": {
    gradient: "from-red-800 via-red-900 to-red-950",
    overlay: "rgba(255,255,255,0.04)",
  },
  "aurora-boreale": {
    gradient: "from-emerald-400 via-cyan-500 to-purple-600",
    overlay: "rgba(255,255,255,0.08)",
  },
};

// Avatar frame CSS mappings
const AVATAR_FRAME_STYLES: Record<string, string> = {
  "cornice-oro": "ring-[3px] ring-amber-400",
  "cornice-diamante": "ring-[3px] ring-sky-300",
  "cornice-campione": "ring-[3px] ring-purple-400",
  "cornice-arcobaleno": "ring-[3px] ring-pink-400",
  "cornice-fiamma": "ring-[3px] ring-orange-500",
  "cornice-azzurro": "ring-[3px] ring-blue-500",
};

// Table background CSS mappings
const TABLE_BG_STYLES: Record<string, string> = {
  "verde-classico": "radial-gradient(ellipse at 50% 40%, #16a34a 0%, #15803d 40%, #14532d 100%)",
  "blu-notte": "radial-gradient(ellipse at 50% 40%, #312e81 0%, #1e1b4b 40%, #0f172a 100%)",
  "mogano": "radial-gradient(ellipse at 50% 40%, #92400e 0%, #78350f 40%, #451a03 100%)",
  "marmo-bianco": "radial-gradient(ellipse at 50% 40%, #f9fafb 0%, #e5e7eb 40%, #d1d5db 100%)",
  "velluto-rosso": "radial-gradient(ellipse at 50% 40%, #991b1b 0%, #7f1d1d 40%, #450a0a 100%)",
  "cielo-stellato": "radial-gradient(ellipse at 50% 40%, #1e3a5f 0%, #0c1929 40%, #020617 100%)",
};

// Title ID to display name mappings
const TITLE_NAMES: Record<string, string> = {
  "maestro-di-bridge": "Maestro di Bridge",
  "stratega": "Stratega",
  "il-professore": "Il Professore",
  "asso-di-cuori": "Asso di Cuori",
  "campione-nazionale": "Campione Nazionale",
  "leggenda-del-bridge": "Leggenda del Bridge",
};

// Default values
const DEFAULT_CARD_BACK = CARD_BACK_STYLES["classico-blu"];
const DEFAULT_TABLE_BG = TABLE_BG_STYLES["verde-classico"];

export function useShopCosmetics(): ShopCosmetics {
  const [cosmetics, setCosmetics] = useState<ShopCosmetics>({
    avatarFrame: null,
    cardBackGradient: DEFAULT_CARD_BACK.gradient,
    cardBackOverlay: DEFAULT_CARD_BACK.overlay,
    tableBg: DEFAULT_TABLE_BG,
    activeTitle: null,
  });

  useEffect(() => {
    try {
      const activeFrame = localStorage.getItem("bq_shop_active_avatari");
      const activeCard = localStorage.getItem("bq_shop_active_temi-carta");
      const activeTable = localStorage.getItem("bq_shop_active_sfondi-tavolo");
      const activeTitle = localStorage.getItem("bq_shop_active_titoli");

      const cardStyle = (activeCard && CARD_BACK_STYLES[activeCard]) || DEFAULT_CARD_BACK;
      const tableStyle = (activeTable && TABLE_BG_STYLES[activeTable]) || DEFAULT_TABLE_BG;

      setCosmetics({
        avatarFrame: activeFrame ? (AVATAR_FRAME_STYLES[activeFrame] || null) : null,
        cardBackGradient: cardStyle.gradient,
        cardBackOverlay: cardStyle.overlay,
        tableBg: tableStyle,
        activeTitle: activeTitle ? (TITLE_NAMES[activeTitle] || activeTitle) : null,
      });
    } catch {}
  }, []);

  return cosmetics;
}

/**
 * Get cosmetics synchronously (for components that can't use hooks)
 */
export function getShopCosmetics(): ShopCosmetics {
  try {
    const activeFrame = localStorage.getItem("bq_shop_active_avatari");
    const activeCard = localStorage.getItem("bq_shop_active_temi-carta");
    const activeTable = localStorage.getItem("bq_shop_active_sfondi-tavolo");
    const activeTitle = localStorage.getItem("bq_shop_active_titoli");

    const cardStyle = (activeCard && CARD_BACK_STYLES[activeCard]) || DEFAULT_CARD_BACK;
    const tableStyle = (activeTable && TABLE_BG_STYLES[activeTable]) || DEFAULT_TABLE_BG;

    return {
      avatarFrame: activeFrame ? (AVATAR_FRAME_STYLES[activeFrame] || null) : null,
      cardBackGradient: cardStyle.gradient,
      cardBackOverlay: cardStyle.overlay,
      tableBg: tableStyle,
      activeTitle: activeTitle ? (TITLE_NAMES[activeTitle] || activeTitle) : null,
    };
  } catch {
    return {
      avatarFrame: null,
      cardBackGradient: DEFAULT_CARD_BACK.gradient,
      cardBackOverlay: DEFAULT_CARD_BACK.overlay,
      tableBg: DEFAULT_TABLE_BG,
      activeTitle: null,
    };
  }
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, ShoppingBag, Sparkles, Crown, Diamond, Frame, Palette, Image as ImageIcon, Check, Star, Flame, Rainbow, Award, Heart, Trophy, Gem, Type } from "lucide-react";
import Link from "next/link";

/* ────────────────────────────────────────────── */
/*  Types & Data                                   */
/* ────────────────────────────────────────────── */

type CategoryId = "avatari" | "temi-carta" | "sfondi-tavolo" | "titoli";

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  preview: {
    gradient: string;
    border?: string;
    icon?: React.ReactNode;
  };
  description: string;
  isFree?: boolean;
}

const categories: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
  { id: "avatari", label: "Avatari", icon: <Frame className="w-4 h-4" /> },
  { id: "temi-carta", label: "Temi Carta", icon: <Palette className="w-4 h-4" /> },
  { id: "sfondi-tavolo", label: "Sfondi Tavolo", icon: <ImageIcon className="w-4 h-4" /> },
  { id: "titoli", label: "Titoli", icon: <Type className="w-4 h-4" /> },
];

const shopItems: ShopItem[] = [
  // Avatari (frames/borders)
  {
    id: "cornice-oro",
    name: "Cornice Oro",
    price: 50,
    category: "avatari",
    preview: {
      gradient: "from-amber-300 via-yellow-400 to-amber-500",
      border: "ring-4 ring-amber-400/60",
    },
    description: "Cornice dorata per il tuo avatar",
  },
  {
    id: "cornice-diamante",
    name: "Cornice Diamante",
    price: 100,
    category: "avatari",
    preview: {
      gradient: "from-sky-200 via-blue-300 to-indigo-400",
      border: "ring-4 ring-sky-300/60",
      icon: <Diamond className="w-5 h-5 text-white" />,
    },
    description: "Cornice con riflessi diamante scintillanti",
  },
  {
    id: "cornice-campione",
    name: "Cornice Campione",
    price: 200,
    category: "avatari",
    preview: {
      gradient: "from-purple-400 via-pink-500 to-rose-500",
      border: "ring-4 ring-purple-400/60",
      icon: <Crown className="w-5 h-5 text-white" />,
    },
    description: "Cornice con corona del campione",
  },
  {
    id: "cornice-azzurro",
    name: "Cornice Azzurro FIGB",
    price: 150,
    category: "avatari",
    preview: {
      gradient: "from-blue-400 via-blue-500 to-blue-700",
      border: "ring-4 ring-blue-500/60",
      icon: <Award className="w-5 h-5 text-white" />,
    },
    description: "Cornice ufficiale blu FIGB",
  },
  {
    id: "cornice-fiamma",
    name: "Cornice Fiamma",
    price: 250,
    category: "avatari",
    preview: {
      gradient: "from-orange-400 via-red-500 to-orange-600",
      border: "ring-4 ring-orange-500/60",
      icon: <Flame className="w-5 h-5 text-white" />,
    },
    description: "Anello di fuoco ardente intorno al tuo avatar",
  },
  {
    id: "cornice-arcobaleno",
    name: "Cornice Arcobaleno",
    price: 300,
    category: "avatari",
    preview: {
      gradient: "from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-500",
      border: "ring-4 ring-pink-400/60",
      icon: <Rainbow className="w-5 h-5 text-white" />,
    },
    description: "Anello arcobaleno animato scintillante",
  },

  // Temi Carta (card backs)
  {
    id: "classico-blu",
    name: "Classico Blu",
    price: 0,
    category: "temi-carta",
    preview: { gradient: "from-[#003DA5] to-[#0052CC]" },
    description: "Il retro carta classico blu",
    isFree: true,
  },
  {
    id: "elegante-nero",
    name: "Elegante Nero",
    price: 30,
    category: "temi-carta",
    preview: { gradient: "from-gray-800 via-gray-900 to-black" },
    description: "Retro carta nero elegante con finitura opaca",
  },
  {
    id: "figb-ufficiale",
    name: "FIGB Ufficiale",
    price: 50,
    category: "temi-carta",
    preview: { gradient: "from-[#003DA5] via-[#0052CC] to-[#003DA5]" },
    description: "Retro ufficiale della Federazione Italiana Gioco Bridge",
  },
  {
    id: "reale-oro",
    name: "Reale Oro",
    price: 100,
    category: "temi-carta",
    preview: { gradient: "from-amber-600 via-yellow-500 to-amber-700" },
    description: "Retro carta in oro reale con motivi regali",
  },
  {
    id: "rosso-velluto",
    name: "Rosso Velluto",
    price: 150,
    category: "temi-carta",
    preview: { gradient: "from-red-800 via-red-900 to-red-950" },
    description: "Retro in velluto rosso profondo, eleganza pura",
  },
  {
    id: "platino",
    name: "Platino",
    price: 200,
    category: "temi-carta",
    preview: { gradient: "from-slate-300 via-gray-100 to-slate-400" },
    description: "Retro platino con riflessi argentati esclusivi",
  },
  {
    id: "aurora-boreale",
    name: "Aurora Boreale",
    price: 300,
    category: "temi-carta",
    preview: { gradient: "from-emerald-400 via-cyan-500 to-purple-600" },
    description: "Luci del nord che danzano sul retro carta",
  },

  // Sfondi Tavolo (table backgrounds)
  {
    id: "verde-classico",
    name: "Verde Classico",
    price: 0,
    category: "sfondi-tavolo",
    preview: { gradient: "from-emerald-700 via-green-800 to-emerald-900" },
    description: "Il classico panno verde da bridge",
    isFree: true,
  },
  {
    id: "blu-notte",
    name: "Blu Notte",
    price: 30,
    category: "sfondi-tavolo",
    preview: { gradient: "from-indigo-900 via-blue-950 to-slate-900" },
    description: "Sfondo tavolo blu notte profondo",
  },
  {
    id: "mogano",
    name: "Mogano",
    price: 50,
    category: "sfondi-tavolo",
    preview: { gradient: "from-amber-900 via-orange-900 to-amber-950" },
    description: "Tavolo in legno di mogano pregiato",
  },
  {
    id: "marmo-bianco",
    name: "Marmo Bianco",
    price: 80,
    category: "sfondi-tavolo",
    preview: { gradient: "from-gray-100 via-white to-gray-200" },
    description: "Superficie in marmo bianco di Carrara",
  },
  {
    id: "velluto-rosso",
    name: "Velluto Rosso",
    price: 150,
    category: "sfondi-tavolo",
    preview: { gradient: "from-red-800 via-red-900 to-red-950" },
    description: "Tavolo rivestito in velluto rosso da casin\u00f2",
  },
  {
    id: "cielo-stellato",
    name: "Cielo Stellato",
    price: 250,
    category: "sfondi-tavolo",
    preview: { gradient: "from-indigo-900 via-slate-900 to-slate-950" },
    description: "Gioca sotto un cielo di stelle scintillanti",
  },

  // Titoli (displayed under user's name)
  {
    id: "maestro-di-bridge",
    name: "Maestro di Bridge",
    price: 0,
    category: "titoli",
    preview: { gradient: "from-blue-400 via-blue-500 to-indigo-600" },
    description: "Il titolo base per ogni giocatore di bridge",
    isFree: true,
  },
  {
    id: "stratega",
    name: "Stratega",
    price: 80,
    category: "titoli",
    preview: { gradient: "from-emerald-400 via-teal-500 to-emerald-600" },
    description: "Per chi pianifica ogni mossa con precisione",
  },
  {
    id: "il-professore",
    name: "Il Professore",
    price: 100,
    category: "titoli",
    preview: { gradient: "from-violet-400 via-purple-500 to-violet-600" },
    description: "Conoscenza e stile al tavolo da bridge",
  },
  {
    id: "asso-di-cuori",
    name: "Asso di Cuori",
    price: 120,
    category: "titoli",
    preview: {
      gradient: "from-rose-400 via-pink-500 to-rose-600",
      icon: <Heart className="w-5 h-5 text-white" />,
    },
    description: "La carta pi\u00f9 amata del mazzo, sei tu",
  },
  {
    id: "campione-nazionale",
    name: "Campione Nazionale",
    price: 150,
    category: "titoli",
    preview: {
      gradient: "from-amber-400 via-yellow-500 to-amber-600",
      icon: <Trophy className="w-5 h-5 text-white" />,
    },
    description: "Titolo riservato ai veri campioni d'Italia",
  },
  {
    id: "leggenda-del-bridge",
    name: "Leggenda del Bridge",
    price: 500,
    category: "titoli",
    preview: {
      gradient: "from-amber-300 via-yellow-400 to-amber-500",
      icon: <Gem className="w-5 h-5 text-white" />,
    },
    description: "Il titolo pi\u00f9 esclusivo e prestigioso in assoluto",
  },
];

/* ────────────────────────────────────────────── */
/*  Helpers                                        */
/* ────────────────────────────────────────────── */

function getFiches(): number {
  try {
    const raw = localStorage.getItem("bq_fiches");
    if (raw !== null) return parseInt(raw, 10) || 0;
    // Fallback: derive from XP as the profile page does
    const xp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
    const derived = Math.floor(xp / 10);
    // Persist so it is consistent
    localStorage.setItem("bq_fiches", String(derived));
    return derived;
  } catch {
    return 0;
  }
}

function setFiches(value: number) {
  try {
    localStorage.setItem("bq_fiches", String(value));
  } catch {}
}

function getOwnedItems(): string[] {
  try {
    const raw = localStorage.getItem("bq_shop_owned");
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  // Free items are always owned
  return shopItems.filter((i) => i.isFree).map((i) => i.id);
}

function setOwnedItems(items: string[]) {
  try {
    localStorage.setItem("bq_shop_owned", JSON.stringify(items));
  } catch {}
}

function getActiveItem(category: CategoryId): string | null {
  try {
    return localStorage.getItem(`bq_shop_active_${category}`);
  } catch {
    return null;
  }
}

function setActiveItem(category: CategoryId, itemId: string) {
  try {
    localStorage.setItem(`bq_shop_active_${category}`, itemId);
  } catch {}
}

/* Default actives for free items */
const defaultActives: Record<CategoryId, string> = {
  avatari: "",
  "temi-carta": "classico-blu",
  "sfondi-tavolo": "verde-classico",
  titoli: "maestro-di-bridge",
};

/* ────────────────────────────────────────────── */
/*  Confetti particle component                    */
/* ────────────────────────────────────────────── */

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#003DA5", "#FFD700", "#FF6B6B", "#4ADE80", "#A855F7", "#F59E0B"];
  const color = colors[index % colors.length];
  const angle = (index / 12) * 360;
  const radius = 40 + Math.random() * 60;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;
  const size = 4 + Math.random() * 6;
  const isCircle = index % 3 === 0;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        x: x,
        y: y - 20,
        scale: [1, 1.2, 0.5],
        rotate: Math.random() * 720 - 360,
      }}
      transition={{ duration: 0.8 + Math.random() * 0.4, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: size,
        height: isCircle ? size : size * 2.5,
        backgroundColor: color,
        borderRadius: isCircle ? "50%" : "2px",
        top: "50%",
        left: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex: 50,
      }}
    />
  );
}

/* ────────────────────────────────────────────── */
/*  Main page                                      */
/* ────────────────────────────────────────────── */

export default function NegozioPage() {
  const [fiches, setFichesState] = useState(0);
  const [owned, setOwned] = useState<string[]>([]);
  const [activeItems, setActiveItems] = useState<Record<CategoryId, string>>({ ...defaultActives });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("avatari");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confettiItemId, setConfettiItemId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const f = getFiches();
    setFichesState(f);

    const o = getOwnedItems();
    // Ensure free items are always in owned
    const freeIds = shopItems.filter((i) => i.isFree).map((i) => i.id);
    const allOwned = Array.from(new Set([...o, ...freeIds]));
    setOwned(allOwned);
    setOwnedItems(allOwned);

    // Load active items
    const actives: Record<CategoryId, string> = { ...defaultActives };
    for (const cat of categories) {
      const active = getActiveItem(cat.id);
      if (active && allOwned.includes(active)) {
        actives[cat.id] = active;
      }
    }
    setActiveItems(actives);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handlePurchase = useCallback(
    (item: ShopItem) => {
      if (owned.includes(item.id)) return;
      if (fiches < item.price) {
        showToast("Fiches insufficienti!", "error");
        return;
      }

      setPurchasingId(item.id);
      // Small delay for animation feel
      setTimeout(() => {
        const newFiches = fiches - item.price;
        const newOwned = [...owned, item.id];

        setFiches(newFiches);
        setFichesState(newFiches);
        setOwnedItems(newOwned);
        setOwned(newOwned);

        // Auto-equip on purchase
        setActiveItem(item.category, item.id);
        setActiveItems((prev) => ({ ...prev, [item.category]: item.id }));

        // Confetti
        setConfettiItemId(item.id);
        setTimeout(() => setConfettiItemId(null), 1200);

        showToast(`${item.name} acquistato!`, "success");
        setPurchasingId(null);
      }, 300);
    },
    [fiches, owned, showToast]
  );

  const handleEquip = useCallback(
    (item: ShopItem) => {
      if (!owned.includes(item.id)) return;
      setActiveItem(item.category, item.id);
      setActiveItems((prev) => ({ ...prev, [item.category]: item.id }));
      showToast(`${item.name} equipaggiato!`, "success");
    },
    [owned, showToast]
  );

  const filteredItems = shopItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="pt-6 px-5">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Negozio</h1>
              <p className="text-xs text-gray-500">Personalizza il tuo stile</p>
            </div>
          </div>
          <Link href="/profilo">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-300 rounded-2xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
              <Coins className="w-5 h-5 text-amber-600" />
              <span className="text-lg font-bold text-amber-700">{fiches}</span>
            </div>
          </Link>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? "bg-[#003DA5] text-white shadow-md shadow-[#003DA5]/20"
                    : "bg-white text-gray-500 border-2 border-[#e5e7eb] shadow-sm hover:border-gray-300"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Category description */}
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-5"
        >
          <p className="text-sm text-gray-500 font-medium">
            {selectedCategory === "avatari" && "Cornici decorative per il tuo profilo"}
            {selectedCategory === "temi-carta" && "Personalizza il retro delle tue carte"}
            {selectedCategory === "sfondi-tavolo" && "Cambia l'aspetto del tavolo da gioco"}
            {selectedCategory === "titoli" && "Titoli esclusivi sotto il tuo nome"}
          </p>
        </motion.div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => {
              const isOwned = owned.includes(item.id);
              const isActive = activeItems[item.category] === item.id;
              const isPurchasing = purchasingId === item.id;
              const showConfetti = confettiItemId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  layout
                  className="relative"
                >
                  <div
                    className={`card-clean rounded-2xl bg-white overflow-hidden transition-all ${
                      isActive
                        ? "border-[3px] border-[#003DA5] shadow-md shadow-[#003DA5]/10"
                        : "border-2 border-[#e5e7eb] shadow-sm"
                    }`}
                  >
                    {/* Preview area */}
                    <div className="relative">
                      <div
                        className={`h-28 bg-gradient-to-br ${item.preview.gradient} flex items-center justify-center`}
                      >
                        {/* Category-specific preview content */}
                        {item.category === "avatari" && (
                          <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ${item.preview.border || ""}`}>
                            {item.preview.icon || (
                              <Sparkles className="w-6 h-6 text-white/90" />
                            )}
                          </div>
                        )}
                        {item.category === "temi-carta" && (
                          <div className="relative w-14 h-20 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                            <div className="absolute inset-1 rounded-md bg-white/5 border border-white/20" />
                            <span className="text-white/80 text-xs font-bold tracking-widest">FIGB</span>
                          </div>
                        )}
                        {item.category === "sfondi-tavolo" && (
                          <div className="w-20 h-14 rounded-lg bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-lg">
                            <div className="grid grid-cols-2 gap-1">
                              {["N", "E", "S", "O"].map((dir) => (
                                <span key={dir} className="text-white/60 text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                                  {dir}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.category === "titoli" && (
                          <div className="flex flex-col items-center gap-1.5">
                            {item.preview.icon || <Star className="w-6 h-6 text-white/90" />}
                            <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/30">
                              <span className="text-white text-[10px] font-bold tracking-wide">{item.name}</span>
                            </div>
                          </div>
                        )}

                        {/* Owned badge */}
                        {isOwned && (
                          <div className="absolute top-2 right-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                          </div>
                        )}

                        {/* Active badge */}
                        {isActive && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-white text-[#003DA5] text-[9px] font-bold shadow-sm border-0 px-2 py-0.5">
                              IN USO
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Confetti overlay */}
                      {showConfetti && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <ConfettiParticle key={i} index={i} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Info & Action */}
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-1 mt-2 mb-2.5">
                        {item.isFree ? (
                          <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-emerald-200 border px-2 py-0.5">
                            Gratuito
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-sm font-bold text-amber-700">
                              {item.price}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      {isActive ? (
                        <div className="w-full h-9 rounded-xl bg-[#003DA5]/10 text-[#003DA5] flex items-center justify-center text-xs font-bold">
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Equipaggiato
                        </div>
                      ) : isOwned ? (
                        <Button
                          onClick={() => handleEquip(item)}
                          variant="outline"
                          className="w-full h-9 rounded-xl text-xs font-bold border-[#003DA5] text-[#003DA5] hover:bg-[#003DA5]/5"
                        >
                          Equipaggia
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePurchase(item)}
                          disabled={isPurchasing || fiches < item.price}
                          className={`w-full h-9 rounded-xl text-xs font-bold shadow-sm transition-all ${
                            fiches < item.price
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                              : "bg-[#003DA5] hover:bg-[#002E7A] text-white shadow-md shadow-[#003DA5]/20"
                          }`}
                        >
                          {isPurchasing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                          ) : fiches < item.price ? (
                            "Fiches insufficienti"
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5 mr-1" />
                              Acquista
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Currently active summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-clean rounded-2xl bg-white p-5 border-2 border-[#e5e7eb] shadow-sm mb-6"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#003DA5]" />
            Oggetti equipaggiati
          </h3>
          <div className="space-y-2.5">
            {categories.map((cat) => {
              const activeId = activeItems[cat.id];
              const activeItem = shopItems.find((i) => i.id === activeId);
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      {cat.label}
                    </p>
                    <p className="text-xs font-bold text-gray-700 truncate">
                      {activeItem ? activeItem.name : "Nessuno"}
                    </p>
                  </div>
                  {activeItem && (
                    <div
                      className={`w-6 h-6 rounded-md bg-gradient-to-br ${activeItem.preview.gradient}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* How to earn fiches hint */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-200 p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200/50 shrink-0">
              <Coins className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Come guadagnare fiches?</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Guadagni fiches completando lezioni, giocando mani e mantenendo la tua streak giornaliera. Ogni 10 XP = 1 fiche.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white shadow-emerald-500/30"
                  : "bg-rose-600 text-white shadow-rose-500/30"
              }`}
            >
              {toast.type === "success" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

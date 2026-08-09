"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { MapPin, Navigation, School, Filter, ChevronDown, ExternalLink } from "lucide-react";
import { useAsdClubs } from "@/store/use-asd-store";
import type { AsdClub } from "@/lib/catalog";
import { asdNameToSlug } from "@/lib/asd-utils";

type FilterMode = "tutti" | "scuola";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMapsUrl(club: AsdClub): string {
  const q = encodeURIComponent(`${club.name}, ${club.address}`);
  return `https://maps.google.com/maps?q=${q}`;
}

export default function TrovaCircoloPage() {
  const { clubs: allClubs } = useAsdClubs();
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("tutti");
  const [searchText, setSearchText] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [maxResults, setMaxResults] = useState(20);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Il tuo browser non supporta la geolocalizzazione");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        if (err.code === 1) setGeoError("Permesso di geolocalizzazione negato. Abilita la posizione nelle impostazioni del browser.");
        else if (err.code === 2) setGeoError("Posizione non disponibile. Riprova.");
        else setGeoError("Timeout nella geolocalizzazione. Riprova.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Auto-request on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avvio geolocalizzazione al mount: lo stato di loading fa parte del flusso asincrono
    requestLocation();
  }, [requestLocation]);

  const filteredClubs = useMemo(() => {
    let clubs: AsdClub[] = allClubs;
    if (showOnlyActive) clubs = clubs.filter((c) => c.active);
    if (filter === "scuola") clubs = clubs.filter((c) => c.hasSchool);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      clubs = clubs.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.province.toLowerCase().includes(q) ||
          c.cap.includes(q)
      );
    }
    return clubs;
  }, [allClubs, filter, searchText, showOnlyActive]);

  const sortedClubs = useMemo(() => {
    if (!userPos) {
      return filteredClubs.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filteredClubs]
      .map((c) => ({
        ...c,
        distance: haversineKm(userPos.lat, userPos.lng, c.lat, c.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [filteredClubs, userPos]);

  const displayedClubs = sortedClubs.slice(0, maxResults);
  const hasMore = sortedClubs.length > maxResults;

  const schoolCount = useMemo(() => filteredClubs.filter((c) => c.hasSchool).length, [filteredClubs]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-figb to-figb-light text-white px-4 pt-8 pb-10">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-xs text-white/60 mb-3">
              <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white/90 font-semibold">Trova la tua ASD</span>
            </div>
            <h1 className="text-3xl font-bold font-display mb-2">Trova la tua ASD</h1>
            <p className="text-white/80 text-base">
              {filteredClubs.length} associazioni FIGB in tutta Italia{filter === "scuola" ? " con scuola bridge" : ""}
            </p>
          </motion.div>

          {/* Location Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5"
          >
            {geoLoading ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Ricerca posizione...</span>
              </div>
            ) : userPos ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <Navigation className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span className="text-sm text-white/90">Posizione trovata! Associazioni ordinate per distanza.</span>
              </div>
            ) : geoError ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-sm text-white/80 mb-2">{geoError}</p>
                <button
                  onClick={requestLocation}
                  className="text-sm font-bold text-white bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  Riprova
                </button>
              </div>
            ) : (
              <button
                onClick={requestLocation}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-sm font-bold hover:bg-white/30 transition-colors w-full"
              >
                <MapPin className="w-4 h-4" />
                Condividi posizione per trovare le ASD vicine
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4">
        <div className="mx-auto max-w-6xl">
          {/* Search + Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl card-elevated p-4 mb-4"
          >
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Cerca per nome, città o CAP..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-figb dark:focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("tutti")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  filter === "tutti"
                    ? "bg-figb text-white shadow-lg shadow-figb/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <MapPin className="w-4 h-4" />
                Tutti ({filteredClubs.length})
              </button>
              <button
                onClick={() => setFilter("scuola")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  filter === "scuola"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <School className="w-4 h-4" />
                Con Scuola ({schoolCount})
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground font-bold hover:text-muted-foreground transition-colors"
            >
              <Filter className="w-3 h-3" />
              Filtri avanzati
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pt-2 border-t border-border/60"
                >
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyActive}
                      onChange={(e) => setShowOnlyActive(e.target.checked)}
                      className="rounded border-border text-figb dark:text-primary focus:ring-figb dark:focus:ring-primary"
                    />
                    Solo ASD attive (iscritte 2025/2026)
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results */}
          <div className="space-y-2">
            {displayedClubs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-lg font-bold text-foreground">Nessuna ASD trovata</p>
                <p className="text-sm text-muted-foreground mt-1">Prova a modificare i filtri o la ricerca</p>
              </motion.div>
            ) : (
              displayedClubs.map((club, i) => {
                const dist = "distance" in club ? (club as AsdClub & { distance: number }).distance : null;
                return (
                  <motion.div
                    key={club.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="bg-card rounded-2xl card-clean p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Distance or index badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                        club.hasSchool
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-figb/5 text-figb dark:bg-primary/15 dark:text-primary"
                      }`}>
                        {dist !== null ? (
                          <>
                            <span className="text-[11px] font-black leading-none">{dist < 1 ? `${Math.round(dist * 1000)}` : dist < 10 ? dist.toFixed(1) : Math.round(dist).toString()}</span>
                            <span className="text-[8px] font-bold opacity-60">{dist < 1 ? "m" : "km"}</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold">{i + 1}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-sm font-bold text-foreground truncate">{club.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {club.hasSchool && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                              <School className="w-2.5 h-2.5" />
                              SCUOLA BRIDGE
                            </span>
                          )}
                          {club.active && (
                            <span className="text-[10px] font-bold text-figb dark:text-primary bg-figb/5 dark:bg-primary/15 px-1.5 py-0.5 rounded">
                              ATTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {club.address}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
                      <a
                        href={getMapsUrl(club)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-figb dark:text-primary bg-figb/5 dark:bg-primary/15 rounded-lg py-2 hover:bg-figb/10 dark:hover:bg-primary/20 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Indicazioni
                      </a>
                      <Link
                        href={`/circolo/${asdNameToSlug(club.name)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 rounded-lg py-2 hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Classifica
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Load more */}
            {hasMore && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setMaxResults((prev) => prev + 20)}
                className="w-full py-3 text-sm font-bold text-figb dark:text-primary bg-card rounded-2xl card-clean hover:shadow-lg transition-shadow"
              >
                Mostra altri ({sortedClubs.length - maxResults} rimanenti)
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { asdNameToSlug } from "@/lib/asd-utils";
import type { Profile } from "@/hooks/use-auth";
import type { ShopCosmetics } from "@/hooks/use-shop-cosmetics";
import type { User } from "@supabase/supabase-js";
import { useT } from "@/contexts/traduzioni-provider";

/** Avatar, nome, titolo cosmetico, circolo e livello dell'utente. */
export function ProfileHeader({
  user,
  authProfile,
  cosmetics,
  level,
  levelName,
}: {
  user: User | null;
  authProfile: Profile | null;
  cosmetics: ShopCosmetics;
  level: number;
  levelName: string;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4"
    >
      <Avatar className={`h-18 w-18 shadow-lg shadow-figb/20 ${cosmetics.avatarFrame || ""}`}>
        {user && authProfile?.avatar_url ? (
          <Image src={authProfile.avatar_url} alt={t("Foto profilo")} width={72} height={72} className="h-18 w-18 rounded-full object-cover" />
        ) : (
          <AvatarFallback className="h-18 w-18 bg-figb text-white text-2xl font-bold">
            {user && authProfile?.display_name ? authProfile.display_name[0].toUpperCase() : "?"}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground font-display">
          {user && authProfile?.display_name ? authProfile.display_name : "Bridgista"}
        </h1>
        {cosmetics.activeTitle && (
          <p className="text-xs font-semibold text-figb dark:text-primary">{cosmetics.activeTitle}</p>
        )}
        {user && authProfile?.bbo_username && (
          <p className="text-xs text-muted-foreground">BBO: {authProfile.bbo_username}</p>
        )}
        {user && authProfile?.asd_code && authProfile?.asd_name && (
          <Link href={`/circolo/${asdNameToSlug(authProfile.asd_name)}`} className="text-sm text-figb dark:text-primary hover:underline flex items-center gap-1 mt-0.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            {authProfile.asd_name}
          </Link>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge className="bg-figb text-white font-medium text-xs">
            Livello {level}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs text-muted-foreground border-border"
          >
            {levelName}
          </Badge>
        </div>
      </div>
      <Link href="/impostazioni" className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/70 transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
    </motion.div>
  );
}

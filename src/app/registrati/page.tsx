"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSharedAuth } from "@/contexts/auth-provider";

export default function RegistratiRedirect() {
  const router = useRouter();
  const { user, loading } = useSharedAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/");
    } else {
      router.replace("/login?mode=signup");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

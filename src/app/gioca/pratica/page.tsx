"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PraticaPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to smazzata with a random hand
    const randomIndex = Math.floor(Math.random() * 50);
    router.replace(`/gioca/smazzata?random=${randomIndex}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-[#003DA5]" />
    </div>
  );
}

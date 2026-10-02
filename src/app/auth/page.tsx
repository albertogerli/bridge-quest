"use client";

import { useEffect } from "react";
import { useRouter } from "@/hooks/use-router-lingua";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}

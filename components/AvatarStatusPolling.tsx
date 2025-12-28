"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AvatarStatusPollingProps {
  avatarId: string;
  currentStatus: string;
  interval?: number;
}

export default function AvatarStatusPolling({
  avatarId,
  currentStatus,
  interval = 5000,
}: AvatarStatusPollingProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Only poll if avatar is not in final state
    if (currentStatus === "completed" || currentStatus === "failed") {
      return;
    }

    const pollStatus = async () => {
      const { data } = await supabase
        .from("avatars")
        .select("status")
        .eq("id", avatarId)
        .single();

      if (data && data.status !== currentStatus) {
        router.refresh();
      }
    };

    const intervalId = setInterval(pollStatus, interval);

    return () => clearInterval(intervalId);
  }, [avatarId, currentStatus, interval, router, supabase]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface JobStatusPollingProps {
  jobId: string;
  currentStatus: string;
  interval?: number;
}

export default function JobStatusPolling({
  jobId,
  currentStatus,
  interval = 5000,
}: JobStatusPollingProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Only poll if job is not in final state
    if (currentStatus === "completed" || currentStatus === "failed") {
      return;
    }

    const pollStatus = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", jobId)
        .single();

      if (data && data.status !== currentStatus) {
        router.refresh();
      }
    };

    const intervalId = setInterval(pollStatus, interval);

    return () => clearInterval(intervalId);
  }, [jobId, currentStatus, interval, router, supabase]);

  return null;
}

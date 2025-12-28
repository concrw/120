import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RealModelTransfer from "@/components/RealModelTransfer";

export default async function TransferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <RealModelTransfer />
      </div>
    </div>
  );
}

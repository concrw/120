import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CustomAvatarUploader from "@/components/CustomAvatarUploader";
import Link from "next/link";

export default async function CustomAvatarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-secondary-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/avatars"
              className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-secondary-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-heading-md text-secondary-900">Custom Avatar</h1>
              <p className="text-body-sm text-secondary-500">
                Create AI model from your photos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <CustomAvatarUploader />
        </div>
      </main>
    </div>
  );
}

import DashboardLayout from "@/components/DashboardLayout";
import CreateVideoForm from "@/components/CreateVideoForm";
import { Suspense } from "react";

export default function CreateVideoPage() {
  return (
    <DashboardLayout currentPage="create">
      <Suspense
        fallback={
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-secondary-200 rounded w-1/4" />
            <div className="h-4 bg-secondary-200 rounded w-1/2" />
            <div className="card p-6">
              <div className="h-40 bg-secondary-100 rounded-xl" />
            </div>
          </div>
        }
      >
        <CreateVideoForm />
      </Suspense>
    </DashboardLayout>
  );
}

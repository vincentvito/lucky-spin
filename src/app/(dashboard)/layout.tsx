import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header email={user.email} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
        </main>
      </div>
    </div>
  );
}

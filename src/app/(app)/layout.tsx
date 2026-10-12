import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AppProvider } from "@/components/AppContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  // couples have their own area; the staff app is off-limits
  if (profile.role === "client") redirect("/plano/conta");

  return (
    <AppProvider profile={profile}>
      <div className="flex min-h-screen">
        <Sidebar role={profile.role} />
        <main className="min-w-0 flex-1">
          <Topbar profile={profile} />
          {children}
        </main>
      </div>
    </AppProvider>
  );
}

import { SetPasswordForm } from "@/components/seating/ClientAuth";

// Invite and password-reset emails land here (Supabase redirectTo).
export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4">
      <div className="text-[11px] font-medium tracking-[0.2em] text-gold uppercase">Organizza · Casamentos</div>
      <SetPasswordForm />
    </div>
  );
}

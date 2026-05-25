import { AuthGuard } from "../../src/components/authGuard";
import { AppShell } from "../../src/components/appShell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

import { AppShell } from "../../components/shell";
import { AdminDashboardWorkspace } from "../../components/admin-dashboard-workspace";

export default function AdminPage() {
  return (
    <AppShell
      admin
      activeSlug="admin"
      title="Welcome back, Admin"
      subtitle="Here is what is happening with your platform today."
    >
      <AdminDashboardWorkspace />
    </AppShell>
  );
}

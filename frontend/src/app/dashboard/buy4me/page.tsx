import { AppShell } from "../../../components/shell";
import { Buy4MeWorkspace } from "../../../components/buy4me-workspace";

export default function Buy4MeDashboardPage() {
  return (
    <AppShell activeSlug="buy4me" title="Buy For Me" subtitle="You shop, we handle the rest.">
      <Buy4MeWorkspace />
    </AppShell>
  );
}

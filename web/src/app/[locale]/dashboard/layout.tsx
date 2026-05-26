import { AskHemaChain } from "@/components/ai/AskHemaChain";
import { LiveActivity } from "@/components/dashboard/LiveActivity";

/**
 * Wraps every dashboard sub-page with the live activity feed (SSE toasts +
 * connection pill) and the "Ask HemaChain" agent. Mounted here so both stay
 * available across role panels but never on public or landing routes.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <LiveActivity />
      <AskHemaChain />
    </>
  );
}

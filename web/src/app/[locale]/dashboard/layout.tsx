import { LiveActivity } from "@/components/dashboard/LiveActivity";

/**
 * Wraps every dashboard sub-page with the live activity feed (SSE toasts +
 * connection pill). Mounted here so the stream stays open across role panels
 * but never on public or landing routes.
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
    </>
  );
}

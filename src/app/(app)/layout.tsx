// This layout is intentionally a passthrough.
// The root app layout (src/app/layout.tsx) + AppShell handles all layout concerns.
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

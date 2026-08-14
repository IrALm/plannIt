export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg text-ink flex flex-col">{children}</div>;
}

// Placeholder: the auth foundation adds the real session guard here,
// and the app-shell work wraps children with navigation.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="mx-auto w-full max-w-md lg:max-w-4xl">{children}</main>;
}

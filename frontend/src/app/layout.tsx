import "./globals.css";
import NavigationShell from "../components/NavigationShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="min-h-screen flex flex-col bg-(--bg-base) text-(--text-primary)">
        <NavigationShell>{children}</NavigationShell>
      </body>
    </html>
  );
}



import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Adobe Stock Icon Automation Pipeline',
  description: 'Automated 32-Icon Prompt Generator & Flow AI Automation Suite',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

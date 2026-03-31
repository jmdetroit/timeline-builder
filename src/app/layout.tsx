import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Timeline Builder',
  description: 'Create beautiful timeline roadmaps and export as SVG for presentations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

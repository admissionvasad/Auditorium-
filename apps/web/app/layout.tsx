import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVIT Notify',
  description: 'Central WhatsApp + SMS notification system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

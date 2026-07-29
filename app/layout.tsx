import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SessionProtector from '@/components/SessionProtector';

export const metadata: Metadata = {
  title: 'JVITE – Journal of Vocational & Industrial Technology Education',
  description:
    'Peer-reviewed open-access journal in vocational education and industrial technology.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProtector />
        <Header />
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}

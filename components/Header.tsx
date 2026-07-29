'use client';

import Link from 'next/link';
import { journalInfo } from '@/lib/data';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  if (pathname.startsWith('/editor')) return null;

  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="inner">
          <span>e-ISSN: {journalInfo.e_issn} &nbsp;·&nbsp; {journalInfo.frequency}</span>
          <span>
            <Link href="/about#editorial-board">Editorial Board</Link> &nbsp;|&nbsp;{' '}
            <a href="#">Indexing</a> &nbsp;|&nbsp;{' '}
            <Link href="/editor/login">Login</Link>
          </span>
        </div>
      </div>
      <div className="inner">
        <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img src="/logo.png" alt="BOUESTI JVITE Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0, transform: 'scale(0.8)' }} />
          <div className="brand-text">
            <h1>Journal of Research in Vocational &amp; Technical Education</h1>
            <p>{journalInfo.publisher}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

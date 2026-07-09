import Link from 'next/link';
import { journalInfo } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <img src="/logo.png" alt="BOUESTI Crest Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <h4 style={{ margin: 0 }}>About {journalInfo.shortName}</h4>
          </div>
          <p style={{ fontSize: '0.9rem' }}>
            A peer-reviewed, open-access journal publishing high-quality research
            in vocational and industrial technology education since {journalInfo.founded}.
          </p>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {journalInfo.issn}
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/about">About the Journal</Link></li>
            <li><Link href="/issues">Current &amp; Past Issues</Link></li>
            <li><Link href="/guidelines">Author Guidelines</Link></li>
            <li><Link href="/submit">Submit Manuscript</Link></li>
          </ul>
        </div>
        <div>
          <h4>For Readers</h4>
          <ul>
            <li><a href="#">Search Articles</a></li>
            <li><a href="#">Special Issues</a></li>
            <li><a href="#">Most Cited</a></li>
            <li><a href="#">RSS Feed</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li>Dept. of Vocational &amp; Industrial Technology Education,BOUESTI</li>
            <li>editor@jvite.bouesti.edu</li>
            <li>+1 (555) 234-5678</li>
            <li><Link href="/contact">Contact Form</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} {journalInfo.publisher}. All rights reserved. ·{' '}
        <a href="#">Privacy</a> · <a href="#">Terms</a>
      </div>
    </footer>
  );
}

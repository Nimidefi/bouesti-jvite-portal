'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/issues', label: 'Issues' },
  { href: '/guidelines', label: 'Guidelines' },
  { href: '/submit', label: 'Submit Article' },
  { href: '/dashboard', label: 'My Submissions' },
  { href: '/reviewer', label: 'Reviewer Portal' },
  { href: '/contact', label: 'Contact' },
];

export default function Navigation() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/editor')) return null;

  return (
    <nav className="main-nav">
      <div className="inner">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? 'active' : ''}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

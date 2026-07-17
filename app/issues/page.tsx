import Link from 'next/link';
import { issues } from '@/lib/data';
import { API_URL } from '@/lib/config';

export default async function IssuesPage() {
  const years = Array.from(new Set(issues.map((i) => i.year))).sort((a, b) => b - a);
  
  let recentArticles = [];
  try {
    const res = await fetch(`${API_URL}/api/submissions`, { cache: 'no-store' });
    if (res.ok) {
      const submissions = await res.json();
      recentArticles = submissions
        .filter((s: any) => s.status === 'published')
        .map((s: any, idx: number) => ({
          id: s.id,
          title: s.title,
          authors: s.author.name + (s.coAuthors?.length ? ' et al.' : ''),
          pages: 'TBD',
          doi: `10.1234/jvite.latest.${idx + 1}`,
          manuscriptName: s.manuscriptName,
        }));
    }
  } catch (e) {
    console.error('Failed to fetch submissions', e);
  }

  return (
    <div className="page">
      <div className="main-col">
        <div className="card">
          <h1 className="section-title"> Issues &amp; Archives</h1>
          <p>
            Browse all published volumes of JVITE. All articles are openly accessible under the
            CC BY 4.0 license.
          </p>
        </div>

        {recentArticles.length > 0 && (
          <div className="card" style={{ borderColor: 'var(--color-primary)' }}>
            <h2 className="section-title"> Current Issue (Continuous Publication)</h2>
            <div className="issue-card">
              <div className="issue-meta" style={{ marginLeft: 0 }}>
                <h3>Recently Published Articles</h3>
                <p className="muted">These articles have been peer-reviewed and published immediately.</p>
                <div className="article-list">
                  {recentArticles.map((a: any) => (
                    <div className="article-item" key={a.id}>
                      <div className="title">
                        <a href={`${API_URL}/uploads/${encodeURIComponent(a.manuscriptName)}`} target="_blank" rel="noreferrer">
                          {a.title}
                        </a>
                      </div>
                      <div className="meta">
                        {a.authors} · DOI: {a.doi}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {years.map((year) => {
          const yearIssues = issues.filter((i) => i.year === year);
          return (
            <div className="card" key={year}>
              <h2 className="section-title"> {year}</h2>
              {yearIssues.map((i) => (
                <div className="issue-card" key={`${i.volume}-${i.number}`}>
                  <div className="issue-cover">
                    <div className="vol">Vol {i.volume}</div>
                    <div>No {i.number}</div>
                    <div className="year">{i.year}</div>
                  </div>
                  <div className="issue-meta">
                    <h3>{i.title}</h3>
                    <p className="muted">
                      Published{' '}
                      {new Date(i.publishedAt).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}{' '}
                      · {i.articleCount} articles
                    </p>
                    <div className="article-list">
                      {i.articles.slice(0, 4).map((a) => (
                        <div className="article-item" key={a.id}>
                          <div className="title">
                            <a href="#">{a.title}</a>
                          </div>
                          <div className="meta">
                            {a.authors} · pp. {a.pages} · DOI: {a.doi}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="row" style={{ marginTop: '0.75rem' }}>
                      <a href="#" className="btn btn-secondary">View Articles</a>
                      <a href="#" className="btn btn-ghost" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>Download Full Issue (PDF)</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Search</h3>
          <div className="form-group">
            <input type="search" placeholder="Search articles..." />
          </div>
          <button className="btn btn-primary btn-block">Search</button>
        </div>
        <div className="widget">
          <h3> Browse By</h3>
          <ul>
            <li><Link href="#">Author</Link></li>
            <li><Link href="#">Keywords</Link></li>
            <li><Link href="#">Category</Link></li>
            <li><Link href="#">Most Cited</Link></li>
            <li><Link href="#">Most Downloaded</Link></li>
          </ul>
        </div>
        <div className="widget">
          <h3> Export</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>Get citation in:</p>
          <ul>
            <li><a href="#">APA Format</a></li>
            <li><a href="#">MLA Format</a></li>
            <li><a href="#">BibTeX</a></li>
            <li><a href="#">EndNote</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

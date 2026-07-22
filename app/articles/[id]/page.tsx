import { API_URL } from '@/lib/config';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const res = await fetch(`${API_URL}/api/submissions/${params.id}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Article Not Found' };
    const article = await res.json();
    return {
      title: `${article.title} | Dovite Journal`,
      description: article.abstract,
    };
  } catch (e) {
    return { title: 'Article' };
  }
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  let article;
  try {
    const res = await fetch(`${API_URL}/api/submissions/${params.id}`, { cache: 'no-store' });
    if (!res.ok) {
      notFound();
    }
    article = await res.json();
  } catch (e) {
    notFound();
  }

  const authors = [article.author, ...(article.coAuthors || [])];
  const pdfUrl = `${API_URL}/api/uploads/view/${encodeURIComponent(article.manuscriptName)}`;

  // Use the submission date as the publication date for now
  // In a real app, this should be the actual published_at date
  const pubDate = article.submittedAt ? new Date(article.submittedAt).toLocaleDateString('en-CA').replace(/-/g, '/') : '';

  return (
    <>
      {/* Highwire Press Meta Tags for Google Scholar */}
      {/* React 18 will automatically hoist these to the document <head> */}
      <meta name="citation_title" content={article.title} />
      {authors.map((author: any, idx: number) => (
        <meta key={`author-${idx}`} name="citation_author" content={author.name} />
      ))}
      <meta name="citation_publication_date" content={pubDate} />
      <meta name="citation_journal_title" content="Dovite Journal of Multidisciplinary Research" />
      <meta name="citation_pdf_url" content={pdfUrl} />
      <meta name="citation_abstract_html_url" content={`/articles/${article.id}`} />

      <div className="animate-fade-in-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        <div className="glass-panel" style={{ padding: '0', marginBottom: '3rem', position: 'relative', overflow: 'hidden', minHeight: '60vh' }}>
          {/* Decorative accent line */}
          <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }}></div>
          
          <div style={{ padding: '4rem 3rem' }}>
            <div className="article-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '3rem', lineHeight: '1.25', marginBottom: '1.5rem', fontWeight: '700' }}>{article.title}</h1>
              <div className="authors" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: '500' }}>
                {authors.map((a: any) => a.name).join(', ')}
              </div>
            </div>

            <div className="article-abstract" style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-dark)' }}>
                <span style={{ width: '4px', height: '1.1em', backgroundColor: 'var(--color-accent)', display: 'inline-block', borderRadius: '2px' }}></span>
                Abstract
              </h2>
              <p style={{ lineHeight: '1.75', fontSize: '1.05rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{article.abstract}</p>
            </div>

            {article.keywords && article.keywords.length > 0 && (
              <div className="article-keywords" style={{ marginBottom: '2.5rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--color-primary-dark)', fontSize: '1rem' }}>Keywords: </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {article.keywords.map((kw: string, idx: number) => (
                    <span key={idx} style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-primary)', padding: '0.4rem 1.25rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '500' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(250, 249, 246, 0.6)', padding: '2rem 3rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="metadata-grid" style={{ margin: '0 0 2rem 0', background: 'transparent', padding: 0, border: 'none' }}>
              <div className="metadata-item">
                <span className="metadata-label">Published Date</span>
                <span className="metadata-value">{new Date(article.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Journal</span>
                <span className="metadata-value">Dovite Journal</span>
              </div>
              {article.doi && (
                <div className="metadata-item">
                  <span className="metadata-label">DOI</span>
                  <span className="metadata-value">{article.doi}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-premium">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Full-Text PDF
              </a>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <Link href="/issues" className="btn btn-secondary" style={{ borderRadius: '999px', padding: '0.6rem 1.5rem' }}>
            &larr; Back to Issues Archive
          </Link>
        </div>
      </div>
    </>
  );
}

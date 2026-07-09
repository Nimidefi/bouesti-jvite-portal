import Link from 'next/link';
import { issues, journalInfo, reviewProcess } from '@/lib/data';
import { Bold } from 'lucide-react';

export default function HomePage() {
  const currentIssue = issues[0];
  const recentIssues = issues.slice(0, 3);

  return (
    <div className="page">
      <div className="main-col">
        <section className="hero">
          <h1>About the Journal</h1>
          <p>
            The Journal of Research in Vocational and Industrial Technology Education is a publication of the department of vocational and industrial technology education,BOEUSTI, serving schools, colleges, polytechnics, universities, and other educational institutions committed to advancing relevant and appropriate education and technology within technical and vocational fields at both school and college levels.
          </p>  
          <p>
            The editorial board welcomes and publishes original, scholarly contributions including empirical and scientific research, as well as creative and innovative reviews and reports aimed at promoting the teaching, learning, and advancement of applied science and technology within technical and vocational education.
          </p> 
          <p> 
            Each volume of the journal features articles organized under the following four sections:
          <br />
            1. Technical and Vocational Education <br />
            2. Applied Science and Technology <br />
            3. Entrepreneurship in BVTE <br />
            4. Current Issues in Education <br />

           <br /><strong> Submissions that fall outside these thematic areas or exceed the prescribed page limits will only be considered in rare and exceptional circumstances.</strong>
            <br />
            <em>The Nigeria Association of Technical Educators bears no responsibility for the opinions or claims expressed in articles published in the Journal of Research in Vocational and Industrial Technology Education. All views and claims presented are solely those of the respective authors and do not represent the position of the Editorial Board unless explicitly stated otherwise.</em>
          </p>
          <div className="hero-actions">
            <Link href="/submit" className="btn btn-primary">Submit Your Manuscript</Link>
            <Link href="/issues" className="btn btn-ghost">Browse Latest Issue</Link>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Announcements</h2>
          <div className="alert alert-info">
            <strong>Call for Papers — Vol. 8, No. 1 (June 2026)</strong>
            <p style={{ marginTop: '0.4rem' }}>
              JVITE invites original research articles on <em>AI &amp; Automation in Skills
              Training</em>. Submission deadline: <strong>31 March 2026</strong>.
            </p>
          </div>
          <div className="alert alert-warning">
            <strong>Special Issue Open:</strong> Green Skills &amp; Sustainability in TVET — Guest
            editors are now accepting proposals.
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Current Issue</h2>
          <div className="issue-card">
            <div className="issue-cover">
              <div className="vol">Vol {currentIssue.volume}</div>
              <div>No {currentIssue.number}</div>
              <div className="year">{currentIssue.year}</div>
            </div>
            <div className="issue-meta">
              <h3>{currentIssue.title}</h3>
              <p className="muted">
                Published {new Date(currentIssue.publishedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })} · {currentIssue.articleCount} articles
              </p>
              <div className="article-list">
                {currentIssue.articles.slice(0, 3).map((a) => (
                  <div className="article-item" key={a.id}>
                    <div className="title">{a.title}</div>
                    <div className="meta">{a.authors} · pp. {a.pages} · DOI: {a.doi}</div>
                  </div>
                ))}
              </div>
              <Link href="/issues" className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
                View Full Issue
              </Link>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Aims &amp; Scope</h2>
          <p>{journalInfo.description}</p>
          <p><strong>Topics covered include:</strong></p>
          <ul style={{ paddingLeft: '1.5rem', columnCount: 2, columnGap: '2rem' }}>
            {journalInfo.scope.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <div className="callout">
            <strong>Open Access:</strong> All articles are published under a Creative Commons
            Attribution (CC BY 4.0) license. A nominal publication fee of{' '}
            <strong>${journalInfo.publicationFee} {journalInfo.currency}</strong> applies upon acceptance.
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Peer Review Process</h2>
          <p>JVITE follows a rigorous double-blind peer review process to ensure the highest
            academic standards.</p>
          <ol style={{ paddingLeft: '1.5rem', marginTop: '0.75rem' }}>
            {reviewProcess.map((r) => (
              <li key={r.step} style={{ marginBottom: '0.5rem' }}>
                <strong>{r.title}.</strong> {r.desc}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Journal Metrics</h3>
          <ul>
            <li><span>Impact Factor: </span><strong>2.4</strong></li>
            <li><span>Acceptance Rate: </span><strong>28%</strong></li>
            <li><span>Time to First Decision: </span><strong>14 days</strong></li>
            <li><span>Time to Publication: </span><strong>45 days</strong></li>
            <li><span>Founded: </span><strong>{journalInfo.founded}</strong></li>
          </ul>
        </div>

        <div className="widget">
          <h3>Recent Issues</h3>
          <ul>
            {recentIssues.map((i) => (
              <li key={`${i.volume}-${i.number}`}>
                <Link href="/issues">
                  <span>Vol {i.volume}, No {i.number} ({i.year})</span>
                  <span className="badge">{i.articleCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="widget">
          <h3>Indexed In</h3>
          <ul>
            {journalInfo.indexing.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </div>

        <div className="widget">
          <h3>Stay Updated</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Subscribe to our newsletter for calls for papers and new issue alerts.
          </p>
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <input type="email" placeholder="Your email address" />
          </div>
          <button className="btn btn-primary btn-block">Subscribe</button>
        </div>
      </aside>
    </div>
  );
}

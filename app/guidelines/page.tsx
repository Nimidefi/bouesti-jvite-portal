import Link from 'next/link';
import { guidelines, categories, journalInfo, reviewProcess } from '@/lib/data';

export default function GuidelinesPage() {
  return (
    <div className="page">
      <div className="main-col">
        <div className="card">
          <h1 className="section-title">Author Guidelines</h1>
          <p>
            Please review the following guidelines carefully before submitting your manuscript to{' '}
            {journalInfo.shortName}. Submissions that do not adhere to these standards may be
            returned to the author without review.
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">1. Manuscript Types</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Original Research Articles</strong> (4,000–8,000 words) — Empirical studies</li>
            <li><strong>Review Articles</strong> (5,000–10,000 words) — Systematic or narrative reviews</li>
            <li><strong>Case Studies</strong> (3,000–5,000 words) — Practitioner reports</li>
            <li><strong>Short Communications</strong> (2,000–3,000 words) — Brief reports</li>
            <li><strong>Editorials / Commentaries</strong> (1,500–2,000 words) — By invitation</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="section-title">2. Formatting Requirements</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Microsoft Word (.doc/.docx) or LaTeX format</li>
            <li>A4 paper, 2.5 cm margins, double-spaced, 12-pt Times New Roman</li>
            <li>Continuous line numbering</li>
            <li>Tables and figures embedded in the text (with separate high-res files on acceptance)</li>
            <li><strong>APA 7th edition</strong> referencing style</li>
            <li>Anonymous submission — no author identifiers in the main document</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="section-title">3. Required Components</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            {guidelines.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </div>

        <div className="card">
          <h2 className="section-title">4. Categories</h2>
          <p>Select the most appropriate category for your manuscript:</p>
          <ul style={{ paddingLeft: '1.5rem', columnCount: 2 }}>
            {categories.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>

        <div className="card">
          <h2 className="section-title">5. Peer Review Timeline</h2>
          <table>
            <thead>
              <tr><th>Stage</th><th>Typical Duration</th></tr>
            </thead>
            <tbody>
              {reviewProcess.map((r) => (
                <tr key={r.step}><td>{r.title}</td><td>{r.desc}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="section-title">6. Publication Fees</h2>
          <div className="callout">
            <p>
              <strong>Article Processing Charge (APC):</strong> ${journalInfo.publicationFee} {journalInfo.currency}
            </p>
            <p>
              The APC is invoiced <strong>only upon acceptance</strong> of the manuscript. There are
              no submission or review fees. Waivers are available for authors from low- and
              lower-middle-income countries.
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">7. Copyright &amp; Licensing</h2>
          <p>
            Authors retain copyright of their work. Published articles are licensed under{' '}
            <strong>Creative Commons Attribution 4.0 (CC BY 4.0)</strong>, allowing unrestricted
            use, distribution, and reproduction with proper attribution.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', background: 'var(--color-primary)' }}>
          <h2 style={{ color: '#fff' }}>Ready to Submit?</h2>
          <p style={{ color: '#e7e7e7' }}>Our online submission system takes about 10 minutes.</p>
          <Link href="/submit" className="btn btn-primary">Begin Submission</Link>
        </div>
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Checklist</h3>
          <ul>
            <li>Word count appropriate</li>
            <li>Anonymous manuscript</li>
            <li>APA 7th references</li>
            <li>Abstract 150–250 words</li>
            <li>4–6 keywords</li>
            <li>ORCID for all authors</li>
            <li>Cover letter prepared</li>
          </ul>
        </div>
        <div className="widget">
          <h3>Templates</h3>
          <ul>
            <li><a href="#">Word Template (.docx)</a></li>
            <li><a href="#">LaTeX Template</a></li>
            <li><a href="#">Cover Letter Sample</a></li>
            <li><a href="#">Copyright Form</a></li>
          </ul>
        </div>
        <div className="widget">
          <h3>❓Need Help?</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Email the editorial office at <strong>submissions@jvite.example.edu</strong>
          </p>
        </div>
      </aside>
    </div>
  );
}

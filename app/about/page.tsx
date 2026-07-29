import Link from 'next/link';
import { journalInfo, reviewProcess } from '@/lib/data';

export default function AboutPage() {
  return (
    <div className="page">
      <div className="main-col">
        <div className="card">
          <h1 className="section-title">About the Journal</h1>
          <p>
            The <strong>{journalInfo.title} ({journalInfo.shortName})</strong> is the flagship
            peer-reviewed publication of the {journalInfo.publisher}, established in {journalInfo.founded}.
            The journal serves as a vital platform for scholars, practitioners, and policy-makers
            engaged in vocational and industrial technology education worldwide.
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">Mission</h2>
          <p>
            To advance the theory, practice, and policy of vocational and industrial technology
            education by publishing rigorous, original research that addresses the evolving needs
            of the global workforce.
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">Scope</h2>
          <p>JVITE welcomes empirical, theoretical, and review articles in areas including:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            {journalInfo.scope.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>

        <div id="editorial-board" className="card" style={{ scrollMarginTop: '2rem' }}>
          <h2 className="section-title">Editorial Board</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Role</th><th>Affiliation</th></tr>
            </thead>
            <tbody>
              <tr><td>Prof. R.S. Olojuolawe</td><td>Editor-in-Chief</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Prof. E.O. Osuntuyi</td><td>Managing Editor</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Prof. A.B. Ibidapo</td><td>Managing Editor</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Dr. Theodorio, A.O.</td><td>Consulting Editor</td><td>Global Institute of Teacher Education, Cape Pennisula University, South Africa</td></tr>
              <tr><td>Dr. Adegboye Olaoluwa</td><td>Consulting Editor</td><td>Prairie A&M University, Texas, USA</td></tr>
              <tr><td>Dr. O.O. Olakotan</td><td>Editoral Assistant</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Prof. M.O. Olowe</td><td>Editoral Member</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Dr. A. Olatilu</td><td>Editoral Member</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Mr Pius Ogunjobi</td><td>Editoral Member</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>
              <tr><td>Mrs Orisamika Bukola</td><td>Editoral Member</td><td>Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria</td></tr>

            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="section-title">Publication Process</h2>
          <ol style={{ paddingLeft: '1.5rem' }}>
            {reviewProcess.map((r) => (
              <li key={r.step} style={{ marginBottom: '0.5rem' }}>
                <strong>{r.title}.</strong> {r.desc}
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h2 className="section-title">Article Processing Charges</h2>
          <p>
            This journal operates under an <strong>open-access model</strong>. A publication fee of{' '}
            <strong>${journalInfo.publicationFee} {journalInfo.currency}</strong> is levied upon
            acceptance to cover production, DOI registration, and online hosting. No fees are
            charged for submission or peer review.
          </p>
          <p>Waivers are available for authors from low-income countries.</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Ready to Publish?</h2>
          <p className="muted">Join hundreds of researchers who have published with JVITE.</p>
          <Link href="/submit" className="btn btn-primary">Start Your Submission</Link>
        </div>
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Quick Facts</h3>
          <ul>
            <li><span>E-ISSN:</span><strong>{journalInfo.e_issn}</strong></li>
            <li><span>Founded:</span><strong>{journalInfo.founded}</strong></li>
            <li><span>Frequency:</span><strong>{journalInfo.frequency}</strong></li>
            <li><span>Publisher:</span><strong>{journalInfo.publisher}</strong></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

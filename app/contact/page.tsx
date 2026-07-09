'use client';

export default function ContactPage() {
  return (
    <div className="page">
      <div className="main-col">
        <div className="card">
          <h1 className="section-title">Contact Us</h1>
          <p>
            For inquiries about submissions, peer review, indexing, or general questions,
            please use the contact details below.
          </p>
        </div>

        <div className="card">
          <h2 className="section-title">Editorial Office</h2>
          <div className="kv">
            <div className="k">Address</div><div>Department of Vocational &amp; Industrial Technology Education<br/>College of Technology<br/>BOUESTI University Campus, Building E, Room 304</div>
            <div className="k">Email</div><div>editor@jvite.bouesti.edu</div>
            <div className="k">Submissions</div><div>submissions@jvite.bouesti.edu</div>
            <div className="k">Phone</div><div>+1 (555) 234-5678</div>
            <div className="k">Office Hours</div><div>Mon–Fri, 9:00 – 17:00 (UTC+1)</div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Send a Message</h2>
          <form onSubmit={(e) => { e.preventDefault(); alert('Message sent (demo)'); }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input type="email" required />
              </div>
              <div className="form-group full">
                <label>Subject</label>
                <input type="text" />
              </div>
              <div className="form-group full">
                <label>Message <span className="required">*</span></label>
                <textarea required rows={6}></textarea>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Send Message</button>
          </form>
        </div>
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Quick Contact</h3>
          <ul>
            <li><span>Editor: </span><strong>editor@jvite.bouesti.edu</strong></li>
            <li><span>Submissions: </span><strong>submissions@jvite.bouesti.edu</strong></li>
            <li><span>Reviewers: </span><strong>review@jvite.bouesti.edu</strong></li>
            <li><span>Indexing: </span><strong>indexing@jvite.bouesti.edu</strong></li>
          </ul>
        </div>
        <div className="widget">
          <h3>Follow Us</h3>
          <ul>
            <li><a href="#">Twitter / X</a></li>
            <li><a href="#">LinkedIn</a></li>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">YouTube</a></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { categories, journalInfo, type Submission } from '@/lib/data';
import { useSubmissions } from '@/lib/useSubmissions';
import { API_URL } from '@/lib/config';

type Step = 1 | 2 | 3 | 4;

interface FormState {
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  authorName: string;
  authorEmail: string;
  authorAffiliation: string;
  authorCountry: string;
  authorOrcid: string;
  coAuthorNames: string;
  agreeEthics: boolean;
  agreeCopyright: boolean;
  manuscriptName: string;
  manuscriptSize: number;
}

const initial: FormState = {
  title: '',
  abstract: '',
  keywords: '',
  category: '',
  authorName: '',
  authorEmail: '',
  authorAffiliation: '',
  authorCountry: '',
  authorOrcid: '',
  coAuthorNames: '',
  agreeEthics: false,
  agreeCopyright: false,
  manuscriptName: '',
  manuscriptSize: 0,
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ACCEPTED = '.pdf,.doc,.docx';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SubmitPage() {
  const router = useRouter();
  const { add } = useSubmissions();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authorLoading, setAuthorLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('author_token');
    if (!token) {
      router.push('/login?callbackUrl=/submit');
      return;
    }
    
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setForm(f => ({
          ...f,
          authorName: data.name,
          authorEmail: data.email,
          authorAffiliation: data.affiliation,
          authorCountry: data.country,
          authorOrcid: data.orcid || ''
        }));
        setAuthorLoading(false);
      })
      .catch(() => {
        sessionStorage.removeItem('author_token');
        router.push('/login?callbackUrl=/submit');
      });
  }, [router]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[k as string];
        return next;
      });
    }
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 10) e.title = 'Title must be at least 10 characters.';
    if (form.title.length > 200) e.title = 'Title must be 200 characters or fewer.';
    if (form.abstract.trim().length < 150) e.abstract = 'Abstract must be at least 150 characters.';
    if (form.abstract.length > 2500) e.abstract = 'Abstract must be 2500 characters or fewer.';
    if (!form.category) e.category = 'Please choose a category.';
    const kws = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (kws.length < 4) e.keywords = 'Please provide at least 4 keywords.';
    if (kws.length > 8) e.keywords = 'Please limit to 8 keywords.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (form.authorName.trim().length < 3) e.authorName = 'Author name is required.';
    if (!validateEmail(form.authorEmail)) e.authorEmail = 'A valid email is required.';
    if (form.authorAffiliation.trim().length < 3) e.authorAffiliation = 'Affiliation is required.';
    if (form.authorOrcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(form.authorOrcid)) {
      e.authorOrcid = 'ORCID must be in the format 0000-0000-0000-0000.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.manuscriptName) e.manuscript = 'Please upload your manuscript.';
    else if (form.manuscriptSize > MAX_FILE_SIZE) e.manuscript = 'File must be 25 MB or smaller.';
    if (!form.agreeEthics) e.agreeEthics = 'You must confirm the ethics statement.';
    if (!form.agreeCopyright) e.agreeCopyright = 'You must accept the copyright terms.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onFileSelected = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setErrors((e) => ({ ...e, manuscript: 'File must be 25 MB or smaller.' }));
      return;
    }
    setManuscriptFile(file);
    setForm((f) => ({ ...f, manuscriptName: file.name, manuscriptSize: file.size }));
    setErrors((e) => {
      const next = { ...e };
      delete next.manuscript;
      return next;
    });
  };

  const next = () => {
    let ok = false;
    if (step === 1) ok = validateStep1();
    else if (step === 2) ok = validateStep2();
    else if (step === 3) ok = validateStep3();
    if (ok) setStep(((step + 1) as Step));
  };

  const back = () => setStep(((step - 1) as Step));

  const createSubmission = async () => {
    try {
      setSubmitting(true);
      let finalManuscriptName = form.manuscriptName;
      if (manuscriptFile) {
        const formData = new FormData();
        formData.append('file', manuscriptFile);
        const uploadRes = await fetch(`${API_URL}/api/uploads`, {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('File upload failed');
        try {
          const uploadData = await uploadRes.json();
          if (uploadData && uploadData.filename) {
            finalManuscriptName = uploadData.filename;
          }
        } catch (err) {
          console.warn('Could not parse upload json response, using form filename');
        }
      }

      const submissionData = {
        title: form.title.trim(),
        abstract: form.abstract.trim(),
        keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        category: form.category,
        author: {
          name: form.authorName.trim(),
          email: form.authorEmail.trim(),
          affiliation: form.authorAffiliation.trim(),
          orcid: form.authorOrcid.trim() || undefined,
        },
        coAuthors: form.coAuthorNames
          ? form.coAuthorNames.split(',').map((n) => ({ name: n.trim(), email: '', affiliation: '' }))
              .filter((c) => c.name)
          : undefined,
        manuscriptName: finalManuscriptName,
        manuscriptSize: form.manuscriptSize,
        submittedAt: new Date().toISOString(),
        status: 'submitted' as const,
      };
      
      const created = await add(submissionData);
      setSubmissionId(created.id);
      
      setStep(4);
    } catch (e) {
      console.error(e);
      setErrors({ agreeCopyright: 'An error occurred during submission. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getFeeString = () => {
    return form.authorCountry === 'Nigeria' ? '₦45,000 NGN' : '$150 USD';
  };

  if (authorLoading) {
    return <div className="page" style={{ justifyContent: 'center', minHeight: '50vh' }}>Loading...</div>;
  }

  return (
    <div className="page">
      <div className="main-col">
        <div className="card">
          <h1 className="section-title">Submit Your Manuscript</h1>
          <p>
            Complete the three steps below to submit your manuscript to {journalInfo.shortName}.
            You'll have the opportunity to pay the article processing charge after peer-review acceptance.
          </p>

          <div className="steps" style={{ marginTop: '1.5rem' }}>
            <div className={`step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
              <div className="dot">1</div><div className="label">Manuscript</div>
            </div>
            <div className={`step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
              <div className="dot">2</div><div className="label">Authors</div>
            </div>
            <div className={`step ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>
              <div className="dot">3</div><div className="label">Files &amp; Policies</div>
            </div>
            <div className={`step ${step === 4 ? 'active' : ''}`}>
              <div className="dot">4</div><div className="label">Done</div>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h2>Step 1 · Manuscript Details</h2>
              <div className="form-group">
                <label>Manuscript Title <span className="required">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. AI-Driven Adaptive Learning in Welding Workshops"
                  className={errors.title ? 'invalid' : ''}
                  maxLength={200}
                />
                <div className="help">{form.title.length} / 200 characters</div>
                {errors.title && <div className="error">{errors.title}</div>}
              </div>
              <div className="form-group">
                <label>Abstract <span className="required">*</span></label>
                <textarea
                  value={form.abstract}
                  onChange={(e) => set('abstract', e.target.value)}
                  placeholder="A structured abstract of 150–250 words covering background, methods, results, and conclusions."
                  rows={8}
                  className={errors.abstract ? 'invalid' : ''}
                  maxLength={2500}
                />
                <div className="help">
                  {form.abstract.length} / 2500 characters ·{' '}
                  {form.abstract.split(/\s+/).filter(Boolean).length} words
                </div>
                {errors.abstract && <div className="error">{errors.abstract}</div>}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className={errors.category ? 'invalid' : ''}
                  >
                    <option value="">— Select category —</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {errors.category && <div className="error">{errors.category}</div>}
                </div>
                <div className="form-group">
                  <label>Keywords <span className="required">*</span></label>
                  <input
                    type="text"
                    value={form.keywords}
                    onChange={(e) => set('keywords', e.target.value)}
                    placeholder="e.g. AI, welding, vocational training"
                    className={errors.keywords ? 'invalid' : ''}
                  />
                  <div className="help">Comma-separated, 4–8 keywords</div>
                  {errors.keywords && <div className="error">{errors.keywords}</div>}
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={next}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>Step 2 · Author Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Corresponding Author Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={form.authorName}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-hover)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    value={form.authorEmail}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-hover)' }}
                  />
                </div>
                <div className="form-group full">
                  <label>Affiliation <span className="required">*</span></label>
                  <input
                    type="text"
                    value={form.authorAffiliation}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-hover)' }}
                  />
                </div>
                <div className="form-group">
                  <label>ORCID (optional)</label>
                  <input
                    type="text"
                    value={form.authorOrcid}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-hover)' }}
                  />
                </div>
                <div className="form-group">
                  <label>Co-Authors (optional)</label>
                  <input
                    type="text"
                    value={form.coAuthorNames}
                    onChange={(e) => set('coAuthorNames', e.target.value)}
                    placeholder="Names separated by commas"
                  />
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={back}
                  style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
                  Back
                </button>
                <button type="button" className="btn btn-primary" onClick={next}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>Step 3 · Manuscript File &amp; Policies</h2>
              <div className="form-group">
                <label>Manuscript File <span className="required">*</span></label>
                <div
                  className="file-drop"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragging'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('dragging')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragging');
                    onFileSelected(e.dataTransfer.files?.[0] || null);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED}
                    onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
                  />
                  <p>Click to upload or drag and drop</p>
                  <p className="muted">PDF, DOC, or DOCX · Max 25 MB</p>
                </div>
                {form.manuscriptName && (
                  <div className="file-info">
                    <span style={{ flex: 1 }}>{form.manuscriptName}</span>
                    <span className="muted">{(form.manuscriptSize / 1024 / 1024).toFixed(2)} MB</span>
                    <button
                      type="button"
                      onClick={() => {
                        setManuscriptFile(null);
                        setForm((f) => ({ ...f, manuscriptName: '', manuscriptSize: 0 }));
                      }}
                      className="btn btn-danger"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {errors.manuscript && <div className="error">{errors.manuscript}</div>}
              </div>

              <div className="alert alert-info">
                <strong>Review your manuscript for double-blind review:</strong> Remove all author
                identifiers, affiliations, and acknowledgements from the main document. These should
                be included in a separate title page.
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={form.agreeEthics}
                    onChange={(e) => set('agreeEthics', e.target.checked)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <span>
                    <strong>Ethics Statement:</strong> I confirm this manuscript is original,
                    unpublished, and not under consideration elsewhere. All authors have approved
                    the submission and any research involving human subjects has appropriate
                    ethical approval.
                  </span>
                </label>
                {errors.agreeEthics && <div className="error">{errors.agreeEthics}</div>}
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={form.agreeCopyright}
                    onChange={(e) => set('agreeCopyright', e.target.checked)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <span>
                    <strong>Copyright Agreement:</strong> I accept that, if accepted, the article
                    will be published under a CC BY 4.0 license and the publication fee of
                    {' '}{getFeeString()} will be invoiced.
                  </span>
                </label>
                {errors.agreeCopyright && <div className="error">{errors.agreeCopyright}</div>}
              </div>

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={back}
                  style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
                  Back
                </button>
                <button type="button" className="btn btn-primary" onClick={createSubmission} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Manuscript'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="alert alert-success">
                <strong>Manuscript submitted successfully!</strong>
                <p style={{ marginTop: '0.4rem', marginBottom: '1rem' }}>
                  Your submission ID is <code>{submissionId}</code>. We have sent a confirmation
                  to your email.
                </p>
                <p>
                  Your manuscript is now in the <strong>Under Editorial Review</strong> queue. You will be 
                  notified via email once peer review is complete. If accepted, you will be prompted to 
                  pay the publication fee via your dashboard before final publication.
                </p>
              </div>

              <div className="row" style={{ marginTop: '2rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Author Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="side-col">
        <div className="widget">
          <h3>Fee Information</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            A publication fee of <strong>{getFeeString()}</strong>{' '}
            is charged upon acceptance. Waivers are available for low-income countries.
          </p>
        </div>
        <div className="widget">
          <h3>Need Help?</h3>
          <ul>
            <li><Link href="/guidelines">Author Guidelines</Link></li>
            <li><Link href="#">Submission FAQ</Link></li>
            <li><Link href="/contact">Contact Editor</Link></li>
          </ul>
        </div>
        <div className="widget">
          <h3>Secure Payment</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Payments are processed by <strong>Stripe</strong> using industry-standard encryption.
            We never see or store your card details.
          </p>
        </div>
      </aside>
    </div>
  );
}

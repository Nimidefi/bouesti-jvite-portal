export interface Author {
  name: string;
  email: string;
  affiliation: string;
  orcid?: string;
}

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author: Author;
  coAuthors?: Author[];
  manuscriptName: string;
  manuscriptSize: number;
  category: string;
  submittedAt: string;
  status: 'submitted' | 'under-review' | 'accepted' | 'published' | 'rejected';
  doi?: string;
  version?: number;
}

export interface Issue {
  volume: number;
  number: number;
  year: number;
  title: string;
  publishedAt: string;
  articleCount: number;
  articles: ArticlePreview[];
}

export interface ArticlePreview {
  id: string;
  title: string;
  authors: string;
  pages: string;
  doi: string;
}

export const journalInfo = {
  title: 'Journal of Research in Vocational & Industrial Technology Education',
  shortName: 'JVITE',
  publisher: 'The Department of Vocational and Industrial Technology Education at BOUESTI (Bamidele Olumilua University of Education, Science and Technology, Ikere-Ekiti, Nigeria)',
  issn: '0704-5280',
  frequency: 'Bi-annual (June & December)',
  founded: 2020,
  description:
    'Journal of Research in Vocational & Industrial Technology Education is a peer-reviewed, open-access academic journal publishing high-quality research in vocational education, industrial technology, technical teacher training, and workforce development.',
  scope: [
    'Vocational & Technical Education',
    'Applied Science and Technology',
    'Entrepreneurship in BVTE',
    'Current issues in Education and Technology',
  ],
  indexing: ['Google Scholar', 'CrossRef', 'DOAJ', 'EBSCO', 'MyCite'],
  publicationFee: 150, // USD
  currency: 'USD',
};

export const categories = [
  'Vocational Education',
  'Industrial Technology',
  'Curriculum Development',
  'Technical Teacher Training',
  'Workforce Development',
  'Educational Technology',
  'Engineering Education',
  'Other',
];

export const issues: Issue[] = [
  {
    volume: 7,
    number: 2,
    year: 2025,
    title: 'Emerging Technologies in Skills Training',
    publishedAt: '2025-12-15',
    articleCount: 8,
    articles: [
      { id: 'a1', title: 'AI-Driven Adaptive Learning in Welding Workshops', authors: 'Adebayo, O.; Lim, S.; Patel, R.', pages: '1-18', doi: '10.1234/jvite.2025.7.2.01' },
      { id: 'a2', title: 'Industry 4.0 Competencies for Technical Teachers: A Framework', authors: 'Mwangi, J.; Tan, K.', pages: '19-34', doi: '10.1234/jvite.2025.7.2.02' },
      { id: 'a3', title: 'Virtual Reality Simulations in Automotive Technology Education', authors: 'Chukwu, E.; Andersen, P.', pages: '35-52', doi: '10.1234/jvite.2025.7.2.03' },
    ],
  },
  {
    volume: 7,
    number: 1,
    year: 2025,
    title: 'Pedagogical Innovations in TVET',
    publishedAt: '2025-06-15',
    articleCount: 7,
    articles: [
      { id: 'b1', title: 'Project-Based Learning in Mechatronics Programs', authors: 'Okafor, M.; Yusof, A.', pages: '1-22', doi: '10.1234/jvite.2025.7.1.01' },
      { id: 'b2', title: 'Competency-Based Assessment in Industrial Workshops', authors: 'Hassan, F.; Reyes, C.', pages: '23-40', doi: '10.1234/jvite.2025.7.1.02' },
    ],
  },
  {
    volume: 6,
    number: 2,
    year: 2024,
    title: 'Workforce Development & Industry Partnerships',
    publishedAt: '2024-12-15',
    articleCount: 9,
    articles: [
      { id: 'c1', title: 'Apprenticeship Models in Sub-Saharan Africa', authors: 'Okeke, N.; Müller, H.', pages: '1-26', doi: '10.1234/jvite.2024.6.2.01' },
      { id: 'c2', title: 'Public-Private Partnerships in Skills Training', authors: 'Rahman, S.; Tan, K.', pages: '27-44', doi: '10.1234/jvite.2024.6.2.02' },
    ],
  },
  {
    volume: 6,
    number: 1,
    year: 2024,
    title: 'Curriculum Design for the Green Economy',
    publishedAt: '2024-06-15',
    articleCount: 6,
    articles: [
      { id: 'd1', title: 'Sustainability Competencies in Vocational Curricula', authors: 'Andersen, P.; Yusuf, A.', pages: '1-20', doi: '10.1234/jvite.2024.6.1.01' },
    ],
  },
];

export const guidelines = [
  'Manuscripts must be original and not under consideration elsewhere.',
  'Submissions should be 4,000–8,000 words including references.',
  'Use APA 7th edition referencing style throughout.',
  'Include a structured abstract of 150–250 words.',
  'Provide 4–6 keywords for indexing.',
  'All authors must be listed with affiliations and ORCIDs where available.',
  'Manuscripts must be anonymized for double-blind peer review.',
  'Acceptance is subject to peer review and editorial decision.',
];

export const reviewProcess = [
  { step: 1, title: 'Editorial Screening', desc: 'Initial review for scope, format, and plagiarism (3–5 days).' },
  { step: 2, title: 'Double-Blind Peer Review', desc: 'Two or more expert reviewers evaluate the manuscript (4–6 weeks).' },
  { step: 3, title: 'Revisions', desc: 'Authors receive feedback and revise within 2–4 weeks.' },
  { step: 4, title: 'Editorial Decision', desc: 'Accept, minor revision, major revision, or reject.' },
  { step: 5, title: 'Production & Publication', desc: 'Copy-editing, typesetting, DOI assignment, and online publication.' },
];

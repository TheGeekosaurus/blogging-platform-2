/**
 * Copy for the /home-v2 design.
 *
 * Every string is the Figma template's PLACEHOLDER copy, transcribed verbatim —
 * it is about a fictional AI-news publication, not about Nanotom Capital, and is
 * here so the layout can be judged at its real text lengths before the real
 * words exist. Nothing outside this file needs editing to swap it: the layout in
 * `home-v2.tsx` reads every label, heading and body string from here.
 *
 * When you replace a string, keep roughly the same length. The design leans on
 * two- and three-line headings and on the four feature cards being of a similar
 * size; copy that is much shorter leaves cells looking empty, and much longer
 * pushes the two-column blocks out of alignment.
 */

/*
 * The hero is REAL COPY, not placeholder — the first section retrofitted to the
 * business. Every string below is the live homepage's, verbatim: the eyebrow,
 * headline and paragraph from its <Hero>, and the three figures from its
 * <TrackRecord>. Both live in components/marketing/nntm/homepage.tsx. If a
 * number changes there, change it here too; there is deliberately no shared
 * constant, because the two pages are a live one and a draft of its
 * replacement, and coupling them would mean editing the live homepage to
 * iterate on this one.
 *
 * `unit` is split from `value` because the design puts the accent colour on the
 * trailing symbol alone — "2,300" in white, the "+" in gold.
 */
export const HERO = {
  eyebrow: 'Entrepreneurs & Business Owners',
  heading: 'Get The Capital Your Business Needs To Grow',
  body:
    "Whether you're a startup, established business, or real estate investor, access " +
    'flexible financing solutions to fuel your next big move.',
  stats: [
    { value: '2,300', unit: '+', label: 'businesses funded since 2012' },
    // The live homepage writes this '$36+ M'. Same figure, conventional order.
    { value: '$36M', unit: '+', label: 'provided in financing' },
    { value: '4.7', unit: ' Stars', label: 'from happy customers' },
  ],
  card: {
    title: 'Explore 1000+ resources',
    body: 'Over 1,000 articles on emerging tech trends and breakthroughs.',
    cta: 'Get Funded',
  },
  /** `icon` keys map to the brand icons in ./icons. */
  tiles: [
    {
      icon: 'spark',
      title: 'Latest News Updates',
      subtitle: 'Stay Current',
      note: 'Over 1,000 articles published monthly',
    },
    {
      icon: 'clover',
      title: 'Expert Contributors',
      subtitle: 'Trusted Insights',
      note: '50+ renowned AI experts on our team',
    },
    {
      icon: 'leaf',
      title: 'Global Readership',
      subtitle: 'Worldwide Impact',
      note: '2 million monthly readers',
    },
  ],
} as const;

export const FEATURES = {
  label: 'Unlock the Power of',
  heading: 'FutureTech Features',
  blocks: [
    {
      icon: 'orbit',
      title: 'Future Technology Blog',
      body: 'Stay informed with our blog section dedicated to future technology.',
      cards: [
        { title: 'Quantity', body: 'Over 1,000 articles on emerging tech trends and breakthroughs.' },
        { title: 'Variety', body: 'Articles cover fields like AI, robotics, biotechnology, and more.' },
        { title: 'Frequency', body: 'Fresh content added daily to keep you up to date.' },
        { title: 'Authoritative', body: 'Written by our team of tech experts and industry professionals.' },
      ],
    },
    {
      icon: 'prism',
      title: 'Research Insights Blogs',
      body: 'Dive deep into future technology concepts with our research section.',
      cards: [
        { title: 'Depth', body: '500+ research articles for in-depth understanding.' },
        { title: 'Graphics', body: 'Visual aids and infographics to enhance comprehension.' },
        { title: 'Trends', body: 'Explore emerging trends in future technology research.' },
        { title: 'Contributors', body: 'Contributions from tech researchers and academics.' },
      ],
    },
  ],
} as const;

export const BLOG_SECTION = {
  label: 'A Knowledge Treasure Trove',
  heading: "Explore FutureTech's In-Depth Blog Posts",
  cta: 'View All Blogs',
} as const;

export const RESOURCES = {
  label: 'Your Gateway to In-Depth Information',
  heading: "Unlock Valuable Knowledge with FutureTech's Resources",
  cta: 'View All Resources',
  blocks: [
    {
      icon: 'crescent',
      title: 'Ebooks',
      body: 'Explore our collection of ebooks covering a wide spectrum of future technology topics.',
      cta: 'Download Ebooks Now',
      downloadedBy: '10k + Users',
      topicsTitle: 'Variety of Topics',
      topicsBody:
        'Topics include AI in education (25%), renewable energy (20%), healthcare (15%), ' +
        'space exploration (25%), and biotechnology (15%).',
      totalLabel: 'Total Ebooks',
      totalValue: 'Over 100 ebooks',
      expertise: 'Ebooks are authored by renowned experts with an average of 15 years of experience',
    },
    {
      icon: 'facet',
      title: 'Whitepapers',
      body: 'Dive into comprehensive reports and analyses with our collection of whitepapers.',
      cta: 'Download Whitepapers Now',
      downloadedBy: '10k + Users',
      topicsTitle: 'Topics Coverage',
      topicsBody:
        'Whitepapers cover quantum computing (20%), AI ethics (15%), space mining prospects ' +
        '(20%), AI in healthcare (15%), and renewable energy strategies (30%).',
      totalLabel: 'Total Whitepapers',
      totalValue: 'Over 50 whitepapers',
      expertise:
        'Whitepapers are authored by subject matter experts with an average of 20 years of ' +
        'experience.',
    },
  ],
  /** Shared by both blocks — the labels do not vary in the design. */
  formatsLabel: 'Download Formats',
  formatsValue: 'PDF format for access.',
  previewLabel: 'Preview',
  downloadedByLabel: 'Downloaded By',
  expertiseLabel: 'Average Author Expertise',
} as const;

/*
 * No `items` here any more. The section renders the real SocialJuice wall, so
 * the template's six invented reviews from a fictional company are gone rather
 * than sitting unused next to genuine ones. The heading survives because it
 * happens to describe real reviews just as well as invented ones.
 */
export const TESTIMONIALS = {
  label: 'What Our Readers Say',
  heading: 'Real Words from Real Readers',
  cta: 'View All Testimonials',
} as const;

export const CLOSING = {
  label: 'Learn, Connect, and Innovate',
  heading: 'Be Part of the Future Tech Revolution',
  body:
    'Immerse yourself in the world of future technology. Explore our comprehensive resources, ' +
    'connect with fellow tech enthusiasts, and drive innovation in the industry. Join a ' +
    'dynamic community of forward-thinkers.',
  cards: [
    {
      title: 'Resource Access',
      body: 'Visitors can access a wide range of resources, including ebooks, whitepapers, reports.',
    },
    {
      title: 'Community Forum',
      body:
        'Join our active community forum to discuss industry trends, share insights, and ' +
        'collaborate with peers.',
    },
    {
      title: 'Tech Events',
      body:
        'Stay updated on upcoming tech events, webinars, and conferences to enhance your ' +
        'knowledge.',
    },
  ],
} as const;

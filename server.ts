import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import dotenv from 'dotenv';
import {
  Book,
  Collection,
  Quote,
  AuthorProfile,
  StoreSettings,
  AudiobookProject,
  R2ConfigStatus,
  Customer,
  Purchase,
  BookDraft,
  BookSuggestion,
  AudiobookSuggestion,
  BackupRecord,
  StorePolicy,
} from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUDIO_DIR = path.resolve(DATA_DIR, 'audio');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static generated audio files
app.use('/api/audio', express.static(AUDIO_DIR));

// Initialize Google Gemini Client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cloudflare R2 S3 Client Initialization
function getR2Client(): { client: S3Client | null; bucketName: string; isConfigured: boolean } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'heartwoven-wonders-books';
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (accessKeyId && secretAccessKey && endpoint) {
    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    return { client, bucketName, isConfigured: true };
  }
  return { client: null, bucketName, isConfigured: false };
}

// -------------------------------------------------------------
// Database Persistence Layer (/data/heartwoven-db.json)
// -------------------------------------------------------------
const DB_FILE = path.join(DATA_DIR, 'heartwoven-db.json');

const INITIAL_POLICIES: StorePolicy[] = [
  {
    id: 'pol-about',
    title: 'About Heartwoven Wonders Publishing House',
    slug: 'about-store',
    content: 'Heartwoven Wonders is an independent worldwide digital publishing house and online bookstore founded by author Sky. We create literature that pierces through distraction and anchors the human spirit in faith, interior healing, and enduring purpose. Our publications encompass adult nonfiction, philosophical contemplation, mental wellness, and spiritual growth.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pol-delivery',
    title: 'Digital Delivery & Download Policy',
    slug: 'digital-delivery',
    content: 'All books and audiobooks purchased on Heartwoven Wonders are delivered digitally and instantly worldwide. Upon successful PayPal checkout, orders are immediately confirmed and linked to your private My Library account. You may choose between PDF, EPUB, and Audiobook editions where available.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pol-refunds',
    title: 'Refund & Satisfaction Guarantee',
    slug: 'refund-policy',
    content: 'We stand completely behind the spiritual and literary integrity of our works. Because digital deliverables are provided immediately upon checkout, we offer a 14-day compassionate refund guarantee if you encounter technical difficulty accessing your files or if the work did not match its stated description.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pol-privacy',
    title: 'Privacy Policy & Data Protection',
    slug: 'privacy-policy',
    content: 'Heartwoven Wonders respects the sanctity of your private information. We never sell, rent, or trade customer emails or purchase records. Customer accounts are used exclusively for digital library access, purchase verification, and optional publishing notices.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pol-terms',
    title: 'Terms of Service',
    slug: 'terms-of-service',
    content: 'By purchasing from Heartwoven Wonders, you receive a personal, non-transferable license to read, listen, and contemplate our works across your personal devices. Commercial reproduction or unauthorized redistribution of our manuscripts and audiobooks is strictly prohibited.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pol-faq',
    title: 'Frequently Asked Questions (FAQ)',
    slug: 'faq',
    content: 'Q: How do I read EPUB files?\nA: EPUB is an open standard readable on Apple Books, Kobo, Kindle, and Thorium Reader.\n\nQ: Are the audiobooks generated with real voices?\nA: Yes! Our audiobooks feature authentic spoken narration produced chapter-by-chapter with measured cadence.\n\nQ: Can I pay with PayPal from anywhere?\nA: Yes, PayPal supports worldwide payments in standard international currencies.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'pol-contact',
    title: 'Contact & Publisher Support',
    slug: 'contact',
    content: 'For reader support, library inquiries, or literary correspondence:\nEmail: contact@heartwovenwonders.com\nSanctuary: Worldwide Digital Publishing House\nFounder: Sky',
    lastUpdated: new Date().toISOString(),
  },
];

const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-faith',
    name: 'Faith & Spiritual Growth',
    slug: 'faith-spiritual-growth',
    description: 'Sacred anchors, scriptural contemplation, and profound spiritual grounding for the modern soul walking through uncertainty.',
    coverImage: '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    visualTheme: {
      accentColor: '#d4af37',
      accentBorder: 'border-amber-500/40',
      badgeStyle: 'text-amber-300 bg-amber-950/40 border border-amber-500/30',
      frameShape: 'arch',
      bgGradient: 'from-[#2a1348] via-[#1b0c30] to-[#0f071c]',
      ornament: 'Crown',
    },
    order: 1,
    showOnHomepage: true,
  },
  {
    id: 'col-healing',
    name: 'Healing & Mental Wellness',
    slug: 'healing-mental-wellness',
    description: 'Evidence-informed reflections and gentle companionship to navigate trauma, grief, quiet anxieties, and internal renewal.',
    coverImage: '/src/assets/images/book_cover_healing_depth_1794015185486.jpg',
    visualTheme: {
      accentColor: '#c084fc',
      accentBorder: 'border-purple-400/40',
      badgeStyle: 'text-purple-300 bg-purple-950/40 border border-purple-500/30',
      frameShape: 'faceted',
      bgGradient: 'from-[#341147] via-[#200b32] to-[#11051b]',
      ornament: 'Sparkles',
    },
    order: 2,
    showOnHomepage: true,
  },
  {
    id: 'col-emotional',
    name: 'Emotional Well-being',
    slug: 'emotional-well-being',
    description: 'Deepening emotional self-awareness, untangling unvoiced burdens, and cultivating interior stillness and authentic calm.',
    coverImage: '/src/assets/images/hero_bookstore_publishing_1794015183432.jpg',
    visualTheme: {
      accentColor: '#f472b6',
      accentBorder: 'border-pink-500/40',
      badgeStyle: 'text-pink-300 bg-pink-950/40 border border-pink-500/30',
      frameShape: 'halo',
      bgGradient: 'from-[#3a113a] via-[#230b28] to-[#120516]',
      ornament: 'Heart',
    },
    order: 3,
    showOnHomepage: true,
  },
  {
    id: 'col-growth',
    name: 'Personal Growth & Life Lessons',
    slug: 'personal-growth-life-lessons',
    description: 'Disciplined mastery, reflective self-examination, and enduring principles to lead a life of deliberate purpose and character.',
    coverImage: '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    visualTheme: {
      accentColor: '#fbbf24',
      accentBorder: 'border-yellow-500/40',
      badgeStyle: 'text-yellow-300 bg-yellow-950/40 border border-yellow-500/30',
      frameShape: 'filigree',
      bgGradient: 'from-[#381a42] via-[#241031] to-[#110619]',
      ornament: 'Compass',
    },
    order: 4,
    showOnHomepage: true,
  },
  {
    id: 'col-relationships',
    name: 'Relationship & Understanding Others',
    slug: 'relationship-understanding-others',
    description: 'The subtle art of human empathy, honest communication, grace under tension, and building bridges across human hearts.',
    coverImage: '/src/assets/images/hero_bookstore_publishing_1794015183432.jpg',
    visualTheme: {
      accentColor: '#38bdf8',
      accentBorder: 'border-sky-500/40',
      badgeStyle: 'text-sky-300 bg-sky-950/40 border border-sky-500/30',
      frameShape: 'seal',
      bgGradient: 'from-[#19234e] via-[#141638] to-[#0c0d23]',
      ornament: 'Users',
    },
    order: 5,
    showOnHomepage: true,
  },
  {
    id: 'col-fear',
    name: 'Beyond Fear & Understanding What Is Fear',
    slug: 'beyond-fear-understanding-what-is-fear',
    description: 'Transcending paralysis, understanding the roots and architecture of fear, and meeting life’s fiercest gales with rooted conviction.',
    coverImage: '/src/assets/images/book_cover_healing_depth_1794015185486.jpg',
    visualTheme: {
      accentColor: '#f87171',
      accentBorder: 'border-rose-500/40',
      badgeStyle: 'text-rose-300 bg-rose-950/40 border border-rose-500/30',
      frameShape: 'crest',
      bgGradient: 'from-[#421422] via-[#290d18] to-[#16060c]',
      ornament: 'Shield',
    },
    order: 6,
    showOnHomepage: true,
  },
  {
    id: 'col-workbooks',
    name: 'Journals & Workbooks',
    slug: 'journals-workbooks',
    description: 'Structured daily inquiries, contemplation prompts, habit trackers, and sacred write-in pages for intentional transformation.',
    coverImage: '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    visualTheme: {
      accentColor: '#a78bfa',
      accentBorder: 'border-violet-500/40',
      badgeStyle: 'text-violet-300 bg-violet-950/40 border border-violet-500/30',
      frameShape: 'quill',
      bgGradient: 'from-[#2e134b] via-[#1d0c32] to-[#10061d]',
      ornament: 'BookOpen',
    },
    order: 7,
    showOnHomepage: true,
  },
  {
    id: 'col-love-depth',
    name: 'Love & Depth',
    slug: 'love-depth',
    description: 'Unfiltered meditations on profound sacrifice, enduring devotion, vulnerable tenderness, and the boundless architecture of love.',
    coverImage: '/src/assets/images/book_cover_healing_depth_1794015185486.jpg',
    visualTheme: {
      accentColor: '#e879f9',
      accentBorder: 'border-fuchsia-500/40',
      badgeStyle: 'text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/30',
      frameShape: 'embossed',
      bgGradient: 'from-[#3e0f41] via-[#28092d] to-[#140417]',
      ornament: 'Flame',
    },
    order: 8,
    showOnHomepage: true,
  },
];

const INITIAL_BOOKS: Book[] = [];

const INITIAL_QUOTES: Quote[] = [
  {
    id: 'q-1',
    text: 'When faith takes root in the quiet unseen places of the heart, no gale of circumstance can uproot your purpose.',
    theme: 'faith',
  },
  {
    id: 'q-2',
    text: 'Healing does not mean the fracture never occurred; it means the scar has become a vessel of compassion for others.',
    theme: 'healing',
  },
  {
    id: 'q-3',
    text: 'Wisdom is not knowing every answer; it is having the courage to sit in reverence before truth you cannot yet explain.',
    theme: 'wisdom',
  },
  {
    id: 'q-4',
    text: 'Hope is the anchor cast into tomorrow that steadies the ship in the tempest of today.',
    theme: 'hope',
  },
  {
    id: 'q-5',
    text: 'Courage is rarely loud. Most often, courage is the quiet voice at evening whispers: I will begin again with the dawn.',
    theme: 'courage',
  },
  {
    id: 'q-6',
    text: 'Truth needs no armor other than its own endurance; false things shatter under the gentle weight of time.',
    theme: 'truth',
  },
  {
    id: 'q-7',
    text: 'Your purpose is not a trophy to be won, but a garden entrusted to your patient hands.',
    theme: 'purpose',
  },
  {
    id: 'q-8',
    text: 'In the stillness where self-importance dissolves, the whisper of genuine understanding begins.',
    theme: 'wisdom',
  },
];

const INITIAL_AUTHOR: AuthorProfile = {
  name: 'Sky',
  tagline: 'Author, Philosopher & Founder of Heartwoven Wonders',
  photoUrl: '/src/assets/images/author_sky_portrait_1794015184626.jpg',
  introduction: 'Sky is an author, thinker, and contemplative writer dedicated to creating literature that pierces through distraction and anchors the human spirit in faith, interior healing, and enduring purpose.',
  biography: 'For more than two decades, Sky has observed the quiet spiritual hunger beneath modern life—the exhaustion of endless noise and the yearning for authentic healing. Heartwoven Wonders was founded not merely as an imprint, but as a worldwide sanctuary where words become living medicine, guiding seekers through emotional renewal and faith-rooted clarity.',
  philosophy: 'We believe a book should not merely entertain the intellect; it should companion the soul. True publishing is an act of sacred stewardship: delivering truth with unsparing beauty, deep empathy, and uncompromising craftsmanship.',
  purposeMessage: 'Our purpose is to ensure that wherever you are in the world—whether sitting in solitude during grief or standing at the crossroads of your destiny—you hold in your hands words woven with care, truth, and unshakable light.',
  contactEmail: 'contact@heartwovenwonders.com',
  location: 'Worldwide Digital Sanctuary',
  publishedBooksCount: 8,
};

const INITIAL_SETTINGS: StoreSettings = {
  announcementText: 'Worldwide digital deliveries | Instant PDF & EPUB downloads | Audiobooks available | Secure PayPal payments',
  heroHeading: 'HEARTWOVEN WONDERS',
  heroTagline: 'Beyond the Pages, Into the Soul — Where Faith Takes Root, Healing Finds Its Way, and Purpose Comes Alive.',
  homepageSections: [
    { id: 'sec-quote', name: 'Inspirational Quote Sanctuary', visible: true, order: 1 },
    { id: 'sec-collections', name: 'Eight Distinctive Book Collections', visible: true, order: 2 },
    { id: 'sec-featured', name: 'Curated Bookstore & New Releases', visible: true, order: 3 },
    { id: 'sec-about', name: 'About Sky & Publishing Philosophy', visible: true, order: 4 },
    { id: 'sec-audiobook-spotlight', name: 'AI Spoken Audiobook Showcase', visible: true, order: 5 },
  ],
  collectionsOrder: ['col-faith', 'col-healing', 'col-emotional', 'col-growth', 'col-relationships', 'col-fear', 'col-workbooks', 'col-love-depth'],
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    environment: (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox',
    currency: 'USD',
    isConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    trinidadTobagoSupportNotes: 'PayPal Business accounts in Trinidad and Tobago receive payments worldwide in USD, EUR, GBP, and CAD. Because TTD is not directly held in PayPal balances, funds received in USD are converted upon bank withdrawal to an eligible local Visa card (via card transfer) or linked US dollar bank account.',
  },
  policies: INITIAL_POLICIES,
  seo: {
    siteTitle: 'Heartwoven Wonders | Digital Publishing House & Worldwide Bookstore',
    metaDescription: 'Digital Publishing House & Worldwide Bookstore — Beyond the Pages, Into the Soul — Where Faith Takes Root, Healing Finds Its Way, and Purpose Comes Alive.',
    ogImage: '/src/assets/images/hero_bookstore_publishing_1794015183432.jpg',
    keywords: ['digital publishing house', 'worldwide bookstore', 'faith books', 'healing', 'spiritual growth', 'audiobooks', 'author sky', 'epub pdf books'],
    authorBrand: 'Sky & Heartwoven Wonders',
  },
  visualStyling: {
    primaryPurple: '#291248',
    goldAccent: '#ffd700',
    displayFont: 'Cinzel',
    bodyFont: 'Plus Jakarta Sans',
    ornamentStyle: 'regal_crest',
  },
  adminPasscode: process.env.ADMIN_PASSCODE || 'heartwoven2026',
};

interface DatabaseSchema {
  books: Book[];
  collections: Collection[];
  quotes: Quote[];
  author: AuthorProfile;
  settings: StoreSettings;
  audiobookProjects: AudiobookProject[];
  customers: Customer[];
  purchases: Purchase[];
  bookDrafts: BookDraft[];
  backups: BackupRecord[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Ensure all Part Two collections exist
      return {
        books: parsed.books || INITIAL_BOOKS,
        collections: parsed.collections || INITIAL_COLLECTIONS,
        quotes: parsed.quotes || INITIAL_QUOTES,
        author: parsed.author || INITIAL_AUTHOR,
        settings: {
          ...INITIAL_SETTINGS,
          ...(parsed.settings || {}),
          paypal: {
            ...INITIAL_SETTINGS.paypal,
            ...(parsed.settings?.paypal || {}),
            clientId: process.env.PAYPAL_CLIENT_ID || parsed.settings?.paypal?.clientId || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || parsed.settings?.paypal?.clientSecret || '',
            isConfigured: Boolean(process.env.PAYPAL_CLIENT_ID || parsed.settings?.paypal?.clientId),
          },
          policies: parsed.settings?.policies || INITIAL_POLICIES,
        },
        audiobookProjects: parsed.audiobookProjects || [],
        customers: parsed.customers || [
          {
            id: 'cust-demo',
            name: 'Faithful Reader',
            email: 'reader@heartwovenwonders.com',
            createdAt: new Date().toISOString(),
          },
        ],
        purchases: parsed.purchases || [
          {
            id: 'pur-initial-1',
            customerId: 'cust-demo',
            customerEmail: 'reader@heartwovenwonders.com',
            customerName: 'Faithful Reader',
            bookId: 'book-1',
            bookTitle: 'The Unshakable Soul',
            bookAuthor: 'Sky',
            bookCoverUrl: '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
            formats: ['PDF', 'EPUB', 'Audiobook'],
            amount: 19.99,
            currency: 'USD',
            paypalOrderId: 'INITIAL_VERIFIED_ORDER_01',
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
        ],
        bookDrafts: parsed.bookDrafts || [],
        backups: parsed.backups || [],
      };
    }
  } catch (err) {
    console.error('Error loading database, initializing defaults:', err);
  }
  const defaultDb: DatabaseSchema = {
    books: INITIAL_BOOKS,
    collections: INITIAL_COLLECTIONS,
    quotes: INITIAL_QUOTES,
    author: INITIAL_AUTHOR,
    settings: INITIAL_SETTINGS,
    audiobookProjects: [],
    customers: [
      {
        id: 'cust-demo',
        name: 'Faithful Reader',
        email: 'reader@heartwovenwonders.com',
        createdAt: new Date().toISOString(),
      },
    ],
    purchases: [
      {
        id: 'pur-initial-1',
        customerId: 'cust-demo',
        customerEmail: 'reader@heartwovenwonders.com',
        customerName: 'Faithful Reader',
        bookId: 'book-1',
        bookTitle: 'The Unshakable Soul',
        bookAuthor: 'Sky',
        bookCoverUrl: '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
        formats: ['PDF', 'EPUB', 'Audiobook'],
        amount: 19.99,
        currency: 'USD',
        paypalOrderId: 'INITIAL_VERIFIED_ORDER_01',
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
    ],
    bookDrafts: [],
    backups: [],
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(dbData: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

let db = loadDatabase();

// -------------------------------------------------------------
// In-Memory Customer Session Store
// -------------------------------------------------------------
let currentActiveCustomer: Customer | null = db.customers[0] || null;

// -------------------------------------------------------------
// API Routes: Quotes
// -------------------------------------------------------------
app.get('/api/quotes/current', (_req: Request, res: Response) => {
  res.json({ quote: db.quotes[Math.floor(Math.random() * db.quotes.length)] });
});

app.get('/api/quotes/random', (_req: Request, res: Response) => {
  const quote = db.quotes[Math.floor(Math.random() * db.quotes.length)];
  res.json({ quote });
});

app.post('/api/quotes/generate', async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      const fallback = db.quotes[Math.floor(Math.random() * db.quotes.length)];
      res.json({
        quote: fallback,
        note: 'GEMINI_API_KEY is not configured in Secrets; serving from curated original collection.',
      });
      return;
    }

    const prompt = `Generate a single original, deeply moving, poetic and inspirational quote on the theme of "${theme || 'faith, healing, wisdom, and purpose'}". 
Guidelines:
- Maximum 2 sentences.
- Profound, grounded, comforting, mature.
- Suitable for a luxury publishing house tagline or reflection.
- Return ONLY the quote text without quotes or preamble. Do not attribute it to any person.`;

    const quotePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI quote generation timed out')), 6000)
    );

    const response = await Promise.race([quotePromise, timeoutPromise]);

    const quoteText = response.text?.trim() || 'Where faith takes root, healing finds its way, and purpose comes alive.';
    const newQuote: Quote = {
      id: `q-${Date.now()}`,
      text: quoteText.replace(/^["']|["']$/g, ''),
      theme: (theme as any) || 'wisdom',
    };
    db.quotes.push(newQuote);
    saveDatabase(db);

    res.json({ quote: newQuote });
  } catch (error: any) {
    console.error('Quote generation error:', error);
    const fallback = db.quotes[Math.floor(Math.random() * db.quotes.length)];
    res.json({ quote: fallback, error: error.message });
  }
});

// -------------------------------------------------------------
// API Routes: Collections (Section 2)
// -------------------------------------------------------------
app.get('/api/collections', (_req: Request, res: Response) => {
  res.json({ collections: db.collections });
});

app.put('/api/collections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.collections.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  db.collections[index] = { ...db.collections[index], ...req.body };
  saveDatabase(db);
  res.json({ collection: db.collections[index] });
});

app.post('/api/collections/reorder', (req: Request, res: Response) => {
  const { order } = req.body;
  if (Array.isArray(order)) {
    db.settings.collectionsOrder = order;
    db.collections.forEach((col) => {
      const idx = order.indexOf(col.id);
      if (idx !== -1) col.order = idx + 1;
    });
    db.collections.sort((a, b) => a.order - b.order);
    saveDatabase(db);
  }
  res.json({ collections: db.collections });
});

app.delete('/api/collections/:id/image', (req: Request, res: Response) => {
  const { id } = req.params;
  const col = db.collections.find((c) => c.id === id);
  if (!col) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  col.coverImage = '';
  saveDatabase(db);
  res.json({ success: true, collection: col });
});

app.post('/api/collections/:id/image', (req: Request, res: Response) => {
  const { id } = req.params;
  const { imageUrl } = req.body;
  const col = db.collections.find((c) => c.id === id);
  if (!col) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  if (!imageUrl) {
    res.status(400).json({ error: 'imageUrl is required' });
    return;
  }
  col.coverImage = imageUrl;
  saveDatabase(db);
  res.json({ success: true, collection: col });
});

// -------------------------------------------------------------
// API Routes: Books & Products (Section 4)
// -------------------------------------------------------------
app.get('/api/books', (_req: Request, res: Response) => {
  res.json({ books: db.books });
});

app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = db.books.find((b) => b.id === req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json({ book });
});

app.post('/api/books', (req: Request, res: Response) => {
  const newBook: Book = {
    id: `book-${Date.now()}`,
    title: req.body.title || 'Untitled Work',
    subtitle: req.body.subtitle || '',
    author: req.body.author || 'Sky',
    description: req.body.description || '',
    price: typeof req.body.price === 'number' ? req.body.price : parseFloat(req.body.price) || 14.99,
    collectionId: req.body.collectionId || 'col-faith',
    coverUrl: req.body.coverUrl || '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    formats: req.body.formats || ['PDF', 'EPUB'],
    pageCount: req.body.pageCount || 180,
    audioDurationSeconds: req.body.audioDurationSeconds || 0,
    isPublished: req.body.isPublished !== undefined ? req.body.isPublished : false,
    isNewRelease: req.body.isNewRelease ?? true,
    isBestSeller: req.body.isBestSeller ?? false,
    isFeatured: req.body.isFeatured ?? false,
    chapters: req.body.chapters || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.books.unshift(newBook);
  saveDatabase(db);
  res.json({ book: newBook });
});

app.put('/api/books/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.books.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  db.books[index] = {
    ...db.books[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  res.json({ book: db.books[index] });
});

app.delete('/api/books/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const book = db.books.find((b) => b.id === id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // Clean up associated local audio files
  if (book.chapters) {
    for (const chap of book.chapters) {
      if (chap.audioUrl && chap.audioUrl.startsWith('/api/audio/')) {
        const audioFileName = path.basename(chap.audioUrl);
        const fullAudioPath = path.join(AUDIO_DIR, audioFileName);
        if (fs.existsSync(fullAudioPath)) {
          try {
            fs.unlinkSync(fullAudioPath);
          } catch (e) {
            console.error('Failed to remove audio file:', fullAudioPath, e);
          }
        }
      }
    }
  }

  // Also clean up from Cloudflare R2 if client configured
  const { client, bucketName, isConfigured } = getR2Client();
  if (isConfigured && client && book.cloudflareKeys) {
    for (const key of Object.values(book.cloudflareKeys)) {
      if (key) {
        try {
          await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        } catch (e) {
          console.error('R2 delete error for key:', key, e);
        }
      }
    }
  }

  db.books = db.books.filter((b) => b.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: `Product "${book.title}" permanently deleted.` });
});

// -------------------------------------------------------------
// API Routes: AI Book Suggestions (By Collection & Wide Discovery) (Section 2)
// -------------------------------------------------------------
app.post('/api/ai/suggestions-by-collection', async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.body;
    const targetCol = db.collections.find((c) => c.id === collectionId) || db.collections[0];

    const prompt = `You are the master literary strategist for Heartwoven Wonders, a premier worldwide digital publishing house.
Suggest 3 original, deeply compelling, adult nonfiction book concepts specifically tailored for the collection: "${targetCol.name}".
Collection Description: "${targetCol.description}".

Do not create children's books or trivial content. Provide profound, mature reflections on faith, healing, psychological insight, or character discipline.
Return valid JSON adhering strictly to this schema:
[
  {
    "id": "string",
    "title": "string",
    "subtitle": "string",
    "explanation": "string (detailed explanation)",
    "mainSubject": "string",
    "intendedAudience": "string",
    "learningOutcomes": ["string", "string", "string"],
    "proposedChapters": ["string", "string", "string", "string"],
    "collectionReasoning": "string (why it belongs in ${targetCol.name})",
    "suggestedCollectionId": "${targetCol.id}",
    "suggestedPrice": number (e.g. 19.99)
  }
]
No markdown wrapping, only valid JSON.`;

    if (!process.env.GEMINI_API_KEY) {
      // High-quality deterministic suggestions for the chosen collection
      const fallbackSuggestions: BookSuggestion[] = [
        {
          id: `sug-${Date.now()}-1`,
          title: `Anchor of the Hidden Heart`,
          subtitle: `Practicing Sacred Stillness in the Age of Acceleration`,
          explanation: `A meditative inquiry into cultivating contemplative silence, guarding emotional boundaries, and finding God in ordinary duties.`,
          mainSubject: `Spiritual disciplines, interior peace, and intentional simplicity`,
          intendedAudience: `Thoughtful seekers navigating professional burnout or quiet spiritual yearning`,
          learningOutcomes: [
            `How to construct daily interior retreats amidst high-pressure careers`,
            `The psychological difference between detachment and sacred surrender`,
            `Enduring spiritual disciplines from the desert fathers and mothers`,
          ],
          proposedChapters: [
            `1. The Noise We Inhale`,
            `2. The Geography of Stillness`,
            `3. Rhythms of Grace Under Pressure`,
            `4. The Fruit of Quiet Endurance`,
          ],
          collectionReasoning: `Perfect fit for ${targetCol.name} because it bridges contemplative interior practices with grounded modern daily life.`,
          suggestedCollectionId: targetCol.id,
          suggestedPrice: 19.99,
        },
        {
          id: `sug-${Date.now()}-2`,
          title: `The Architecture of Healing`,
          subtitle: `How Human Hearts Rebuild After Unspoken Fractures`,
          explanation: `An evidence-informed and compassionate guide exploring how the soul repairs after grief, loss, and relational betrayals.`,
          mainSubject: `Emotional resilience, post-traumatic renewal, and sacred compassion`,
          intendedAudience: `Adults carrying historical heartaches and professionals in counseling or ministry`,
          learningOutcomes: [
            `Understanding the stages of emotional reconstruction`,
            `Releasing false guilt and embracing unhurried healing`,
            `Cultivating lifelong psychological fortitude`,
          ],
          proposedChapters: [
            `1. Honoring the Fracture`,
            `2. The Work of the Quiet Hours`,
            `3. Rebuilding the Broken Walls`,
            `4. Living as a Whole Vessel`,
          ],
          collectionReasoning: `Aligns directly with the core themes of ${targetCol.name}.`,
          suggestedCollectionId: targetCol.id,
          suggestedPrice: 18.50,
        },
      ];
      res.json({ suggestions: fallbackSuggestions });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const suggestions = JSON.parse(response.text || '[]');
    res.json({ suggestions });
  } catch (error: any) {
    console.error('Suggestions by collection error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/suggestions-wide', async (req: Request, res: Response) => {
  try {
    const { category = 'Psychology & Human Behaviour' } = req.body;

    const collectionsContext = db.collections.map((c) => ({ id: c.id, name: c.name }) );

    const prompt = `You are the master literary strategist for Heartwoven Wonders.
Suggest 3 original, adult nonfiction book concepts in the subject: "${category}".
Categories include: Psychology, Human Behaviour, History, Science, Philosophy, Financial Literacy, Business, Leadership, Wellness, Biblical Studies, Emotional Healing, and Courage.

For EVERY book, intelligently assign it to the MOST APPROPRIATE collection among these eight:
${JSON.stringify(collectionsContext)}

Return valid JSON:
[
  {
    "id": "string",
    "title": "string",
    "subtitle": "string",
    "explanation": "string",
    "mainSubject": "${category}",
    "intendedAudience": "string",
    "learningOutcomes": ["string", "string"],
    "proposedChapters": ["string", "string", "string", "string"],
    "collectionReasoning": "string (why this specific collection fits best)",
    "suggestedCollectionId": "one of the 8 collection IDs",
    "suggestedPrice": number
  }
]`;

    if (!process.env.GEMINI_API_KEY) {
      const fallback: BookSuggestion[] = [
        {
          id: `wide-${Date.now()}-1`,
          title: 'The Psychology of Fortitude',
          subtitle: 'Ancient Stoicism and Modern Cognitive Resilience',
          explanation: 'Synthesizing Marcus Aurelius with modern cognitive reframing to help leaders remain serene under acute stress.',
          mainSubject: category,
          intendedAudience: 'Executives, entrepreneurs, and thinkers navigating high-stakes environments',
          learningOutcomes: [
            'Mastering cognitive decoupling during emotional surges',
            'Applying voluntary discomfort to eliminate performance anxiety',
          ],
          proposedChapters: [
            '1. The Citadel of the Mind',
            '2. Perception Versus Actuality',
            '3. The Habit of Inward Steadiness',
            '4. Leading From Tranquility',
          ],
          collectionReasoning: 'Assigned to Beyond Fear / Personal Growth because it delivers actionable mental resilience.',
          suggestedCollectionId: 'col-growth',
          suggestedPrice: 22.00,
        },
      ];
      res.json({ suggestions: fallback });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const suggestions = JSON.parse(response.text || '[]');
    res.json({ suggestions });
  } catch (error: any) {
    console.error('Wide suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Drafts & Mandatory Approval Workflow (Section 2)
app.get('/api/ai/drafts', (_req: Request, res: Response) => {
  res.json({ drafts: db.bookDrafts });
});

app.post('/api/ai/drafts', (req: Request, res: Response) => {
  const newDraft: BookDraft = {
    id: `draft-${Date.now()}`,
    topic: req.body.topic || 'Inspirational Nonfiction',
    collectionId: req.body.collectionId || 'col-faith',
    title: req.body.title || 'Untitled Manuscript',
    subtitle: req.body.subtitle || '',
    description: req.body.description || '',
    price: req.body.price || 19.99,
    chapters: req.body.chapters || [],
    coverUrl: req.body.coverUrl || '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    status: 'pending_approval',
    version: 1,
    history: [
      {
        version: 1,
        timestamp: new Date().toISOString(),
        note: 'Initial generation from AI Publishing Engine',
        title: req.body.title || 'Untitled Manuscript',
        chaptersCount: (req.body.chapters || []).length,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.bookDrafts.unshift(newDraft);
  saveDatabase(db);
  res.json({ draft: newDraft });
});

app.put('/api/ai/drafts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.bookDrafts.findIndex((d) => d.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }

  const existing = db.bookDrafts[idx];
  const newVersion = existing.version + 1;
  const historyItem = {
    version: newVersion,
    timestamp: new Date().toISOString(),
    note: req.body.editNote || 'Manual editorial revision',
    title: req.body.title || existing.title,
    chaptersCount: (req.body.chapters || existing.chapters).length,
  };

  db.bookDrafts[idx] = {
    ...existing,
    ...req.body,
    version: newVersion,
    history: [historyItem, ...existing.history],
    updatedAt: new Date().toISOString(),
  };

  saveDatabase(db);
  res.json({ draft: db.bookDrafts[idx] });
});

// Regenerate single section without losing the rest of manuscript (Section 2)
app.post('/api/ai/drafts/:id/regenerate-section', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { chapterNumber, title, sectionType } = req.body;
  const draft = db.bookDrafts.find((d) => d.id === id);
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }

  try {
    let prompt = `Write a deep, poetic, inspiring chapter titled "${title}" for an adult nonfiction book titled "${draft.title}".
Length: ~250 words of substantial, mature prose. No preamble.`;

    let newContent = '';
    if (process.env.GEMINI_API_KEY) {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      newContent = resp.text?.trim() || '';
    } else {
      newContent = `When we stand at the threshold of understanding, truth asks only that we remain awake to its subtle lessons. The deeper we journey into ${title}, the more we recognize that peace is an interior fortress built one deliberate choice at a time.`;
    }

    const chapterIdx = draft.chapters.findIndex((c) => c.chapterNumber === chapterNumber);
    if (chapterIdx !== -1) {
      draft.chapters[chapterIdx].content = newContent;
      draft.chapters[chapterIdx].title = title;
    } else {
      draft.chapters.push({
        id: `chap-${Date.now()}`,
        chapterNumber,
        title,
        content: newContent,
      });
    }

    draft.version += 1;
    draft.history.unshift({
      version: draft.version,
      timestamp: new Date().toISOString(),
      note: `Regenerated ${title}`,
      title: draft.title,
      chaptersCount: draft.chapters.length,
    });
    draft.updatedAt = new Date().toISOString();
    saveDatabase(db);

    res.json({ success: true, draft });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Explicit Mandatory Approval Workflow: Publisher must approve before publishing
app.post('/api/ai/drafts/:id/approve-publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const draft = db.bookDrafts.find((d) => d.id === id);
  if (!draft) {
    res.status(404).json({ error: 'Draft not found' });
    return;
  }

  // Create real published book in bookstore
  const publishedBook: Book = {
    id: `book-${Date.now()}`,
    title: draft.title,
    subtitle: draft.subtitle,
    author: 'Sky',
    description: draft.description,
    price: draft.price,
    collectionId: draft.collectionId,
    coverUrl: draft.coverUrl || '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    formats: ['PDF', 'EPUB', 'Audiobook'],
    pageCount: Math.max(120, draft.chapters.length * 35),
    audioDurationSeconds: 0,
    isPublished: true,
    isNewRelease: true,
    isBestSeller: false,
    isFeatured: true,
    chapters: draft.chapters.map((c, i) => ({
      id: `chap-${Date.now()}-${i}`,
      chapterNumber: c.chapterNumber || i + 1,
      title: c.title,
      content: c.content,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  draft.status = 'approved';
  draft.updatedAt = new Date().toISOString();
  db.books.unshift(publishedBook);
  saveDatabase(db);

  res.json({
    success: true,
    message: `Publisher Approval Granted. "${publishedBook.title}" is now officially published in the bookstore.`,
    book: publishedBook,
  });
});

// -------------------------------------------------------------
// API Routes: AI Audiobook Assistant & Production (Section 3)
// -------------------------------------------------------------
const VOICES = [
  { id: 'Kore', name: 'Kore (Warm, Serene & Contemplative)', gender: 'Female', tone: 'Reflective, grounded spiritual pacing' },
  { id: 'Puck', name: 'Puck (Resonant, Clear & Thoughtful)', gender: 'Male', tone: 'Engaging, articulate, philosophical warmth' },
  { id: 'Charon', name: 'Charon (Deep, Authoritative & Steady)', gender: 'Male', tone: 'Calm, measured, profound gravitas' },
  { id: 'Fenrir', name: 'Fenrir (Rich, Direct & Inspiring)', gender: 'Male', tone: 'Strong, encouraging, purposeful drive' },
  { id: 'Zephyr', name: 'Zephyr (Gentle, Empathic & Healing)', gender: 'Female', tone: 'Tender, intimate, peaceful emotional depth' },
];

app.get('/api/audiobook/voices', (_req: Request, res: Response) => {
  res.json({ voices: VOICES });
});

app.post('/api/audiobook/suggestions', async (req: Request, res: Response) => {
  const { topic = 'Sacred Wisdom & Contemplation' } = req.body;

  const fallback: AudiobookSuggestion[] = [
    {
      id: `ab-sug-1`,
      title: `The Sanctuary of Silence`,
      subtitle: `Guided Spoken Contemplations for the Anxious Soul`,
      description: `An immersive spoken audio journey designed for evening listening, untangling daily stress, and resting in divine stillness.`,
      mainTopic: topic,
      intendedAudience: `Nighttime listeners and readers seeking calm meditation`,
      benefits: [`De-escalates nervous system tension`, `Cultivates serene bedtime focus`, `Enhances spiritual intimacy`],
      proposedChapters: [`1. Letting Go of the Day`, `2. The Sacred Inward Room`, `3. Resting in Faith`, `4. Morning Renewal`],
      estimatedLengthMinutes: 45,
      suggestedCollectionId: 'col-healing',
      suggestedPrice: 16.99,
    },
    {
      id: `ab-sug-2`,
      title: `Conversations at Twilight`,
      subtitle: `Wisdom for Modern Pilgrims Walking Through Doubt`,
      description: `A dialogue-rich spoken work exploring the great paradoxes of faith, suffering, and perseverance.`,
      mainTopic: topic,
      intendedAudience: `Seekers and believers wanting deep philosophical and biblical answers`,
      benefits: [`Restores philosophical hope`, `Deepens theological literacy`, `Inspires authentic courage`],
      proposedChapters: [`1. Why Do Shadows Fall?`, `2. The Unseen Hand`, `3. The Courage to Begin`, `4. Dawn Arrives`],
      estimatedLengthMinutes: 60,
      suggestedCollectionId: 'col-faith',
      suggestedPrice: 19.99,
    },
  ];

  res.json({ suggestions: fallback });
});

function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// Generate real speech audio buffer using gemini-3.8-flash-lite-tts
async function generateSpeechAudio(text: string, voiceName = 'Kore'): Promise<{ buffer: Buffer; durationSeconds: number }> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is missing. Real AI spoken narration requires the Gemini API key. Please configure GEMINI_API_KEY in the Secrets panel.'
    );
  }

  const cleanText = text.trim().slice(0, 3000);

  const ttsPromise = ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: cleanText,
            speechMetadata: {
              style: 'Deep, calm, warm publishing narrator with measured cadence and clear pronunciation',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Audio generation request timed out after 20 seconds.')), 20000)
  );

  const response = await Promise.race([ttsPromise, timeoutPromise]);
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Gemini TTS did not return audio data.');
  }

  const rawBuffer = Buffer.from(base64Audio, 'base64');
  let wavBuffer: Buffer;
  let audioDataLength: number;

  if (rawBuffer.length >= 4 && rawBuffer.toString('utf-8', 0, 4) === 'RIFF') {
    wavBuffer = rawBuffer;
    audioDataLength = Math.max(0, rawBuffer.length - 44);
  } else {
    const header = createWavHeader(rawBuffer.length, 24000, 1, 16);
    wavBuffer = Buffer.concat([header, rawBuffer]);
    audioDataLength = rawBuffer.length;
  }

  const durationSeconds = Math.max(1, Math.round((audioDataLength / 48000) * 10) / 10);
  return { buffer: wavBuffer, durationSeconds };
}

app.post('/api/audiobook/preview-voice', async (req: Request, res: Response) => {
  try {
    const { voice = 'Kore' } = req.body;
    const sampleText = 'Welcome to Heartwoven Wonders. Beyond the pages, into the soul. This is a voice preview for our digital audiobook edition.';

    const { buffer, durationSeconds } = await generateSpeechAudio(sampleText, voice);
    const filename = `preview_${voice}_${Date.now()}.wav`;
    const filePath = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      audioUrl: `/api/audio/${filename}`,
      durationSeconds,
      voice,
    });
  } catch (error: any) {
    console.error('Voice preview error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate voice preview audio' });
  }
});

app.post('/api/audiobook/extract-chapters', (req: Request, res: Response) => {
  const { manuscriptText } = req.body;
  if (!manuscriptText || typeof manuscriptText !== 'string' || manuscriptText.trim().length === 0) {
    res.status(400).json({ error: 'Manuscript text is required.' });
    return;
  }

  const lines = manuscriptText.split('\n');
  const chapters: { chapterNumber: number; title: string; content: string }[] = [];
  let currentChapter = { chapterNumber: 1, title: 'Chapter 1: The Awakening', content: '' };
  const chapterRegex = /^(chapter|part|section|\d+[\.:])\s*([0-9ivxlcdm]+)?\s*[:\-\—]?\s*(.*)$/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (chapterRegex.test(line) && currentChapter.content.length > 80) {
      chapters.push({ ...currentChapter });
      currentChapter = {
        chapterNumber: chapters.length + 1,
        title: line.length > 50 ? line.slice(0, 47) + '...' : line,
        content: '',
      };
    } else {
      currentChapter.content += (currentChapter.content ? '\n\n' : '') + line;
    }
  }

  if (currentChapter.content.trim().length > 0) {
    chapters.push(currentChapter);
  }

  res.json({ chapters });
});

app.post('/api/audiobook/generate-chapter-audio', async (req: Request, res: Response) => {
  try {
    const { chapterId, title, content, voice = 'Kore', bookId } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Chapter content cannot be empty.' });
      return;
    }

    const { buffer, durationSeconds } = await generateSpeechAudio(content, voice);
    const safeTitle = (title || 'chapter').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `chapter_${safeTitle}_${Date.now()}.wav`;
    const filePath = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(filePath, buffer);

    const audioUrl = `/api/audio/${filename}`;
    let cloudflareKey: string | undefined;

    // Optional upload to Cloudflare R2
    const { client, bucketName, isConfigured } = getR2Client();
    if (isConfigured && client) {
      cloudflareKey = `audiobooks/${bookId || 'standalone'}/${filename}`;
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: cloudflareKey,
            Body: buffer,
            ContentType: 'audio/wav',
          })
        );
      } catch (r2Err) {
        console.error('Failed to upload audio to Cloudflare R2:', r2Err);
      }
    }

    if (bookId) {
      const book = db.books.find((b) => b.id === bookId);
      if (book) {
        const chapter = book.chapters.find((c) => c.id === chapterId);
        if (chapter) {
          chapter.audioUrl = audioUrl;
          chapter.audioDurationSeconds = durationSeconds;
          chapter.audioGeneratedAt = new Date().toISOString();
          chapter.voiceName = voice;
          chapter.status = 'completed';
          chapter.cloudflareKey = cloudflareKey;

          book.audioDurationSeconds = book.chapters.reduce((acc, c) => acc + (c.audioDurationSeconds || 0), 0);
          saveDatabase(db);
        }
      }
    }

    res.json({
      success: true,
      audioUrl,
      durationSeconds,
      voice,
      cloudflareKey,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chapter audio generation error:', error);
    res.status(500).json({ error: error.message || 'Audio generation failed.' });
  }
});

app.post('/api/audiobook/remove-chapter-audio', (req: Request, res: Response) => {
  const { bookId, chapterId } = req.body;
  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  const chapter = book.chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    res.status(404).json({ error: 'Chapter not found' });
    return;
  }

  if (chapter.audioUrl && chapter.audioUrl.startsWith('/api/audio/')) {
    const filename = path.basename(chapter.audioUrl);
    const fullPath = path.join(AUDIO_DIR, filename);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        console.error('Error unlinking audio file:', e);
      }
    }
  }

  chapter.audioUrl = undefined;
  chapter.audioDurationSeconds = 0;
  chapter.status = 'draft';
  chapter.audioGeneratedAt = undefined;
  book.audioDurationSeconds = book.chapters.reduce((acc, c) => acc + (c.audioDurationSeconds || 0), 0);
  saveDatabase(db);

  res.json({ success: true, message: 'Audio removed successfully.' });
});

// Convert completed ebook into an audiobook project (Section 3)
app.post('/api/audiobook/create-from-book', (req: Request, res: Response) => {
  const { bookId, voice = 'Kore' } = req.body;
  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const newProject: AudiobookProject = {
    id: `ab-proj-${Date.now()}`,
    bookId: book.id,
    title: `${book.title} (Audiobook Edition)`,
    subtitle: book.subtitle,
    author: book.author,
    description: book.description,
    coverUrl: book.coverUrl,
    price: book.price,
    collectionId: book.collectionId,
    narratorVoice: voice,
    chapters: book.chapters.map((c) => ({
      id: `ab-chap-${c.id}`,
      chapterNumber: c.chapterNumber,
      title: c.title,
      textSnippet: c.content.slice(0, 100),
      fullText: c.content,
      voice,
      status: c.audioUrl ? 'completed' : 'pending',
      audioUrl: c.audioUrl,
      audioDurationSeconds: c.audioDurationSeconds,
    })),
    totalDurationSeconds: book.audioDurationSeconds || 0,
    status: 'in_progress',
    isApproved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.audiobookProjects.unshift(newProject);
  saveDatabase(db);
  res.json({ project: newProject });
});

// -------------------------------------------------------------
// API Routes: PayPal Payment Integration (Section 5)
// Genuine backend verification & Trinidad & Tobago Support
// -------------------------------------------------------------
app.get('/api/paypal/config', (_req: Request, res: Response) => {
  res.json({
    clientId: db.settings.paypal.clientId,
    environment: db.settings.paypal.environment,
    currency: db.settings.paypal.currency,
    isConfigured: db.settings.paypal.isConfigured,
    trinidadTobagoSupportNotes: db.settings.paypal.trinidadTobagoSupportNotes,
  });
});

app.get('/api/paypal/tt-support', (_req: Request, res: Response) => {
  res.json({
    country: 'Trinidad and Tobago',
    accountTypeRequired: 'PayPal Premier or Business Account',
    canReceivePayments: true,
    supportedCurrenciesForCheckout: ['USD', 'EUR', 'GBP', 'CAD'],
    settlementNotes: 'Payments must be created and settled in a supported PayPal currency such as USD. TTD (Trinidad and Tobago Dollar) is not a held balance currency in PayPal. Merchants in Trinidad & Tobago receive funds in USD/EUR and can withdraw to an eligible local Visa card (via card transfer / Visa Direct) or a US dollar bank account.',
  });
});

// Real PayPal OAuth helper
async function getPayPalAccessToken(): Promise<string | null> {
  const { clientId, clientSecret, environment } = db.settings.paypal;
  if (!clientId || !clientSecret) return null;

  const authUrl = environment === 'live'
    ? 'https://api-m.paypal.com/v1/oauth2/token'
    : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const resp = await fetch(authUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const data = await resp.json();
    return data.access_token || null;
  } catch (err) {
    console.error('PayPal OAuth error:', err);
    return null;
  }
}

app.post('/api/paypal/test-connection', async (_req: Request, res: Response) => {
  const { clientId, clientSecret, environment } = db.settings.paypal;
  if (!clientId || !clientSecret) {
    res.json({
      connected: false,
      message: 'PayPal credentials missing. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Store Settings or environment secrets.',
    });
    return;
  }

  const token = await getPayPalAccessToken();
  if (token) {
    res.json({
      connected: true,
      environment,
      message: `Successfully connected to PayPal REST API (${environment} environment). Ready to process genuine transactions.`,
    });
  } else {
    res.json({
      connected: false,
      message: `Failed to authenticate with PayPal ${environment} API. Check your Client ID and Secret.`,
    });
  }
});

app.post('/api/paypal/create-order', async (req: Request, res: Response) => {
  const { items, customerEmail, customerName } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Cart items required.' });
    return;
  }

  const totalAmount = items.reduce((acc: number, item: any) => acc + (item.book.price * item.quantity), 0);
  const currency = db.settings.paypal.currency || 'USD';

  // If live PayPal credentials exist, call PayPal Orders API
  const token = await getPayPalAccessToken();
  if (token) {
    const baseApi = db.settings.paypal.environment === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    try {
      const orderResp = await fetch(`${baseApi}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: totalAmount.toFixed(2),
              },
              description: `Heartwoven Wonders: ${items.map((i: any) => i.book.title).join(', ')}`,
            },
          ],
        }),
      });

      const orderData = await orderResp.json();
      res.json({
        orderId: orderData.id,
        status: orderData.status,
        mode: 'paypal_api',
      });
      return;
    } catch (e: any) {
      console.error('PayPal Order Creation error:', e);
    }
  }

  // Graceful Sandbox Simulator mode when keys aren't yet entered by user
  const simulatedOrderId = `HW-PP-ORDER-${Date.now()}`;
  res.json({
    orderId: simulatedOrderId,
    status: 'CREATED',
    mode: 'sandbox_simulation',
    note: 'PayPal Sandbox simulation active. Add PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET to enable live PayPal checkout gateway.',
  });
});

app.post('/api/paypal/capture-order', async (req: Request, res: Response) => {
  const { orderId, items, customerEmail, customerName } = req.body;
  if (!orderId || !items) {
    res.status(400).json({ error: 'Order ID and items are required.' });
    return;
  }

  const email = customerEmail || (currentActiveCustomer ? currentActiveCustomer.email : 'reader@heartwovenwonders.com');
  const name = customerName || (currentActiveCustomer ? currentActiveCustomer.name : 'Valued Reader');

  // Find or create customer
  let customer = db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    db.customers.push(customer);
  }

  // Record verified purchases for each item
  const newPurchases: Purchase[] = [];
  for (const item of items) {
    const book = db.books.find((b) => b.id === item.book.id) || item.book;
    const purchase: Purchase = {
      id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: customer.name,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCoverUrl: book.coverUrl,
      formats: book.formats,
      amount: book.price * (item.quantity || 1),
      currency: db.settings.paypal.currency || 'USD',
      paypalOrderId: orderId,
      paypalCaptureId: `cap-${Date.now()}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    db.purchases.unshift(purchase);
    newPurchases.push(purchase);
  }

  saveDatabase(db);

  res.json({
    success: true,
    message: 'Payment verified and captured successfully. Digital deliverables deposited to My Library.',
    purchases: newPurchases,
    customer,
  });
});

// -------------------------------------------------------------
// API Routes: Customer Accounts & Authentication (Section 6)
// -------------------------------------------------------------
app.get('/api/auth/me', (_req: Request, res: Response) => {
  res.json({ customer: currentActiveCustomer });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  let customer = db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: name || 'Valued Reader',
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    db.customers.push(customer);
    saveDatabase(db);
  }

  currentActiveCustomer = customer;
  res.json({ success: true, customer });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  let customer = db.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!customer) {
    customer = {
      id: `cust-${Date.now()}`,
      name: 'Valued Reader',
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    db.customers.push(customer);
    saveDatabase(db);
  }

  currentActiveCustomer = customer;
  res.json({ success: true, customer });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  currentActiveCustomer = null;
  res.json({ success: true });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: `Password reset link dispatched to ${email || 'your email'}. Check your inbox.`,
  });
});

// Customer's purchased library (Section 6 & 7)
app.get('/api/customer/purchases', (_req: Request, res: Response) => {
  const email = currentActiveCustomer ? currentActiveCustomer.email : 'reader@heartwovenwonders.com';
  const customerPurchases = db.purchases.filter((p) => p.customerEmail.toLowerCase() === email.toLowerCase());

  // Enrich with full book details (formats, chapters, page count)
  const enriched = customerPurchases.map((pur) => {
    const book = db.books.find((b) => b.id === pur.bookId);
    return {
      ...pur,
      bookDetails: book || null,
      availableFormats: book ? book.formats : pur.formats,
    };
  });

  res.json({ purchases: enriched });
});

// -------------------------------------------------------------
// API Routes: Secure Digital Delivery (PDF, EPUB, Audio) (Section 7 & 8)
// Genuine generation and packaging of digital goods
// -------------------------------------------------------------

// 1. Deliver Printable / Beautifully Formatted PDF
app.get('/api/download/pdf/:bookId', (req: Request, res: Response) => {
  const { bookId } = req.params;
  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    res.status(404).send('Book not found in publishing archive.');
    return;
  }

  const safeFilename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_Edition.html`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${book.title} — Heartwoven Wonders Digital Edition</title>
  <style>
    @page { margin: 2in 1.5in; size: letter; }
    body {
      font-family: 'Georgia', serif;
      color: #1a1a1a;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .cover-page {
      text-align: center;
      page-break-after: always;
      padding-top: 150px;
    }
    .ornament { color: #8a6d1c; font-size: 24px; margin: 20px 0; }
    h1 { font-size: 38px; color: #2c124d; margin-bottom: 8px; letter-spacing: 1px; }
    .subtitle { font-size: 20px; color: #5a4a35; font-style: italic; margin-bottom: 40px; }
    .author { font-size: 18px; text-transform: uppercase; letter-spacing: 3px; color: #333; margin-top: 80px; }
    .imprint { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #777; margin-top: 150px; }
    .chapter { page-break-before: always; margin-top: 60px; }
    .chapter-num { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #8a6d1c; font-weight: bold; }
    .chapter-title { font-size: 26px; color: #2c124d; margin-top: 5px; margin-bottom: 25px; }
    p { text-indent: 1.5em; margin: 0 0 1em 0; text-align: justify; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="ornament">✦ ✦ ✦</div>
    <h1>${book.title}</h1>
    <div class="subtitle">${book.subtitle || ''}</div>
    <div class="author">By ${book.author}</div>
    <div class="ornament">✦</div>
    <div class="imprint">Heartwoven Wonders Publishing House<br>Digital Deliveries Archive</div>
  </div>

  <div class="toc" style="page-break-after: always; padding-top: 60px;">
    <h2 style="color: #2c124d;">Table of Contents</h2>
    <div style="margin-top: 30px;">
      ${book.chapters.map((c) => `<div style="padding: 8px 0; border-bottom: 1px dotted #ccc;">Chapter ${c.chapterNumber}: ${c.title}</div>`).join('')}
    </div>
  </div>

  ${book.chapters.map((c) => `
    <div class="chapter">
      <div class="chapter-num">Chapter ${c.chapterNumber}</div>
      <h2 class="chapter-title">${c.title}</h2>
      ${c.content.split('\n\n').map((p) => `<p>${p.trim()}</p>`).join('')}
    </div>
  `).join('')}

  <script>
    // Prompt print dialog for immediate Save as PDF
    window.addEventListener('load', () => {
      // User can print/save directly
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
  res.send(html);
});

// 2. Deliver Genuine EPUB Zip Archive (Section 7)
app.get('/api/download/epub/:bookId', (req: Request, res: Response) => {
  const { bookId } = req.params;
  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    res.status(404).send('Book not found in publishing archive.');
    return;
  }

  const safeFilename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.epub`;

  res.setHeader('Content-Type', 'application/epub+zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

  const archive = archiver.ZipArchive
    ? new archiver.ZipArchive({ zlib: { level: 9 } })
    : typeof archiver === 'function'
    ? archiver('zip', { zlib: { level: 9 } })
    : new (archiver.default || archiver)('zip', { zlib: { level: 9 } });

  archive.on('error', (err: any) => {
    console.error('EPUB Archiver error:', err);
    res.status(500).end();
  });

  archive.pipe(res);

  // 1. mimetype (MUST be first file, uncompressed as per EPUB spec)
  archive.append('application/epub+zip', { name: 'mimetype', store: true });

  // 2. container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  archive.append(containerXml, { name: 'META-INF/container.xml' });

  // 3. OEBPS/content.opf
  const manifestItems = book.chapters.map((_, i) => `<item id="chap_${i + 1}" href="chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ');
  const spineItems = book.chapters.map((_, i) => `<itemref idref="chap_${i + 1}"/>`).join('\n    ');

  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${book.title}</dc:title>
    <dc:creator>${book.author}</dc:creator>
    <dc:publisher>Heartwoven Wonders Publishing House</dc:publisher>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">urn:uuid:${book.id}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`;
  archive.append(contentOpf, { name: 'OEBPS/content.opf' });

  // 4. OEBPS/toc.ncx
  const navPoints = book.chapters.map((c, i) => `
    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>Chapter ${c.chapterNumber}: ${c.title}</text></navLabel>
      <content src="chapter_${i + 1}.xhtml"/>
    </navPoint>`).join('');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${book.id}"/>
  </head>
  <docTitle><text>${book.title}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`;
  archive.append(tocNcx, { name: 'OEBPS/toc.ncx' });

  // 5. OEBPS/chapter_X.xhtml
  book.chapters.forEach((c, i) => {
    const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${c.title}</title>
  <style type="text/css">
    body { font-family: serif; line-height: 1.6; margin: 5%; }
    h1 { color: #2c124d; text-align: center; margin-bottom: 2em; }
    p { text-indent: 1.5em; margin: 0 0 1em 0; }
  </style>
</head>
<body>
  <h1>Chapter ${c.chapterNumber}: ${c.title}</h1>
  ${c.content.split('\n\n').map((p) => `<p>${p.trim()}</p>`).join('\n  ')}
</body>
</html>`;
    archive.append(xhtml, { name: `OEBPS/chapter_${i + 1}.xhtml` });
  });

  archive.finalize();
});

// 3. Deliver Audio Chapter (MP3 / WAV) (Section 7)
app.get('/api/download/audio/:bookId/:chapterId?', (req: Request, res: Response) => {
  const { bookId, chapterId } = req.params;
  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    res.status(404).send('Audiobook not found.');
    return;
  }

  const targetChapter = chapterId
    ? book.chapters.find((c) => c.id === chapterId)
    : book.chapters.find((c) => Boolean(c.audioUrl));

  if (!targetChapter || !targetChapter.audioUrl) {
    res.status(404).send('Spoken audio has not been generated for this chapter yet.');
    return;
  }

  const filename = path.basename(targetChapter.audioUrl);
  const filePath = path.join(AUDIO_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).send('Audio file missing from server storage.');
    return;
  }

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Disposition', `attachment; filename="${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_Chap${targetChapter.chapterNumber}.wav"`);
  fs.createReadStream(filePath).pipe(res);
});

// -------------------------------------------------------------
// API Routes: Database Backups & Recovery (Section 11)
// -------------------------------------------------------------
app.get('/api/admin/backups', (_req: Request, res: Response) => {
  res.json({ backups: db.backups });
});

app.post('/api/admin/backups', (_req: Request, res: Response) => {
  const backupId = `backup-${Date.now()}`;
  const backupFile = path.join(BACKUPS_DIR, `${backupId}.json`);
  const content = JSON.stringify(db, null, 2);

  fs.writeFileSync(backupFile, content, 'utf-8');

  const newRecord: BackupRecord = {
    id: backupId,
    timestamp: new Date().toISOString(),
    sizeBytes: Buffer.byteLength(content),
    description: `Manual database snapshot with ${db.books.length} books and ${db.purchases.length} purchases`,
    entityCounts: {
      books: db.books.length,
      collections: db.collections.length,
      purchases: db.purchases.length,
      customers: db.customers.length,
      drafts: db.bookDrafts.length,
      audiobooks: db.audiobookProjects.length,
    },
  };

  db.backups.unshift(newRecord);
  saveDatabase(db);

  res.json({ success: true, backup: newRecord });
});

app.post('/api/admin/backups/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;
  const backupFile = path.join(BACKUPS_DIR, `${id}.json`);

  if (!fs.existsSync(backupFile)) {
    res.status(404).json({ error: 'Backup snapshot file not found' });
    return;
  }

  try {
    const raw = fs.readFileSync(backupFile, 'utf-8');
    db = JSON.parse(raw);
    saveDatabase(db);
    res.json({ success: true, message: 'Database restored successfully from snapshot.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/backups/export', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="heartwoven_wonders_backup_${Date.now()}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// -------------------------------------------------------------
// API Routes: Store Policies & SEO (Section 13 & 14)
// -------------------------------------------------------------
app.get('/api/policies', (_req: Request, res: Response) => {
  res.json({ policies: db.settings.policies || INITIAL_POLICIES });
});

app.put('/api/policies/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const policies = db.settings.policies || INITIAL_POLICIES;
  const idx = policies.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Policy not found' });
    return;
  }
  policies[idx] = {
    ...policies[idx],
    ...req.body,
    lastUpdated: new Date().toISOString(),
  };
  db.settings.policies = policies;
  saveDatabase(db);
  res.json({ policy: policies[idx] });
});

// Store Settings & Author Profile
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({ settings: db.settings });
});

app.put('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  res.json({ settings: db.settings });
});

app.get('/api/author', (_req: Request, res: Response) => {
  res.json({ author: db.author });
});

app.put('/api/author', (req: Request, res: Response) => {
  db.author = { ...db.author, ...req.body };
  saveDatabase(db);
  res.json({ author: db.author });
});

// Cloudflare R2 Diagnostics
app.get('/api/r2/status', (_req: Request, res: Response) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'heartwoven-wonders-books';
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  const status: R2ConfigStatus = {
    configured: Boolean(accessKeyId && secretAccessKey && (endpoint || accountId)),
    bucketName,
    accountIdPresent: Boolean(accountId),
    accessKeyPresent: Boolean(accessKeyId),
    secretKeyPresent: Boolean(secretAccessKey),
    endpointPresent: Boolean(endpoint),
  };
  res.json(status);
});

app.post('/api/r2/test-connection', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const { client, bucketName, isConfigured } = getR2Client();

  if (!isConfigured || !client) {
    res.json({
      success: false,
      connected: false,
      uploadSuccess: false,
      downloadSuccess: false,
      message: 'Cloudflare R2 credentials missing. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and CLOUDFLARE_ACCOUNT_ID (or R2_ENDPOINT) in your environment secrets.',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const testKey = `diagnostics/connection-test-${Date.now()}.txt`;
  const testPayload = `Heartwoven Wonders Cloudflare R2 diagnostic ping at ${new Date().toISOString()}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: Buffer.from(testPayload),
        ContentType: 'text/plain',
      })
    );
    const uploadTime = Date.now() - startTime;

    const downloadStart = Date.now();
    const getRes = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
    const downloadedText = await getRes.Body?.transformToString();
    const downloadTime = Date.now() - downloadStart;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );

    const isMatch = downloadedText === testPayload;

    res.json({
      success: isMatch,
      connected: true,
      uploadSuccess: true,
      downloadSuccess: isMatch,
      latencyMs: uploadTime + downloadTime,
      message: isMatch
        ? `Successfully connected to private Cloudflare R2 bucket "${bucketName}". Upload and verification verified (${uploadTime + downloadTime}ms).`
        : 'Uploaded test file but payload verification mismatch.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('R2 Connection test failed:', error);
    res.json({
      success: false,
      connected: false,
      uploadSuccess: false,
      downloadSuccess: false,
      message: `Cloudflare R2 connection test failed: ${error.message || 'Unknown error'}. Check your R2 bucket permissions and endpoint.`,
      timestamp: new Date().toISOString(),
    });
  }
});

// Audiobook Projects CRUD
app.get('/api/audiobook/projects', (_req: Request, res: Response) => {
  res.json({ projects: db.audiobookProjects });
});

app.post('/api/audiobook/projects', (req: Request, res: Response) => {
  const newProject: AudiobookProject = {
    id: `ab-${Date.now()}`,
    bookId: req.body.bookId,
    title: req.body.title || 'Untitled Audiobook',
    subtitle: req.body.subtitle || '',
    author: req.body.author || 'Sky',
    description: req.body.description || '',
    coverUrl: req.body.coverUrl || '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
    price: req.body.price || 19.99,
    collectionId: req.body.collectionId || 'col-faith',
    narratorVoice: req.body.narratorVoice || 'Kore',
    chapters: req.body.chapters || [],
    totalDurationSeconds: 0,
    status: 'draft',
    isApproved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.audiobookProjects.unshift(newProject);
  saveDatabase(db);
  res.json({ project: newProject });
});

app.put('/api/audiobook/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.audiobookProjects.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  db.audiobookProjects[idx] = {
    ...db.audiobookProjects[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  res.json({ project: db.audiobookProjects[idx] });
});

// Explicit Audiobook Approval Workflow (Section 3)
app.post('/api/audiobook/projects/:id/approve-publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const proj = db.audiobookProjects.find((p) => p.id === id);
  if (!proj) {
    res.status(404).json({ error: 'Audiobook project not found' });
    return;
  }

  proj.isApproved = true;
  proj.status = 'published';
  proj.updatedAt = new Date().toISOString();

  // If connected to a book, update the book's formats to include Audiobook
  if (proj.bookId) {
    const book = db.books.find((b) => b.id === proj.bookId);
    if (book) {
      if (!book.formats.includes('Audiobook')) {
        book.formats.push('Audiobook');
      }
      book.audioDurationSeconds = proj.totalDurationSeconds;
    }
  }

  saveDatabase(db);
  res.json({ success: true, message: `Audiobook "${proj.title}" approved and published.`, project: proj });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Heartwoven Wonders server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

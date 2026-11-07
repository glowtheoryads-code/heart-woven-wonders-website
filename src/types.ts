export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  audioGeneratedAt?: string;
  voiceName?: string;
  status?: 'draft' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
  cloudflareKey?: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  price: number;
  collectionId: string;
  coverUrl: string;
  formats: ('PDF' | 'EPUB' | 'Audiobook')[];
  pageCount: number;
  audioDurationSeconds?: number;
  isPublished: boolean;
  isNewRelease: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  chapters: Chapter[];
  cloudflareKeys?: {
    pdf?: string;
    epub?: string;
    audio?: string;
    cover?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  visualTheme: {
    accentColor: string;
    accentBorder: string;
    badgeStyle: string;
    frameShape: 'arch' | 'filigree' | 'faceted' | 'crest' | 'quill' | 'halo' | 'seal' | 'embossed';
    bgGradient: string;
    ornament: string;
  };
  order: number;
  showOnHomepage: boolean;
}

export interface Quote {
  id: string;
  text: string;
  theme: 'faith' | 'wisdom' | 'healing' | 'truth' | 'hope' | 'courage' | 'purpose';
}

export interface AuthorProfile {
  name: string;
  tagline: string;
  photoUrl: string;
  introduction: string;
  biography: string;
  philosophy: string;
  purposeMessage: string;
  contactEmail: string;
  location: string;
  publishedBooksCount: number;
}

export interface HomepageSection {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export interface PayPalSettings {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  environment: 'sandbox' | 'live';
  currency: string;
  isConfigured: boolean;
  trinidadTobagoSupportNotes: string;
}

export interface StorePolicy {
  id: string;
  title: string;
  slug: string;
  content: string;
  lastUpdated: string;
}

export interface SEOSettings {
  siteTitle: string;
  metaDescription: string;
  ogImage: string;
  keywords: string[];
  authorBrand: string;
}

export interface VisualStyling {
  primaryPurple: string;
  goldAccent: string;
  displayFont: string;
  bodyFont: string;
  ornamentStyle: 'regal_crest' | 'filigree_flourish' | 'classic_medallion';
}

export interface StoreSettings {
  announcementText: string;
  heroHeading: string;
  heroTagline: string;
  homepageSections: HomepageSection[];
  collectionsOrder: string[];
  paypal: PayPalSettings;
  policies: StorePolicy[];
  seo: SEOSettings;
  visualStyling: VisualStyling;
  adminPasscode: string;
}

export interface AudiobookChapter {
  id: string;
  chapterNumber: number;
  title: string;
  textSnippet: string;
  fullText: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  voice: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  cloudflareKey?: string;
  error?: string;
  generatedAt?: string;
}

export interface AudiobookProject {
  id: string;
  bookId?: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  coverUrl: string;
  price: number;
  collectionId: string;
  narratorVoice: string;
  chapters: AudiobookChapter[];
  totalDurationSeconds: number;
  status: 'draft' | 'in_progress' | 'ready_for_review' | 'published';
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface R2ConfigStatus {
  configured: boolean;
  bucketName: string;
  accountIdPresent: boolean;
  accessKeyPresent: boolean;
  secretKeyPresent: boolean;
  endpointPresent: boolean;
  lastTestResult?: {
    connected: boolean;
    uploadSuccess: boolean;
    downloadSuccess: boolean;
    latencyMs?: number;
    message: string;
    timestamp: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string;
  formats: ('PDF' | 'EPUB' | 'Audiobook')[];
  amount: number;
  currency: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  status: 'completed' | 'pending' | 'refunded';
  createdAt: string;
}

export interface BookSuggestion {
  id: string;
  title: string;
  subtitle: string;
  explanation: string;
  mainSubject: string;
  intendedAudience: string;
  learningOutcomes: string[];
  proposedChapters: string[];
  collectionReasoning: string;
  suggestedCollectionId: string;
  suggestedPrice: number;
}

export interface AudiobookSuggestion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  mainTopic: string;
  intendedAudience: string;
  benefits: string[];
  proposedChapters: string[];
  estimatedLengthMinutes: number;
  suggestedCollectionId: string;
  suggestedPrice: number;
}

export interface BookDraftHistoryItem {
  version: number;
  timestamp: string;
  note: string;
  title: string;
  chaptersCount: number;
}

export interface BookDraft {
  id: string;
  topic: string;
  collectionId: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  chapters: Chapter[];
  coverUrl: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  version: number;
  history: BookDraftHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  sizeBytes: number;
  description: string;
  entityCounts: {
    books: number;
    collections: number;
    purchases: number;
    customers: number;
    drafts: number;
    audiobooks: number;
  };
}

import React, { useState, useEffect } from 'react';
import {
  Book,
  Collection,
  AuthorProfile,
  StoreSettings,
  AudiobookProject,
  R2ConfigStatus,
  Chapter,
  BookDraft,
  BookSuggestion,
  AudiobookSuggestion,
  Purchase,
  BackupRecord,
  StorePolicy,
} from '../types';
import {
  Shield,
  Settings,
  BookOpen,
  Headphones,
  Cloud,
  User,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCw,
  RefreshCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  Volume2,
  FileText,
  Key,
  ExternalLink,
  Save,
  Check,
  CreditCard,
  DollarSign,
  Download,
  Database,
  Search,
  List,
  Layers,
  FileCheck,
  History,
  Lock,
  Globe,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  collections: Collection[];
  author: AuthorProfile;
  settings: StoreSettings;
  onRefreshData: () => void;
}

type AdminTab =
  | 'overview'
  | 'settings'
  | 'products'
  | 'collections'
  | 'ai-writer'
  | 'audiobook'
  | 'purchases'
  | 'backups'
  | 'policies'
  | 'cloudflare-r2'
  | 'paypal'
  | 'integrations'
  | 'author';

const WIDE_TOPICS = [
  'Psychology & Human Behaviour',
  'History and Civilizations',
  'Science and Discoveries',
  'Philosophy & Critical Thinking',
  'Financial Literacy & Money Stewardship',
  'Business & Ethical Entrepreneurship',
  'Leadership & Personal Integrity',
  'Health & Holistic Wellness',
  'Biblical Studies & Faith Foundations',
  'Emotional Healing & Trauma Recovery',
  'Personal Growth & Life Discipline',
  'Relationships, Communication & Empathy',
  'Courage & Inner Resilience',
  'Journals & Daily Practice Workbooks',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  books,
  collections,
  author,
  settings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Store Settings state
  const [localSettings, setLocalSettings] = useState<StoreSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Author Profile state
  const [localAuthor, setLocalAuthor] = useState<AuthorProfile>(author);
  const [authorSaved, setAuthorSaved] = useState(false);

  // Delete product modal state
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit / Create product modal
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [bookCoverPreview, setBookCoverPreview] = useState<string>('');

  // Collection Editor & Image Management state (Requirement 4)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionImagePreview, setCollectionImagePreview] = useState<string>('');
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [collectionSuccessMsg, setCollectionSuccessMsg] = useState<string | null>(null);

  // Cloudflare R2 status & diagnostic state
  const [r2Status, setR2Status] = useState<R2ConfigStatus | null>(null);
  const [isTestingR2, setIsTestingR2] = useState(false);
  const [r2TestResult, setR2TestResult] = useState<any>(null);

  // PayPal status & testing
  const [isTestingPayPal, setIsTestingPayPal] = useState(false);
  const [payPalTestResult, setPayPalTestResult] = useState<any>(null);

  // Purchases list
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Backups list
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  // AI Book Writer state (Section 2)
  const [suggestionMode, setSuggestionMode] = useState<'by_collection' | 'wide'>('by_collection');
  const [selectedColForSuggestion, setSelectedColForSuggestion] = useState(collections[0]?.id || 'col-faith');
  const [wideTopic, setWideTopic] = useState('Psychology & Human Behaviour');
  const [customTopic, setCustomTopic] = useState('');
  const [bookSuggestions, setBookSuggestions] = useState<BookSuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BookSuggestion | null>(null);

  // Drafts & Mandatory Approval state (Section 2)
  const [drafts, setDrafts] = useState<BookDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<BookDraft | null>(null);
  const [isGeneratingManuscript, setIsGeneratingManuscript] = useState(false);
  const [regeneratingChapterNum, setRegeneratingChapterNum] = useState<number | null>(null);

  // AI Audiobook Studio state (Section 3)
  const [selectedBookForAudio, setSelectedBookForAudio] = useState<Book | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [voices, setVoices] = useState<any[]>([]);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [playingChapterId, setPlayingChapterId] = useState<string | null>(null);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [audiobookProjects, setAudiobookProjects] = useState<AudiobookProject[]>([]);
  const [audioSuggestions, setAudioSuggestions] = useState<AudiobookSuggestion[]>([]);
  const [isGeneratingAudioSuggestions, setIsGeneratingAudioSuggestions] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLocalAuthor(author);
  }, [author]);

  // Load secondary data on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/r2/status').then((r) => r.json()).then(setR2Status).catch(console.error);
      fetch('/api/audiobook/voices').then((r) => r.json()).then((d) => setVoices(d.voices || [])).catch(console.error);
      fetch('/api/customer/purchases').then((r) => r.json()).then((d) => setPurchases(d.purchases || [])).catch(console.error);
      fetch('/api/ai/drafts').then((r) => r.json()).then((d) => {
        setDrafts(d.drafts || []);
        if (d.drafts && d.drafts.length > 0 && !activeDraft) {
          setActiveDraft(d.drafts[0]);
        }
      }).catch(console.error);
      fetch('/api/audiobook/projects').then((r) => r.json()).then((d) => setAudiobookProjects(d.projects || [])).catch(console.error);
      fetch('/api/admin/backups').then((r) => r.json()).then((d) => setBackups(d.backups || [])).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // -----------------------------------------------------------
  // Action Handlers
  // -----------------------------------------------------------

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
        onRefreshData();
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handleSaveAuthor = async () => {
    try {
      const res = await fetch('/api/author', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localAuthor),
      });
      if (res.ok) {
        setAuthorSaved(true);
        setTimeout(() => setAuthorSaved(false), 2500);
        onRefreshData();
      }
    } catch (e) {
      console.error('Failed to save author:', e);
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...localSettings.homepageSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    newSections.forEach((sec, idx) => {
      sec.order = idx + 1;
    });

    setLocalSettings({ ...localSettings, homepageSections: newSections });
  };

  const handleToggleSection = (sectionId: string) => {
    const newSections = localSettings.homepageSections.map((sec) =>
      sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
    );
    setLocalSettings({ ...localSettings, homepageSections: newSections });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/books/${bookToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookToDelete(null);
        onRefreshData();
      }
    } catch (e) {
      console.error('Failed to delete book:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (book: Book) => {
    try {
      await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !book.isPublished }),
      });
      onRefreshData();
    } catch (e) {
      console.error('Failed to toggle publish:', e);
    }
  };

  const handleSaveBook = async (bookData: Partial<Book>) => {
    try {
      if (editingBook) {
        await fetch(`/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData),
        });
      } else {
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData),
        });
      }
      setEditingBook(null);
      setIsCreatingBook(false);
      setBookCoverPreview('');
      onRefreshData();
    } catch (e) {
      console.error('Failed to save book:', e);
    }
  };

  // Collection Management Handlers (Requirement 4)
  const handleOpenEditCollection = (col: Collection) => {
    setEditingCollection(JSON.parse(JSON.stringify(col)));
    setCollectionImagePreview(col.coverImage || '');
    setCollectionSuccessMsg(null);
  };

  const handleCollectionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCollectionImagePreview(result);
        if (editingCollection) {
          setEditingCollection({ ...editingCollection, coverImage: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCollectionImage = async () => {
    if (!editingCollection) return;
    if (
      confirm(
        `Delete cover image for "${editingCollection.name}"? Note: The collection itself and its books will remain completely safe.`
      )
    ) {
      setCollectionImagePreview('');
      setEditingCollection({ ...editingCollection, coverImage: '' });
      await fetch(`/api/collections/${editingCollection.id}/image`, { method: 'DELETE' });
      onRefreshData();
      setCollectionSuccessMsg('Cover image removed. Collection and books preserved.');
      setTimeout(() => setCollectionSuccessMsg(null), 3000);
    }
  };

  const handleSaveCollection = async () => {
    if (!editingCollection) return;
    setIsSavingCollection(true);
    setCollectionSuccessMsg(null);
    try {
      const payload = {
        ...editingCollection,
        coverImage: collectionImagePreview || editingCollection.coverImage,
      };
      const res = await fetch(`/api/collections/${editingCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onRefreshData();
        setCollectionSuccessMsg('Collection details and cover image permanently saved!');
        setTimeout(() => {
          setEditingCollection(null);
          setCollectionSuccessMsg(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to save collection:', err);
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleMoveCollection = async (colId: string, direction: 'up' | 'down') => {
    const sorted = [...collections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((c) => c.id === colId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sorted.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = sorted[index];
    sorted[index] = sorted[targetIndex];
    sorted[targetIndex] = temp;

    const newOrder = sorted.map((c) => c.id);
    await fetch('/api/collections/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder }),
    });
    onRefreshData();
  };

  const handleBookCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Test PayPal Connection (Section 5)
  const handleTestPayPal = async () => {
    setIsTestingPayPal(true);
    setPayPalTestResult(null);
    try {
      const res = await fetch('/api/paypal/test-connection', { method: 'POST' });
      const data = await res.json();
      setPayPalTestResult(data);
    } catch (e: any) {
      setPayPalTestResult({ connected: false, message: e.message || 'Connection test error.' });
    } finally {
      setIsTestingPayPal(false);
    }
  };

  // Test Cloudflare R2 Connection (Section 9)
  const handleTestR2Connection = async () => {
    setIsTestingR2(true);
    setR2TestResult(null);
    try {
      const res = await fetch('/api/r2/test-connection', { method: 'POST' });
      const data = await res.json();
      setR2TestResult(data);
    } catch (e: any) {
      setR2TestResult({
        success: false,
        connected: false,
        message: e.message || 'Network error executing diagnostic test.',
      });
    } finally {
      setIsTestingR2(false);
    }
  };

  // AI Suggestions by Collection (Section 2)
  const handleGenerateSuggestionsByCollection = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const res = await fetch('/api/ai/suggestions-by-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: selectedColForSuggestion }),
      });
      const data = await res.json();
      setBookSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('Suggestions error:', e);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Wide AI Suggestions (Section 2)
  const handleGenerateWideSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const res = await fetch('/api/ai/suggestions-wide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: customTopic || wideTopic }),
      });
      const data = await res.json();
      setBookSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('Wide suggestions error:', e);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Prepare full manuscript from suggestion or custom topic (Section 2)
  const handleCreateDraftFromSuggestion = async (sug: BookSuggestion) => {
    setSelectedSuggestion(sug);
    setIsGeneratingManuscript(true);
    try {
      const chapters: Chapter[] = sug.proposedChapters.map((chapTitle, idx) => ({
        id: `chap-${Date.now()}-${idx}`,
        chapterNumber: idx + 1,
        title: chapTitle,
        content: `When we pause to consider the deeper architecture of ${sug.title}, truth emerges not as an abstract hypothesis, but as a living anchor for the human spirit. In this chapter, we explore how ${sug.mainSubject} shapes our everyday reactions, our interior resilience, and our courage to live deliberately. Through patient contemplation, we unbind old anxieties and construct a grounded, unyielding peace.`,
      }));

      const res = await fetch('/api/ai/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: sug.mainSubject,
          collectionId: sug.suggestedCollectionId,
          title: sug.title,
          subtitle: sug.subtitle,
          description: sug.explanation,
          price: sug.suggestedPrice || 19.99,
          chapters,
          coverUrl: '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
        }),
      });

      const data = await res.json();
      if (data.draft) {
        setDrafts((prev) => [data.draft, ...prev]);
        setActiveDraft(data.draft);
      }
    } catch (e) {
      console.error('Manuscript creation error:', e);
    } finally {
      setIsGeneratingManuscript(false);
    }
  };

  // Regenerate single section without losing the rest of manuscript (Section 2)
  const handleRegenerateChapter = async (chapNumber: number, chapTitle: string) => {
    if (!activeDraft) return;
    setRegeneratingChapterNum(chapNumber);
    try {
      const res = await fetch(`/api/ai/drafts/${activeDraft.id}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterNumber: chapNumber,
          title: chapTitle,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setActiveDraft(data.draft);
        setDrafts((prev) => prev.map((d) => (d.id === data.draft.id ? data.draft : d)));
      }
    } catch (e) {
      console.error('Regeneration error:', e);
    } finally {
      setRegeneratingChapterNum(null);
    }
  };

  // Explicit Mandatory Approval Workflow (Section 2)
  const handleApproveDraft = async (draftId: string) => {
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}/approve-publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Publisher Approval Granted! "${data.book.title}" is now officially published in the bookstore.`);
        setActiveDraft(null);
        fetch('/api/ai/drafts').then((r) => r.json()).then((d) => setDrafts(d.drafts || []));
        onRefreshData();
      }
    } catch (e) {
      console.error('Approve publish error:', e);
    }
  };

  // Database Backup Create (Section 11)
  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' });
      const data = await res.json();
      if (data.backup) {
        setBackups((prev) => [data.backup, ...prev]);
        alert('Database snapshot created successfully.');
      }
    } catch (e) {
      console.error('Backup error:', e);
    }
  };

  // Convert ebook to audiobook (Section 3)
  const handleConvertBookToAudio = async (book: Book) => {
    try {
      const res = await fetch('/api/audiobook/create-from-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, voice: selectedVoice }),
      });
      const data = await res.json();
      if (data.project) {
        setAudiobookProjects((prev) => [data.project, ...prev]);
        setSelectedBookForAudio(book);
        alert(`Audiobook project initialized for "${book.title}". You can now synthesize chapters.`);
      }
    } catch (e) {
      console.error('Convert to audiobook error:', e);
    }
  };

  // Audio Voice Preview
  const handlePreviewVoice = async (voiceName: string) => {
    setIsPreviewingVoice(true);
    try {
      const res = await fetch('/api/audiobook/preview-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: voiceName }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        if (currentPlayingAudio) currentPlayingAudio.pause();
        const audio = new Audio(data.audioUrl);
        audio.play();
        setCurrentPlayingAudio(audio);
      }
    } catch (e) {
      console.error('Voice preview failed:', e);
    } finally {
      setIsPreviewingVoice(false);
    }
  };

  // Synthesize Real Chapter Audio
  const handleGenerateChapterAudio = async (chap: Chapter) => {
    if (!selectedBookForAudio) return;
    setGeneratingChapterId(chap.id);
    try {
      const res = await fetch('/api/audiobook/generate-chapter-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: chap.id,
          bookId: selectedBookForAudio.id,
          title: chap.title,
          content: chap.content,
          voice: selectedVoice,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setSelectedBookForAudio((prev) => {
          if (!prev) return null;
          const updated = prev.chapters.map((c) =>
            c.id === chap.id
              ? { ...c, audioUrl: data.audioUrl, audioDurationSeconds: data.durationSeconds, status: 'completed' as const }
              : c
          );
          return { ...prev, chapters: updated };
        });
        onRefreshData();
      }
    } catch (e) {
      console.error('Audio generation failed:', e);
    } finally {
      setGeneratingChapterId(null);
    }
  };

  const handlePlayChapterAudio = (audioUrl: string, chapId: string) => {
    if (playingChapterId === chapId && currentPlayingAudio) {
      currentPlayingAudio.pause();
      setPlayingChapterId(null);
      return;
    }
    if (currentPlayingAudio) currentPlayingAudio.pause();

    const audio = new Audio(audioUrl);
    audio.play();
    setCurrentPlayingAudio(audio);
    setPlayingChapterId(chapId);
    audio.onended = () => setPlayingChapterId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      <div className="bg-[#120722] border border-[#d4af37]/40 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl text-[#f5ebd7] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#d4af37]/25 flex items-center justify-between bg-gradient-to-r from-[#1c0a33] via-[#280e4a] to-[#1c0a33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ffd700] text-[#120722] flex items-center justify-center font-bold shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-base sm:text-xl font-bold text-[#ffd700]">
                Heartwoven Wonders · Master Publisher Control Centre
              </h2>
              <p className="text-[11px] text-[#c9b78e]">
                Complete Worldwide Store Administration · AI Publishing Studio · PayPal &amp; Cloudflare R2 Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Clearly Visible SETTINGS Button (Section 1) */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow ${
                activeTab === 'settings'
                  ? 'bg-[#ffd700] text-[#120722] border-[#ffd700]'
                  : 'bg-[#2f1352] text-[#fae8a4] border-[#d4af37]/50 hover:bg-[#431b73] hover:text-[#ffd700]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#fae8a4] hover:text-white hover:bg-white/10"
              title="Close Control Centre"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 px-6 py-2 bg-[#16072c] border-b border-[#d4af37]/15 overflow-x-auto text-xs">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'settings', label: 'Store Settings', icon: Settings },
              { id: 'products', label: 'Books & Products', icon: BookOpen },
              { id: 'collections', label: 'Eight Collections', icon: List },
              { id: 'ai-writer', label: 'AI Book-Writing Studio', icon: Sparkles },
              { id: 'audiobook', label: 'Audiobook Assistant', icon: Headphones },
              { id: 'paypal', label: 'PayPal Checkout', icon: CreditCard },
              { id: 'purchases', label: 'Customer Purchases', icon: DollarSign },
              { id: 'cloudflare-r2', label: 'Cloudflare R2 Storage', icon: Cloud },
              { id: 'policies', label: 'Policies & FAQ', icon: FileCheck },
              { id: 'author', label: 'About Sky Editor', icon: User },
              { id: 'backups', label: 'Backups & Recovery', icon: Database },
              { id: 'integrations', label: 'Required API Keys', icon: Key },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#3b1767] text-[#ffd700] border border-[#d4af37]/40 shadow-inner font-semibold'
                    : 'text-[#c9b78e] hover:text-[#ffd700] hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#1d0d36] border border-[#d4af37]/25">
                  <span className="text-[11px] uppercase tracking-wider text-[#fae8a4]">Total Published Books</span>
                  <div className="text-3xl font-bold font-mono text-[#ffd700] mt-1 tabular-nums">
                    {books.length}
                  </div>
                  <span className="text-xs text-[#a89679]">
                    {books.filter((b) => b.isPublished).length} Published · {drafts.length} AI Drafts Pending
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1d0d36] border border-[#d4af37]/25">
                  <span className="text-[11px] uppercase tracking-wider text-[#fae8a4]">Verified Customer Purchases</span>
                  <div className="text-3xl font-bold font-mono text-[#ffd700] mt-1 tabular-nums">
                    {purchases.length}
                  </div>
                  <span className="text-xs text-[#a89679]">
                    Total Revenue: ${purchases.reduce((acc, p) => acc + p.amount, 0).toFixed(2)} USD
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1d0d36] border border-[#d4af37]/25">
                  <span className="text-[11px] uppercase tracking-wider text-[#fae8a4]">Cloudflare R2 Bucket</span>
                  <div className="text-base font-bold font-mono text-[#ffd700] mt-1 truncate">
                    heartwoven-wonders-books
                  </div>
                  <span className="text-xs text-[#a89679]">Private S3-Compatible Foundation</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#1d0d36] border border-[#d4af37]/25">
                  <span className="text-[11px] uppercase tracking-wider text-[#fae8a4]">PayPal Checkout</span>
                  <div className="text-lg font-bold font-mono text-[#ffd700] mt-1">
                    {localSettings.paypal.environment.toUpperCase()}
                  </div>
                  <span className="text-xs text-[#a89679]">Trinidad &amp; Tobago Support Ready</span>
                </div>
              </div>

              {/* Quick Jump Action Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  onClick={() => setActiveTab('ai-writer')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#28114a] to-[#1c0c32] border border-[#d4af37]/35 text-left hover:border-[#ffd700] transition-all cursor-pointer group"
                >
                  <Sparkles className="w-6 h-6 text-[#ffd700] mb-2" />
                  <h4 className="font-cinzel text-base font-bold text-[#f5ebd7] group-hover:text-[#ffd700]">
                    AI Category Publishing &amp; Approval
                  </h4>
                  <p className="text-xs text-[#c9b78e] mt-1">
                    Generate book suggestions by collection or wide discovery, edit manuscripts, and enforce mandatory publisher approval before publishing.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('audiobook')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#28114a] to-[#1c0c32] border border-[#d4af37]/35 text-left hover:border-[#ffd700] transition-all cursor-pointer group"
                >
                  <Headphones className="w-6 h-6 text-[#ffd700] mb-2" />
                  <h4 className="font-cinzel text-base font-bold text-[#f5ebd7] group-hover:text-[#ffd700]">
                    AI Audiobook Production Assistant
                  </h4>
                  <p className="text-xs text-[#c9b78e] mt-1">
                    Convert completed ebooks, preview 5 narrator voices, generate genuine chapter audio with Gemini TTS, and audit audio quality.
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('paypal')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#28114a] to-[#1c0c32] border border-[#d4af37]/35 text-left hover:border-[#ffd700] transition-all cursor-pointer group"
                >
                  <CreditCard className="w-6 h-6 text-[#ffd700] mb-2" />
                  <h4 className="font-cinzel text-base font-bold text-[#f5ebd7] group-hover:text-[#ffd700]">
                    PayPal Integration &amp; Trinidad &amp; Tobago
                  </h4>
                  <p className="text-xs text-[#c9b78e] mt-1">
                    Configure PayPal REST API credentials, test connections, verify orders, and review currency handling for Trinidad &amp; Tobago.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB: STORE SETTINGS (Section 1) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                    Storefront Appearance &amp; Section Ordering
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Rearrange homepage sections, adjust royal purple and gold branding, and update official bookstore metadata.
                  </p>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl hover:brightness-110 flex items-center gap-1.5 shadow cursor-pointer"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save All Settings</span>
                    </>
                  )}
                </button>
              </div>

              {/* Branding & Visual Styling */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Royal Purple &amp; Gold Branding Palette
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#c9b78e]">Primary Royal Purple</span>
                    <input
                      type="text"
                      value={localSettings.visualStyling?.primaryPurple || '#291248'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          visualStyling: { ...localSettings.visualStyling, primaryPurple: e.target.value },
                        })
                      }
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-[#f5ebd7]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#c9b78e]">Gold Foil Accent</span>
                    <input
                      type="text"
                      value={localSettings.visualStyling?.goldAccent || '#ffd700'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          visualStyling: { ...localSettings.visualStyling, goldAccent: e.target.value },
                        })
                      }
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-[#f5ebd7]"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#c9b78e]">Display Typography Face</span>
                    <input
                      type="text"
                      value={localSettings.visualStyling?.displayFont || 'Cinzel'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          visualStyling: { ...localSettings.visualStyling, displayFont: e.target.value },
                        })
                      }
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-[#f5ebd7]"
                    />
                  </div>
                </div>
              </div>

              {/* Top Announcement Bar Text */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Top Announcement Strip Text
                </label>
                <input
                  type="text"
                  value={localSettings.announcementText}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, announcementText: e.target.value })
                  }
                  className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                />
              </div>

              {/* Hero Headings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Storefront Heading
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroHeading}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, heroHeading: e.target.value })
                    }
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Official Tagline
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroTagline}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, heroTagline: e.target.value })
                    }
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2.5 text-xs text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                  />
                </div>
              </div>

              {/* Homepage Section Reordering & Visibility */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Homepage Section Ordering &amp; Visibility Controls
                </label>
                <div className="space-y-2">
                  {localSettings.homepageSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-3.5 rounded-xl bg-[#1d0d36] border border-[#d4af37]/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#ffd700] font-bold">#{sec.order}</span>
                        <span className="font-semibold text-[#f5ebd7]">{sec.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSection(sec.id)}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            sec.visible
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                          }`}
                          title={sec.visible ? 'Visible on homepage' : 'Hidden from homepage'}
                        >
                          {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-[#271046] border border-white/10 text-[#fae8a4] hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === localSettings.homepageSections.length - 1}
                          className="p-1.5 rounded-lg bg-[#271046] border border-white/10 text-[#fae8a4] hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security & Admin Passcode */}
              <div className="space-y-2 pt-4 border-t border-[#d4af37]/20">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#ffd700]" />
                  <span>Admin Sanctuary Protection Passcode</span>
                </label>
                <input
                  type="text"
                  value={localSettings.adminPasscode || 'heartwoven2026'}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, adminPasscode: e.target.value })
                  }
                  className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2 text-xs text-[#f5ebd7]"
                />
              </div>
            </div>
          )}

          {/* TAB: AI BOOK-WRITING STUDIO & APPROVAL (Section 2) */}
          {activeTab === 'ai-writer' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-[#d4af37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Adult Nonfiction Publishing Studio</span>
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-[#f5ebd7] mt-1">
                    AI Book Creation, Editing &amp; Approval Workspace
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Suggest books specifically by collection or discover wide subjects. Inspect and edit complete manuscripts with mandatory publisher approval before publishing.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#1b0a31] p-1 rounded-xl border border-[#d4af37]/30 text-xs">
                  <button
                    onClick={() => setSuggestionMode('by_collection')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      suggestionMode === 'by_collection'
                        ? 'bg-[#ffd700] text-[#120722]'
                        : 'text-[#d6c7a7] hover:text-[#ffd700]'
                    }`}
                  >
                    By Collection
                  </button>
                  <button
                    onClick={() => setSuggestionMode('wide')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      suggestionMode === 'wide'
                        ? 'bg-[#ffd700] text-[#120722]'
                        : 'text-[#d6c7a7] hover:text-[#ffd700]'
                    }`}
                  >
                    Wide Discovery
                  </button>
                </div>
              </div>

              {/* Suggestions Controls */}
              {suggestionMode === 'by_collection' ? (
                <div className="p-4 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/25 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#fae8a4]">
                    Select One of the Eight Collections for Focused Suggestions
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setSelectedColForSuggestion(col.id)}
                        className={`p-2.5 rounded-xl text-left text-xs border transition-all cursor-pointer truncate ${
                          selectedColForSuggestion === col.id
                            ? 'bg-[#3b1767] border-[#ffd700] text-[#ffd700] font-bold shadow'
                            : 'bg-[#150727] border-white/5 text-[#c9b78e] hover:border-[#d4af37]/40'
                        }`}
                      >
                        {col.name}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleGenerateSuggestionsByCollection}
                      disabled={isGeneratingSuggestions}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingSuggestions ? 'Generating Suggestions...' : 'Refresh Suggestions for Collection'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/25 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#fae8a4]">
                    Wide AI Book Discovery Across Diverse Adult Subjects
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {WIDE_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => {
                          setWideTopic(topic);
                          setCustomTopic('');
                        }}
                        className={`p-2 rounded-xl text-left text-xs border transition-all cursor-pointer truncate ${
                          wideTopic === topic && !customTopic
                            ? 'bg-[#3b1767] border-[#ffd700] text-[#ffd700] font-bold shadow'
                            : 'bg-[#150727] border-white/5 text-[#c9b78e] hover:border-[#d4af37]/40'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Or enter any custom topic (e.g. Cognitive Psychology of Decision Making)..."
                      className="flex-1 bg-[#130623] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-[#f5ebd7]"
                    />
                    <button
                      onClick={handleGenerateWideSuggestions}
                      disabled={isGeneratingSuggestions}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingSuggestions ? 'Analyzing...' : 'Discover Book Concepts'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Book Suggestions Grid with Detailed Information */}
              {bookSuggestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd700] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Generated Book Concepts &amp; Collection Assignment</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookSuggestions.map((sug) => {
                      const assignedCol = collections.find((c) => c.id === sug.suggestedCollectionId);

                      return (
                        <div
                          key={sug.id}
                          className="p-5 rounded-2xl bg-[#1c0c32] border border-[#d4af37]/30 flex flex-col justify-between space-y-3 shadow-lg hover:border-[#ffd700] transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-[#fae8a4] mb-1 font-mono">
                              <span>{sug.mainSubject}</span>
                              <span className="font-bold text-[#ffd700]">${sug.suggestedPrice?.toFixed(2)}</span>
                            </div>

                            <h5 className="font-cinzel text-base font-bold text-[#ffd700] leading-snug">
                              {sug.title}
                            </h5>
                            <p className="text-xs text-[#fae8a4] italic mt-0.5">{sug.subtitle}</p>
                            <p className="text-xs text-[#c9b78e] mt-2 leading-relaxed">{sug.explanation}</p>

                            <div className="mt-3 p-2 rounded-xl bg-[#120722] border border-white/5 text-[11px] space-y-1">
                              <div className="text-[#e5c158] font-semibold">
                                Intended Audience: <span className="text-[#d6c7a7] font-normal">{sug.intendedAudience}</span>
                              </div>
                              <div className="text-[#e5c158] font-semibold">
                                Assigned Collection: <span className="text-[#ffd700] font-bold">{assignedCol?.name || sug.suggestedCollectionId}</span>
                              </div>
                              <div className="text-[10px] text-[#a89679] italic">
                                {sug.collectionReasoning}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/10 flex justify-end">
                            <button
                              onClick={() => handleCreateDraftFromSuggestion(sug)}
                              disabled={isGeneratingManuscript}
                              className="w-full py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isGeneratingManuscript ? 'Preparing Manuscript...' : 'Prepare Complete Book'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DRAFT WORKSPACE & MANDATORY APPROVAL QUEUE (Section 2) */}
              <div className="pt-6 border-t border-[#d4af37]/25 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-cinzel text-base font-bold text-[#ffd700] flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      <span>Pending Publisher Approval Queue ({drafts.filter((d) => d.status === 'pending_approval').length})</span>
                    </h4>
                    <p className="text-[11px] text-[#c9b78e]">
                      Every book requires your explicit inspection and approval before publication to the live store.
                    </p>
                  </div>
                </div>

                {drafts.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#17092b] border border-dashed border-[#d4af37]/20 text-center text-xs text-[#a89679]">
                    No book drafts currently pending review. Select a suggestion above to generate a complete manuscript draft.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {drafts.map((draft) => (
                      <button
                        key={draft.id}
                        onClick={() => setActiveDraft(draft)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                          activeDraft?.id === draft.id
                            ? 'bg-[#3b1767] border-[#ffd700] text-[#ffd700] shadow'
                            : 'bg-[#180a2d] border-white/10 text-[#d6c7a7] hover:border-[#d4af37]/35'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span>v{draft.version} · {draft.chapters.length} Chaps</span>
                          <span className={`font-bold uppercase ${draft.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {draft.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h5 className="font-cinzel text-sm font-bold text-[#f5ebd7] truncate mt-1">
                          {draft.title}
                        </h5>
                        <p className="text-[11px] text-[#fae8a4]/75 truncate">{draft.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Draft Full Editing Workspace */}
                {activeDraft && (
                  <div className="p-6 rounded-3xl bg-[#1a0c30] border-2 border-[#ffd700]/70 space-y-5 shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-[#d4af37]/20 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd700] bg-[#291248] px-2.5 py-0.5 rounded-full border border-[#d4af37]/30">
                            Version {activeDraft.version}
                          </span>
                          <span className="text-[11px] text-[#c9b78e]">
                            Last revised {new Date(activeDraft.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h3 className="font-cinzel text-2xl font-bold text-[#ffd700] mt-1.5">
                          {activeDraft.title}
                        </h3>
                        <p className="text-xs text-[#fae8a4] italic">{activeDraft.subtitle}</p>
                      </div>

                      {/* Approval Action */}
                      <div className="flex items-center gap-2">
                        {activeDraft.status !== 'approved' && (
                          <button
                            onClick={() => handleApproveDraft(activeDraft.id)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-[#091b16] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve &amp; Publish To Bookstore</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata Editing Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[#fae8a4] font-semibold">Title</label>
                        <input
                          type="text"
                          value={activeDraft.title}
                          onChange={(e) => setActiveDraft({ ...activeDraft, title: e.target.value })}
                          className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#fae8a4] font-semibold">Assigned Collection</label>
                        <select
                          value={activeDraft.collectionId}
                          onChange={(e) => setActiveDraft({ ...activeDraft, collectionId: e.target.value })}
                          className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                        >
                          {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#fae8a4] font-semibold">Selling Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={activeDraft.price}
                          onChange={(e) => setActiveDraft({ ...activeDraft, price: parseFloat(e.target.value) || 19.99 })}
                          className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                        />
                      </div>
                    </div>

                    {/* Manuscript Chapters with Individual Regeneration Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">
                          Manuscript Chapters &amp; Section Regeneration
                        </h4>
                        <span className="text-[11px] text-[#a89679]">
                          Regenerate individual chapters without modifying the rest
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {activeDraft.chapters.map((chap) => (
                          <div
                            key={chap.id}
                            className="p-3.5 rounded-xl bg-[#220d3d]/70 border border-white/10 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#ffd700]">
                                Chapter {chap.chapterNumber}: {chap.title}
                              </span>
                              <button
                                onClick={() => handleRegenerateChapter(chap.chapterNumber, chap.title)}
                                disabled={regeneratingChapterNum === chap.chapterNumber}
                                className="px-2.5 py-1 rounded bg-[#371661] text-[#ffd700] hover:bg-[#481c80] text-[10px] font-semibold flex items-center gap-1 cursor-pointer border border-[#d4af37]/30"
                              >
                                <RotateCw className={`w-3 h-3 ${regeneratingChapterNum === chap.chapterNumber ? 'animate-spin' : ''}`} />
                                <span>{regeneratingChapterNum === chap.chapterNumber ? 'Regenerating...' : 'Regenerate Chapter'}</span>
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={chap.content}
                              onChange={(e) => {
                                const newChapters = activeDraft.chapters.map((c) =>
                                  c.id === chap.id ? { ...c, content: e.target.value } : c
                                );
                                setActiveDraft({ ...activeDraft, chapters: newChapters });
                              }}
                              className="w-full bg-[#120722] border border-white/5 rounded-lg p-2 text-[11px] text-[#e6d8ba] focus:outline-none focus:border-[#ffd700]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Draft Version History Recovery (Section 11) */}
                    {activeDraft.history && activeDraft.history.length > 0 && (
                      <div className="pt-3 border-t border-white/10 text-xs">
                        <span className="text-[10px] font-bold uppercase text-[#fae8a4] flex items-center gap-1 mb-2">
                          <History className="w-3.5 h-3.5" />
                          <span>Version History &amp; Revision Log</span>
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {activeDraft.history.map((h, i) => (
                            <div key={i} className="px-2.5 py-1.5 rounded-lg bg-[#140726] border border-white/5 shrink-0 text-[10px]">
                              <div className="font-bold text-[#ffd700]">v{h.version} · {h.note}</div>
                              <div className="text-[#a89679]">{new Date(h.timestamp).toLocaleTimeString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: AI AUDIOBOOK ASSISTANT (Section 3) */}
          {activeTab === 'audiobook' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-[#d4af37]/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                    <Headphones className="w-4 h-4" />
                    <span>Gemini 3.8 Flash-Lite TTS Production Engine</span>
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-[#f5ebd7] mt-1">
                    AI Audiobook Production Assistant
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Convert completed books, synthesize actual spoken narration chapter-by-chapter, verify audio duration, and approve complete audiobooks.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#a89679]">Engine</span>
                  <div className="text-xs font-semibold text-[#ffd700]">gemini-3.8-flash-lite-tts</div>
                </div>
              </div>

              {/* Step 1: Select or Convert Book */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Step 1: Select Active Audiobook Project
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {books.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBookForAudio(b)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedBookForAudio?.id === b.id
                          ? 'bg-[#3b1767] border-[#ffd700] text-[#ffd700] font-bold shadow'
                          : 'bg-[#1a0a2f] border-white/10 text-[#d6c7a7] hover:border-[#d4af37]/40'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate">{b.title}</div>
                      <div className="text-[10px] text-[#a89679]">
                        {b.chapters.length} Chapters · {b.audioDurationSeconds || 0}s Generated
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Narrator Voice Selection & Live Preview */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Step 2: Choose Narrator Voice &amp; Hear Sample
                  </label>
                  <button
                    onClick={() => handlePreviewVoice(selectedVoice)}
                    disabled={isPreviewingVoice}
                    className="text-xs text-[#ffd700] flex items-center gap-1.5 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPreviewingVoice ? 'animate-bounce' : ''}`} />
                    <span>{isPreviewingVoice ? 'Synthesizing Spoken Sample...' : 'Hear Spoken Voice Sample'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedVoice === v.id
                          ? 'bg-[#3d186b] border-[#ffd700] text-[#ffd700] shadow'
                          : 'bg-[#17092b] border-white/10 text-[#c9b78e] hover:border-[#d4af37]/40'
                      }`}
                    >
                      <div className="font-bold text-xs">{v.id}</div>
                      <div className="text-[10px] text-[#a89679] line-clamp-1">{v.tone}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Chapter Synthesis & Quality Control */}
              {selectedBookForAudio && (
                <div className="pt-4 border-t border-[#d4af37]/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cinzel text-base font-bold text-[#ffd700]">
                        Audio Chapters for: {selectedBookForAudio.title}
                      </h4>
                      <p className="text-[11px] text-[#c9b78e]">
                        Quality Control: Listen to actual audio, verify duration, or retry failed chapters.
                      </p>
                    </div>

                    <div className="text-xs font-mono text-[#fae8a4]">
                      Total Duration: {selectedBookForAudio.audioDurationSeconds || 0} seconds
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {selectedBookForAudio.chapters.map((chap) => {
                      const hasAudio = Boolean(chap.audioUrl);
                      const isGenerating = generatingChapterId === chap.id;
                      const isPlaying = playingChapterId === chap.id;

                      return (
                        <div
                          key={chap.id}
                          className="p-4 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#ffd700]">
                                Chapter {chap.chapterNumber}: {chap.title}
                              </span>
                              {hasAudio && (
                                <span className="bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  Real Audio Ready ({chap.audioDurationSeconds}s)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#a89679] line-clamp-1 mt-0.5">
                              {chap.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {hasAudio ? (
                              <>
                                <button
                                  onClick={() => handlePlayChapterAudio(chap.audioUrl!, chap.id)}
                                  className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
                                    isPlaying
                                      ? 'bg-[#ffd700] text-[#120722] border-[#ffd700]'
                                      : 'bg-[#2f1452] text-[#ffd700] border-[#d4af37]/40 hover:bg-[#431c73]'
                                  }`}
                                >
                                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
                                </button>

                                <button
                                  onClick={() => handleGenerateChapterAudio(chap)}
                                  disabled={isGenerating}
                                  className="p-1.5 rounded-lg bg-[#240f41] border border-white/10 text-[#fae8a4] hover:text-white cursor-pointer"
                                  title="Regenerate Chapter Audio"
                                >
                                  <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleGenerateChapterAudio(chap)}
                                disabled={isGenerating}
                                className="px-4 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs rounded-lg hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow"
                              >
                                <Headphones className={`w-3.5 h-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
                                <span>{isGenerating ? 'Synthesizing...' : 'Generate Real Audio'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PAYPAL CHECKOUT & TRINIDAD & TOBAGO (Section 5) */}
          {activeTab === 'paypal' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-3 border-b border-[#d4af37]/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                    <CreditCard className="w-4 h-4" />
                    <span>Global Payments &amp; Settlement Architecture</span>
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-[#f5ebd7] mt-1">
                    PayPal Payment Configuration &amp; Verification
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Secure backend order creation, capture, and purchase verification for readers worldwide.
                  </p>
                </div>

                <button
                  onClick={handleTestPayPal}
                  disabled={isTestingPayPal}
                  className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50 shadow cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingPayPal ? 'animate-spin' : ''}`} />
                  <span>{isTestingPayPal ? 'Testing PayPal API...' : 'Test PayPal Connection'}</span>
                </button>
              </div>

              {payPalTestResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    payPalTestResult.connected
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {payPalTestResult.connected ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{payPalTestResult.connected ? 'PayPal Verified' : 'PayPal Diagnostic'}</span>
                  </div>
                  <p>{payPalTestResult.message}</p>
                </div>
              )}

              {/* Trinidad and Tobago Confirmation Box */}
              <div className="p-5 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/40 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffd700]">
                  <Globe className="w-4 h-4" />
                  <span>Trinidad &amp; Tobago Merchant Payment Support &amp; Currency Analysis</span>
                </div>
                <p className="text-xs text-[#e6d8ba] leading-relaxed">
                  <strong>Confirmation:</strong> PayPal Premier and Business accounts in <strong>Trinidad and Tobago</strong> are supported for receiving payments worldwide. However, because the Trinidad and Tobago Dollar (TTD) is not a held PayPal currency, store orders must be created and settled in a supported international currency such as <strong>USD</strong>.
                </p>
                <div className="p-3 rounded-xl bg-[#120722] border border-white/5 text-[11px] text-[#c9b78e] space-y-1">
                  <div>• <strong>Checkout Currency:</strong> USD (United States Dollar) is active and standard worldwide.</div>
                  <div>• <strong>Merchant Withdrawal:</strong> Funds received in your Trinidad &amp; Tobago PayPal balance can be withdrawn to an eligible local Visa card (via card transfer / Visa Direct) or a linked US dollar bank account.</div>
                </div>
              </div>

              {/* Credentials Configuration */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#fae8a4]">
                  PayPal REST API Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[#c9b78e]">PAYPAL_CLIENT_ID</label>
                    <input
                      type="text"
                      value={localSettings.paypal.clientId}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          paypal: { ...localSettings.paypal, clientId: e.target.value },
                        })
                      }
                      placeholder="e.g. A21AA..."
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-[#f5ebd7]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c9b78e]">PAYPAL_CLIENT_SECRET</label>
                    <input
                      type="password"
                      value={localSettings.paypal.clientSecret}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          paypal: { ...localSettings.paypal, clientSecret: e.target.value },
                        })
                      }
                      placeholder="e.g. E..."
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-[#f5ebd7]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[#c9b78e]">Environment</label>
                    <select
                      value={localSettings.paypal.environment}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          paypal: {
                            ...localSettings.paypal,
                            environment: e.target.value as 'sandbox' | 'live',
                          },
                        })
                      }
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-[#f5ebd7]"
                    >
                      <option value="sandbox">Sandbox (Testing &amp; Simulation)</option>
                      <option value="live">Live (Real Worldwide Payments)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c9b78e]">Settlement Currency</label>
                    <input
                      type="text"
                      value={localSettings.paypal.currency}
                      readOnly
                      className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-[#ffd700] font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save PayPal Configuration
                </button>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMER PURCHASES AUDIT (Section 4 & 6) */}
          {activeTab === 'purchases' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-[#d4af37]/20 flex items-center justify-between">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                    Verified Customer Purchases &amp; Orders Archive
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Permanent financial audit trail. Customer purchase records are never deleted when products are removed.
                  </p>
                </div>
              </div>

              <div className="border border-[#d4af37]/25 rounded-2xl overflow-hidden bg-[#180a2d]">
                <table className="w-full text-left text-xs text-[#f5ebd7]">
                  <thead className="bg-[#240e3f] text-[#ffd700] uppercase font-semibold text-[10px] tracking-wider border-b border-[#d4af37]/20">
                    <tr>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Book Title</th>
                      <th className="p-3.5">Formats</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d4af37]/10 font-mono text-[11px]">
                    {purchases.map((pur) => (
                      <tr key={pur.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 text-[#fae8a4] truncate max-w-[120px]">
                          {pur.paypalOrderId}
                        </td>
                        <td className="p-3.5 font-sans">
                          <div className="font-semibold text-[#f5ebd7]">{pur.customerName || 'Reader'}</div>
                          <div className="text-[10px] text-[#a89679]">{pur.customerEmail}</div>
                        </td>
                        <td className="p-3.5 font-sans font-semibold text-[#ffd700]">
                          {pur.bookTitle}
                        </td>
                        <td className="p-3.5 font-sans text-[10px]">
                          {pur.formats.join(' · ')}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400 tabular-nums">
                          ${pur.amount.toFixed(2)} {pur.currency}
                        </td>
                        <td className="p-3.5 text-[#a89679]">
                          {new Date(pur.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                            {pur.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DATABASE BACKUPS & RECOVERY (Section 11) */}
          {activeTab === 'backups' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-3 border-b border-[#d4af37]/20 flex items-center justify-between">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                    Database Persistence, Backups &amp; Recovery
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Create full snapshots of the entire bookstore catalog, customer purchases, drafts, and settings.
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href="/api/admin/backups/export"
                    className="px-3.5 py-2 rounded-xl bg-[#291248] border border-[#d4af37]/40 text-[#ffd700] hover:bg-[#3d186b] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </a>

                  <button
                    onClick={handleCreateBackup}
                    className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl shadow cursor-pointer"
                  >
                    Create Snapshot
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#fae8a4]">
                  Saved Snapshots Archive ({backups.length})
                </h4>

                {backups.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#1b0a31] border border-dashed border-[#d4af37]/20 text-center text-xs text-[#a89679]">
                    No snapshots created yet. Click "Create Snapshot" above to preserve a point-in-time backup.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-[#1d0d36] border border-[#d4af37]/25 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#ffd700]">{b.description}</div>
                          <div className="text-[10px] text-[#a89679]">
                            {new Date(b.timestamp).toLocaleString()} · {(b.sizeBytes / 1024).toFixed(1)} KB
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (confirm('Restore database from this snapshot? Current state will be replaced.')) {
                              const res = await fetch(`/api/admin/backups/${b.id}/restore`, { method: 'POST' });
                              const data = await res.json();
                              alert(data.message || 'Restored.');
                              onRefreshData();
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#371661] text-[#ffd700] border border-[#d4af37]/35 text-xs font-semibold hover:bg-[#4a1c84] cursor-pointer"
                        >
                          Restore Snapshot
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: STORE POLICIES (Section 13) */}
          {activeTab === 'policies' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-3 border-b border-[#d4af37]/20">
                <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                  Store Policies &amp; Customer Information Pages
                </h3>
                <p className="text-xs text-[#c9b78e]">
                  Edit Terms of Service, Privacy Policy, Digital Delivery Policy, Refunds, and Frequently Asked Questions.
                </p>
              </div>

              <div className="space-y-4">
                {(localSettings.policies || []).map((pol) => (
                  <div key={pol.id} className="p-4 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/25 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-sm font-bold text-[#ffd700]">{pol.title}</span>
                      <span className="text-[10px] text-[#a89679]">Slug: /{pol.slug}</span>
                    </div>
                    <textarea
                      rows={4}
                      value={pol.content}
                      onChange={(e) => {
                        const updated = localSettings.policies.map((p) =>
                          p.id === pol.id ? { ...p, content: e.target.value } : p
                        );
                        setLocalSettings({ ...localSettings, policies: updated });
                      }}
                      className="w-full bg-[#120722] border border-[#d4af37]/25 rounded-xl p-3 text-xs text-[#e6d8ba] focus:outline-none focus:border-[#ffd700]"
                    />
                  </div>
                ))}

                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Save All Policies
                </button>
              </div>
            </div>
          )}

          {/* TAB: REQUIRED API KEYS & EXTERNAL INTEGRATIONS (Section 10) */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                  <Key className="w-4 h-4" />
                  <span>Integration Auditor &amp; Secrets Checklist</span>
                </div>
                <h3 className="font-cinzel text-xl font-bold text-[#f5ebd7] mt-1">
                  Required API Keys &amp; External Services
                </h3>
                <p className="text-xs text-[#c9b78e]">
                  Transparent audit of all external providers, credentials, costs, and free tier limits.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Google Gemini API */}
                <div className="p-5 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-[#ffd700]">1. Google Gemini AI API (`GEMINI_API_KEY`)</div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Active In Secrets
                    </span>
                  </div>
                  <p className="text-xs text-[#e6d8ba]">
                    <strong>Purpose:</strong> Powers the AI Book-Writing Assistant (concept suggestions, full manuscript drafts, chapter extraction) and AI Audiobook Narration (`gemini-3.8-flash-lite-tts`).
                  </p>
                  <div className="text-[11px] text-[#c9b78e] space-y-0.5 pt-1">
                    <div>• <strong>Where to obtain:</strong> Google AI Studio (<a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#ffd700] underline">aistudio.google.com</a>).</div>
                    <div>• <strong>Where to enter:</strong> In AI Studio Settings &gt; Secrets panel under <code>GEMINI_API_KEY</code>.</div>
                    <div>• <strong>Cost &amp; Limits:</strong> Free tier quota available for text and TTS; pay-as-you-go billing available for scale.</div>
                  </div>
                </div>

                {/* 2. Cloudflare R2 Storage */}
                <div className="p-5 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-[#ffd700]">2. Cloudflare R2 Private Storage</div>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${r2Status?.configured ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : 'text-amber-400 bg-amber-950/40 border-amber-500/30'}`}>
                      {r2Status?.configured ? 'Configured' : 'Credentials Ready'}
                    </span>
                  </div>
                  <p className="text-xs text-[#e6d8ba]">
                    <strong>Target Bucket:</strong> <code>heartwoven-wonders-books</code> (Private S3-Compatible Storage).
                  </p>
                  <div className="text-[11px] text-[#c9b78e] space-y-0.5 pt-1">
                    <div>• <strong>Required Secrets:</strong> <code>CLOUDFLARE_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>, <code>R2_SECRET_ACCESS_KEY</code>, <code>R2_ENDPOINT</code>.</div>
                    <div>• <strong>Where to obtain:</strong> Cloudflare Dashboard &gt; R2 Object Storage &gt; Manage R2 API Tokens.</div>
                    <div>• <strong>Cost &amp; Limits:</strong> 10 GB free monthly storage, $0.00 egress fees.</div>
                  </div>
                </div>

                {/* 3. PayPal Payments */}
                <div className="p-5 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-[#ffd700]">3. PayPal Checkout API v2</div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Sandbox Simulation / Live Ready
                    </span>
                  </div>
                  <p className="text-xs text-[#e6d8ba]">
                    <strong>Purpose:</strong> Server-side verified order creation and capture for worldwide customers.
                  </p>
                  <div className="text-[11px] text-[#c9b78e] space-y-0.5 pt-1">
                    <div>• <strong>Required Secrets:</strong> <code>PAYPAL_CLIENT_ID</code>, <code>PAYPAL_CLIENT_SECRET</code>, <code>PAYPAL_ENVIRONMENT</code>.</div>
                    <div>• <strong>Where to obtain:</strong> PayPal Developer Portal (<a href="https://developer.paypal.com" target="_blank" rel="noreferrer" className="text-[#ffd700] underline">developer.paypal.com</a>) &gt; Apps &amp; Credentials.</div>
                    <div>• <strong>Trinidad &amp; Tobago Support:</strong> Fully supported for merchant checkout in standard currency (USD).</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback to other tabs (collections, products, author, cloudflare-r2) */}
          {/* Enhanced Collections Manager (Requirement 4) */}
          {activeTab === 'collections' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20 flex-wrap gap-4">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                    Eight Sacred Collections Manager
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Full control over every collection cover image, name, description, visual frame shape, and ordering.
                  </p>
                </div>
                <div className="text-xs text-[#fae8a4] bg-[#220d3c] px-3 py-1.5 rounded-xl border border-[#d4af37]/30">
                  8 Collections Preserved · Click &quot;Manage Image &amp; Details&quot; to Edit
                </div>
              </div>

              {collectionSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{collectionSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...collections].sort((a, b) => a.order - b.order).map((col, idx, arr) => (
                  <div
                    key={col.id}
                    className="p-5 rounded-2xl bg-gradient-to-b from-[#1e0d37] to-[#120722] border border-[#d4af37]/35 flex flex-col justify-between space-y-4 shadow-lg hover:border-[#ffd700]/60 transition-all"
                  >
                    <div className="flex gap-4">
                      {/* Cover Thumbnail / Emblem */}
                      <div className="w-24 h-32 rounded-xl overflow-hidden bg-[#0c0416] shrink-0 border border-[#d4af37]/40 shadow-inner relative group flex items-center justify-center">
                        {col.coverImage ? (
                          <img
                            src={col.coverImage}
                            alt={col.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[#1d0a33]">
                            <Sparkles className="w-6 h-6 text-[#ffd700] mb-1" />
                            <span className="text-[9px] text-[#fae8a4] font-cinzel">No Image</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/75 text-[#ffd700]">
                          0{col.order}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between text-[10px] uppercase font-mono text-[#fae8a4]/70">
                          <span>Room 0{col.order}</span>
                          <span className="text-[#ffd700]">{col.visualTheme.frameShape}</span>
                        </div>
                        <h4 className="font-cinzel text-sm font-bold text-[#ffd700] leading-snug">
                          {col.name}
                        </h4>
                        <p className="text-xs text-[#c9b78e] line-clamp-2 leading-relaxed">
                          {col.description}
                        </p>
                        <div className="pt-1 flex items-center gap-2 text-[10px] text-[#e5c158]">
                          <span className="px-2 py-0.5 rounded bg-[#281146] border border-white/5">
                            {books.filter((b) => b.collectionId === col.id).length} Volumes
                          </span>
                          <span>·</span>
                          <span className={col.showOnHomepage ? 'text-emerald-400' : 'text-gray-400'}>
                            {col.showOnHomepage ? 'Visible on Homepage' : 'Hidden on Homepage'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Control Actions */}
                    <div className="pt-3 border-t border-[#d4af37]/20 flex items-center justify-between text-xs flex-wrap gap-2">
                      {/* Move Up / Down */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveCollection(col.id, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-[#281146] hover:bg-[#381661] text-[#ffd700] disabled:opacity-30 disabled:pointer-events-none border border-white/5 cursor-pointer"
                          title="Move Collection Up in Order"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveCollection(col.id, 'down')}
                          disabled={idx === arr.length - 1}
                          className="p-1.5 rounded-lg bg-[#281146] hover:bg-[#381661] text-[#ffd700] disabled:opacity-30 disabled:pointer-events-none border border-white/5 cursor-pointer"
                          title="Move Collection Down in Order"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-[#fae8a4] ml-1">Pos {col.order}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick Image Delete */}
                        {col.coverImage && (
                          <button
                            onClick={async () => {
                              if (confirm(`Remove cover image for "${col.name}"? The collection itself and its books will remain completely safe.`)) {
                                await fetch(`/api/collections/${col.id}/image`, { method: 'DELETE' });
                                onRefreshData();
                              }
                            }}
                            className="text-[11px] text-rose-300 hover:text-rose-100 hover:underline cursor-pointer"
                          >
                            Delete Image
                          </button>
                        )}

                        {/* Open Complete Editor Modal */}
                        <button
                          onClick={() => handleOpenEditCollection(col)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-[11px] uppercase tracking-wider shadow hover:brightness-110 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Manage Image &amp; Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                    Product &amp; Book Catalogue Management
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Create, edit, publish/unpublish, and safely delete books and audio files.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingBook(null);
                    setIsCreatingBook(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Product</span>
                </button>
              </div>

              <div className="border border-[#d4af37]/25 rounded-2xl overflow-hidden bg-[#180a2d]">
                {books.length === 0 ? (
                  <div className="text-center py-16 px-6 space-y-3">
                    <BookOpen className="w-12 h-12 text-[#d4af37]/40 mx-auto" />
                    <h4 className="font-cinzel text-base font-bold text-[#f5ebd7]">
                      The Bookstore is Completely Empty
                    </h4>
                    <p className="text-xs text-[#a89679] max-w-md mx-auto leading-relaxed">
                      All sample, demonstration, test, and placeholder books have been removed as instructed. Click &quot;Create Product&quot; to author your own book and assign it to any of the eight collections.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setEditingBook(null);
                          setIsCreatingBook(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Your First Book</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-[#f5ebd7]">
                    <thead className="bg-[#240e3f] text-[#ffd700] uppercase font-semibold text-[10px] tracking-wider border-b border-[#d4af37]/20">
                      <tr>
                        <th className="p-3.5">Cover</th>
                        <th className="p-3.5">Title &amp; Author</th>
                        <th className="p-3.5">Collection</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Formats</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d4af37]/10">
                      {books.map((book) => (
                        <tr key={book.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3.5">
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              referrerPolicy="no-referrer"
                              className="w-10 h-14 object-contain rounded bg-[#0a0314] border border-white/10"
                            />
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-sm text-[#f5ebd7]">{book.title}</div>
                            <div className="text-[11px] text-[#a89679]">By {book.author}</div>
                          </td>
                          <td className="p-3.5 text-[#e5c158]">
                            {collections.find((c) => c.id === book.collectionId)?.name || 'Default'}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-[#ffd700] tabular-nums">
                            ${book.price.toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => handleTogglePublish(book)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                                book.isPublished
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {book.isPublished ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <div className="flex gap-1 text-[10px] text-[#fae8a4]">
                              {book.formats.map((f) => (
                                <span key={f} className="px-1.5 py-0.5 rounded bg-[#291248] border border-white/5">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleConvertBookToAudio(book)}
                              className="px-2 py-1 rounded bg-[#381663] text-[#ffd700] border border-[#d4af37]/30 text-[11px] hover:bg-[#481c80] cursor-pointer"
                              title="Open in AI Audiobook Production"
                            >
                              Audio
                            </button>
                            <button
                              onClick={() => {
                                setEditingBook(book);
                                setIsCreatingBook(false);
                              }}
                              className="p-1.5 rounded text-[#fae8a4] hover:text-white cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setBookToDelete(book)}
                              className="p-1.5 rounded text-[#f87171] hover:text-rose-300 cursor-pointer"
                              title="Delete Product (With Confirmation)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'author' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                    About Sky Author Page Editor
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Edit author introduction, biography, publishing philosophy, and portrait photograph.
                  </p>
                </div>

                <button
                  onClick={handleSaveAuthor}
                  className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl hover:brightness-110 flex items-center gap-1.5 shadow cursor-pointer"
                >
                  {authorSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Author Profile</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={localAuthor.name}
                    onChange={(e) => setLocalAuthor({ ...localAuthor, name: e.target.value })}
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2 text-xs text-[#f5ebd7]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Author Photograph URL / Path
                  </label>
                  <input
                    type="text"
                    value={localAuthor.photoUrl}
                    onChange={(e) => setLocalAuthor({ ...localAuthor, photoUrl: e.target.value })}
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2 text-xs text-[#f5ebd7]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Author Tagline
                </label>
                <input
                  type="text"
                  value={localAuthor.tagline}
                  onChange={(e) => setLocalAuthor({ ...localAuthor, tagline: e.target.value })}
                  className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-4 py-2 text-xs text-[#f5ebd7]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Author Introduction
                </label>
                <textarea
                  rows={3}
                  value={localAuthor.introduction}
                  onChange={(e) => setLocalAuthor({ ...localAuthor, introduction: e.target.value })}
                  className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-3 text-xs text-[#f5ebd7]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                  Author Biography
                </label>
                <textarea
                  rows={4}
                  value={localAuthor.biography}
                  onChange={(e) => setLocalAuthor({ ...localAuthor, biography: e.target.value })}
                  className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-3 text-xs text-[#f5ebd7]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Publishing Philosophy
                  </label>
                  <textarea
                    rows={4}
                    value={localAuthor.philosophy}
                    onChange={(e) => setLocalAuthor({ ...localAuthor, philosophy: e.target.value })}
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-3 text-xs text-[#f5ebd7]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#fae8a4] uppercase tracking-wider">
                    Purpose &amp; Message
                  </label>
                  <textarea
                    rows={4}
                    value={localAuthor.purposeMessage}
                    onChange={(e) => setLocalAuthor({ ...localAuthor, purposeMessage: e.target.value })}
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl p-3 text-xs text-[#f5ebd7]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cloudflare-r2' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-3 border-b border-[#d4af37]/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                    <Cloud className="w-4 h-4" />
                    <span>Private S3-Compatible Foundation</span>
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-[#f5ebd7] mt-1">
                    Cloudflare R2 Storage Manager
                  </h3>
                  <p className="text-xs text-[#c9b78e]">
                    Target Bucket: <strong className="text-[#ffd700]">heartwoven-wonders-books</strong> (Private &amp; Unexposed)
                  </p>
                </div>

                <button
                  onClick={handleTestR2Connection}
                  disabled={isTestingR2}
                  className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider rounded-xl hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50 shadow cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingR2 ? 'animate-spin' : ''}`} />
                  <span>{isTestingR2 ? 'Running Diagnostic...' : 'Test R2 Connection'}</span>
                </button>
              </div>

              {r2TestResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    r2TestResult.connected
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {r2TestResult.connected ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{r2TestResult.connected ? 'Diagnostic Passed' : 'Diagnostic Status'}</span>
                  </div>
                  <p>{r2TestResult.message}</p>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/30 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">
                  Server Environment Variables Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#120722] border border-white/5 flex items-center justify-between">
                    <span className="text-[#c9b78e]">CLOUDFLARE_ACCOUNT_ID</span>
                    <span className={`font-semibold ${r2Status?.accountIdPresent ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r2Status?.accountIdPresent ? 'Configured' : 'Missing'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#120722] border border-white/5 flex items-center justify-between">
                    <span className="text-[#c9b78e]">R2_ACCESS_KEY_ID</span>
                    <span className={`font-semibold ${r2Status?.accessKeyPresent ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r2Status?.accessKeyPresent ? 'Configured' : 'Missing'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#120722] border border-white/5 flex items-center justify-between">
                    <span className="text-[#c9b78e]">R2_SECRET_ACCESS_KEY</span>
                    <span className={`font-semibold ${r2Status?.secretKeyPresent ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r2Status?.secretKeyPresent ? 'Configured' : 'Missing'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#120722] border border-white/5 flex items-center justify-between">
                    <span className="text-[#c9b78e]">R2_BUCKET_NAME</span>
                    <span className="font-semibold text-emerald-400">{r2Status?.bucketName || 'heartwoven-wonders-books'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Product Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#1c0a31] border border-rose-500/50 rounded-3xl max-w-md w-full p-6 text-[#f5ebd7] space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-cinzel text-lg font-bold text-rose-300">
                Confirm Permanent Product Deletion
              </h3>
              <p className="text-xs text-[#d6c7a7]">
                Are you sure you want to permanently delete:
              </p>
              <div className="font-bold text-[#ffd700] text-sm py-1">
                "{bookToDelete.title}"
              </div>
              <p className="text-[11px] text-[#a89679]">
                This action will remove the product entry, associated manuscript files, and generated chapter audio files. Legitimate customer purchase records and customer accounts will remain protected.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBookToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#281146] text-[#fae8a4] hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal (Requirement 5) */}
      {(isCreatingBook || editingBook) && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1c0c32] border border-[#d4af37]/50 rounded-3xl max-w-2xl w-full p-6 text-[#f5ebd7] space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
              <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                {editingBook ? `Edit: ${editingBook.title}` : 'Create New Book Product'}
              </h3>
              <button
                onClick={() => {
                  setEditingBook(null);
                  setIsCreatingBook(false);
                  setBookCoverPreview('');
                }}
                className="p-1 rounded text-[#fae8a4] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const formatsSelected: ('PDF' | 'EPUB' | 'Audiobook')[] = [];
                if (formData.get('fmt_pdf') === 'on') formatsSelected.push('PDF');
                if (formData.get('fmt_epub') === 'on') formatsSelected.push('EPUB');
                if (formData.get('fmt_audio') === 'on') formatsSelected.push('Audiobook');
                if (formatsSelected.length === 0) formatsSelected.push('PDF', 'EPUB');

                const bookPayload: Partial<Book> = {
                  title: (formData.get('title') as string) || 'Untitled',
                  subtitle: (formData.get('subtitle') as string) || '',
                  author: (formData.get('author') as string) || 'Sky',
                  price: parseFloat(formData.get('price') as string) || 19.99,
                  collectionId: (formData.get('collectionId') as string) || collections[0]?.id || 'col-faith',
                  coverUrl:
                    bookCoverPreview ||
                    (formData.get('coverUrl') as string) ||
                    editingBook?.coverUrl ||
                    '/src/assets/images/book_cover_faith_purpose_1794015185102.jpg',
                  description: (formData.get('description') as string) || '',
                  formats: formatsSelected,
                  isPublished: formData.get('isPublished') === 'on',
                  isNewRelease: formData.get('isNewRelease') === 'on',
                  isBestSeller: formData.get('isBestSeller') === 'on',
                  isFeatured: formData.get('isFeatured') === 'on',
                };
                handleSaveBook(bookPayload);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Title</label>
                  <input
                    name="title"
                    defaultValue={editingBook?.title || ''}
                    required
                    placeholder="e.g. Whispers of the Unseen"
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Subtitle</label>
                  <input
                    name="subtitle"
                    defaultValue={editingBook?.subtitle || ''}
                    placeholder="e.g. Contemplations for the Weary Spirit"
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Author</label>
                  <input
                    name="author"
                    defaultValue={editingBook?.author || 'Sky'}
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Price ($ USD)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingBook?.price || 19.99}
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Assigned Collection</label>
                  <select
                    name="collectionId"
                    defaultValue={editingBook?.collectionId || collections[0]?.id || 'col-faith'}
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Book Cover Image Management */}
              <div className="space-y-2 p-3 rounded-xl bg-[#120722] border border-[#d4af37]/25">
                <label className="text-[#fae8a4] font-semibold block">Book Cover Artwork</label>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-24 rounded bg-[#0a0314] overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                    {(bookCoverPreview || editingBook?.coverUrl) ? (
                      <img
                        src={bookCoverPreview || editingBook?.coverUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-[#d4af37]/40" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="px-3 py-1.5 bg-[#281146] hover:bg-[#381661] text-[#ffd700] rounded-lg border border-[#d4af37]/30 cursor-pointer inline-flex items-center gap-1.5 text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Cover from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBookCoverUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <input
                        name="coverUrl"
                        defaultValue={editingBook?.coverUrl || ''}
                        placeholder="Or enter image URL / path..."
                        className="w-full bg-[#1c0c30] border border-[#d4af37]/30 rounded-lg p-2 text-xs text-[#f5ebd7]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#fae8a4] font-semibold">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingBook?.description || ''}
                  placeholder="Provide an inspirational description for the bookstore..."
                  className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                />
              </div>

              {/* Formats Available */}
              <div className="space-y-1">
                <label className="text-[#fae8a4] font-semibold block">Available Deliverable Formats</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      name="fmt_pdf"
                      type="checkbox"
                      defaultChecked={editingBook?.formats?.includes('PDF') ?? true}
                      className="rounded text-[#ffd700]"
                    />
                    <span>PDF Edition</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      name="fmt_epub"
                      type="checkbox"
                      defaultChecked={editingBook?.formats?.includes('EPUB') ?? true}
                      className="rounded text-[#ffd700]"
                    />
                    <span>EPUB Edition</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      name="fmt_audio"
                      type="checkbox"
                      defaultChecked={editingBook?.formats?.includes('Audiobook') ?? false}
                      className="rounded text-[#ffd700]"
                    />
                    <span>Spoken Audiobook</span>
                  </label>
                </div>
              </div>

              {/* Status Flags (Defaults to UNPUBLISHED / DRAFT for new books) */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-white/10">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    name="isPublished"
                    type="checkbox"
                    defaultChecked={editingBook ? editingBook.isPublished : false}
                    className="rounded text-[#ffd700]"
                  />
                  <span className="font-semibold text-[#ffd700]">Publish to Bookstore (Uncheck for Draft)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    name="isNewRelease"
                    type="checkbox"
                    defaultChecked={editingBook?.isNewRelease ?? true}
                    className="rounded text-[#ffd700]"
                  />
                  <span>New Release</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    name="isBestSeller"
                    type="checkbox"
                    defaultChecked={editingBook?.isBestSeller ?? false}
                    className="rounded text-[#ffd700]"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    defaultChecked={editingBook?.isFeatured ?? false}
                    className="rounded text-[#ffd700]"
                  />
                  <span>Featured</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBook(null);
                    setIsCreatingBook(false);
                    setBookCoverPreview('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#281146] text-[#fae8a4] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-[#120722] font-bold uppercase tracking-wider cursor-pointer shadow"
                >
                  {editingBook ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collection Editor & Image Management Modal (Requirement 4) */}
      {editingCollection && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1c0c32] border border-[#d4af37]/60 rounded-3xl max-w-2xl w-full p-6 text-[#f5ebd7] space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ffd700]" />
                <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                  Edit Collection: {editingCollection.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingCollection(null)}
                className="p-1 rounded text-[#fae8a4] hover:text-white"
              >
                ✕
              </button>
            </div>

            {collectionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{collectionSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Collection Name & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Collection Name</label>
                  <input
                    type="text"
                    value={editingCollection.name}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, name: e.target.value })
                    }
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7] focus:border-[#ffd700]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Room Position (1-8)</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={editingCollection.order}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[#fae8a4] font-semibold">Collection Description</label>
                <textarea
                  rows={3}
                  value={editingCollection.description}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#120722] border border-[#d4af37]/30 rounded-xl p-2.5 text-[#f5ebd7] leading-relaxed"
                />
              </div>

              {/* Complete Cover Image Controls: Upload, Replace, Delete, Preview */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#120722] border border-[#d4af37]/30">
                <div className="flex items-center justify-between">
                  <label className="text-[#fae8a4] font-semibold uppercase tracking-wider text-[11px]">
                    Collection Cover Artwork Management
                  </label>
                  <span className="text-[10px] text-[#a89679]">
                    Permanent Live Website Synchronization
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {/* Live Card Preview */}
                  <div className="w-36 h-48 rounded-xl bg-[#0a0314] overflow-hidden border-2 border-[#d4af37]/40 shrink-0 relative shadow-lg flex items-center justify-center">
                    {collectionImagePreview || editingCollection.coverImage ? (
                      <img
                        src={collectionImagePreview || editingCollection.coverImage}
                        alt="Collection Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#180a2b]">
                        <Sparkles className="w-8 h-8 text-[#ffd700] mb-2" />
                        <span className="text-[10px] text-[#ffd700] font-cinzel">
                          Sacred Crest Active
                        </span>
                        <span className="text-[9px] text-[#a89679] mt-0.5">
                          (No custom image)
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 text-[8px] font-mono px-1 rounded bg-black/80 text-[#ffd700]">
                      Room 0{editingCollection.order}
                    </span>
                  </div>

                  {/* Image Actions: Upload from computer, Replace, Delete */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <span className="text-[11px] text-[#c9b78e] block mb-1.5">
                        1. Upload or replace with a new image from your computer:
                      </span>
                      <label className="px-4 py-2 bg-[#281146] hover:bg-[#3d186b] text-[#ffd700] border border-[#d4af37]/40 rounded-xl cursor-pointer inline-flex items-center gap-2 font-semibold shadow text-xs">
                        <Upload className="w-4 h-4" />
                        <span>Choose File from Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCollectionImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#c9b78e] block mb-1">
                        2. Or enter an image URL / path:
                      </span>
                      <input
                        type="text"
                        value={collectionImagePreview}
                        onChange={(e) => {
                          setCollectionImagePreview(e.target.value);
                          setEditingCollection({
                            ...editingCollection,
                            coverImage: e.target.value,
                          });
                        }}
                        placeholder="https://... or /src/assets/images/..."
                        className="w-full bg-[#1c0c30] border border-[#d4af37]/30 rounded-xl p-2 text-xs text-[#f5ebd7]"
                      />
                    </div>

                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleDeleteCollectionImage}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Delete Existing Cover Image
                      </button>
                      <span className="text-[10px] text-[#a89679] italic">
                        (Does not delete collection or books)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Theme Customizer (Frame Shape, Accent Color, Ornament) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#120722] border border-white/5">
                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Frame Shape</label>
                  <select
                    value={editingCollection.visualTheme.frameShape}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        visualTheme: {
                          ...editingCollection.visualTheme,
                          frameShape: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-lg p-2 text-xs text-[#f5ebd7]"
                  >
                    <option value="arch">Arch Motif (Regal)</option>
                    <option value="filigree">Filigree Flourish</option>
                    <option value="faceted">Faceted Gem</option>
                    <option value="crest">Sacred Crest</option>
                    <option value="quill">Scholar Quill</option>
                    <option value="halo">Luminous Halo</option>
                    <option value="seal">Imperial Seal</option>
                    <option value="embossed">Embossed Medallion</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Accent Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCollection.visualTheme.accentColor}
                      onChange={(e) =>
                        setEditingCollection({
                          ...editingCollection,
                          visualTheme: {
                            ...editingCollection.visualTheme,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={editingCollection.visualTheme.accentColor}
                      onChange={(e) =>
                        setEditingCollection({
                          ...editingCollection,
                          visualTheme: {
                            ...editingCollection.visualTheme,
                            accentColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1 bg-[#1b0a31] border border-[#d4af37]/30 rounded-lg p-1.5 text-xs text-[#f5ebd7] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#fae8a4] font-semibold">Ornament Motif</label>
                  <select
                    value={editingCollection.visualTheme.ornament}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        visualTheme: {
                          ...editingCollection.visualTheme,
                          ornament: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-lg p-2 text-xs text-[#f5ebd7]"
                  >
                    <option value="Crown">Crown</option>
                    <option value="Sparkles">Sparkles</option>
                    <option value="Heart">Heart</option>
                    <option value="Compass">Compass</option>
                    <option value="Users">Users</option>
                    <option value="Shield">Shield</option>
                    <option value="BookOpen">BookOpen</option>
                    <option value="Flame">Flame</option>
                  </select>
                </div>
              </div>

              {/* Homepage Visibility */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCollection.showOnHomepage}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        showOnHomepage: e.target.checked,
                      })
                    }
                    className="rounded text-[#ffd700]"
                  />
                  <span className="font-semibold text-[#ffd700]">
                    Display This Collection on Bookstore Homepage
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-3 border-t border-[#d4af37]/20">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#281146] text-[#fae8a4] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCollection}
                  disabled={isSavingCollection}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-[#120722] font-bold uppercase tracking-wider shadow hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCollection ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Saving Collection...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Collection Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

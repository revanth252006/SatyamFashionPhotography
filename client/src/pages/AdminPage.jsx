import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Users,
  FolderOpen,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Mail,
  User,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  FolderTree,
  Edit3,
  Save,
  Phone,
  Instagram,
  Youtube
} from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  fetchAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  fetchAdminEventLeads,
  deleteAdminEvent,
  fetchStudioSettings,
  updateStudioSettings
} from '../services/api';

const REQUIRED_PIN = import.meta.env.VITE_ADMIN_PIN || '252006';

export default function AdminPage() {
  // Authentication PIN state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('studio_admin_pin_verified') === 'true';
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Events & Form state
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Creation Form
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Event State
  const [eventToEdit, setEventToEdit] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDriveFolderUrl, setEditDriveFolderUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Leads Modal State
  const [selectedEventForLeads, setSelectedEventForLeads] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [copiedAllEmails, setCopiedAllEmails] = useState(false);

  // Delete State
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Studio Contact & Social Settings State
  const [studioSettings, setStudioSettings] = useState({
    studioName: 'Satyam Fashion Photography',
    phone1: '9347242212',
    phone2: '9440163135',
    email: 'a.satyamdigital@gmail.com',
    locationName: 'Hyderabad, Telangana',
    mapsUrl: 'https://maps.google.com/?q=Satyam+Fashion+Photography+Hyderabad',
    instagramUrl: 'https://www.instagram.com/satyamfashionphotography',
    youtubeUrl: 'https://www.youtube.com/@satyamfashionphotography'
  });
  const [isSavingStudio, setIsSavingStudio] = useState(false);
  const [studioSaveSuccess, setStudioSaveSuccess] = useState(false);
  const [studioSaveError, setStudioSaveError] = useState(null);

  // Load events & studio settings when unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadEvents();
      loadStudioSettings();
    }
  }, [isUnlocked]);

  const loadStudioSettings = async () => {
    try {
      const data = await fetchStudioSettings();
      if (data) {
        setStudioSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Failed to load studio settings:', err);
    }
  };

  const handleSaveStudioSettings = async (e) => {
    e.preventDefault();
    setIsSavingStudio(true);
    setStudioSaveError(null);
    setStudioSaveSuccess(false);

    try {
      await updateStudioSettings(studioSettings);
      setStudioSaveSuccess(true);
      setTimeout(() => setStudioSaveSuccess(false), 3500);
    } catch (err) {
      setStudioSaveError(err.message || 'Failed to update studio settings.');
    } finally {
      setIsSavingStudio(false);
    }
  };

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const data = await fetchAdminEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load admin events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Handle PIN Submission
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (enteredPin.trim() === String(REQUIRED_PIN).trim()) {
      sessionStorage.setItem('studio_admin_pin_verified', 'true');
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
    }
  };

  const handleLockStudio = () => {
    sessionStorage.removeItem('studio_admin_pin_verified');
    setIsUnlocked(false);
    setEnteredPin('');
  };

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreatedResult(null);
    setIsCreating(true);

    try {
      const result = await createAdminEvent({
        title,
        clientName,
        driveFolderUrl,
        eventDate,
        location
      });

      setCreatedResult(result);
      // Reset form
      setTitle('');
      setClientName('');
      setDriveFolderUrl('');
      setEventDate('');
      setLocation('');
      // Reload events list
      loadEvents();
    } catch (err) {
      setCreateError(err.message || 'Failed to verify folder and create event.');
    } finally {
      setIsCreating(false);
    }
  };

  // Start Editing Event
  const handleStartEdit = (ev) => {
    setEventToEdit(ev);
    setEditTitle(ev.title || '');
    setEditClientName(ev.client_name || '');
    setEditEventDate(ev.event_date || '');
    setEditLocation(ev.location || '');
    setEditDriveFolderUrl(ev.drive_folder_id || '');
    setEditError(null);
  };

  // Save Edit Event
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!eventToEdit) return;
    setIsSavingEdit(true);
    setEditError(null);

    try {
      await updateAdminEvent(eventToEdit.id, {
        title: editTitle,
        clientName: editClientName,
        driveFolderUrl: editDriveFolderUrl,
        eventDate: editEventDate,
        location: editLocation
      });

      setEventToEdit(null);
      loadEvents();
    } catch (err) {
      setEditError(err.message || 'Failed to update event details.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Copy shareable link
  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/e/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // View Leads
  const handleViewLeads = async (ev) => {
    setSelectedEventForLeads(ev);
    setIsLoadingLeads(true);
    setCopiedAllEmails(false);
    try {
      const data = await fetchAdminEventLeads(ev.slug);
      setLeadsList(data.leads || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setLeadsList([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Copy all emails
  const handleCopyAllEmails = () => {
    const emails = leadsList.map((l) => l.visitor_email).filter(Boolean).join(', ');
    if (emails) {
      navigator.clipboard.writeText(emails);
      setCopiedAllEmails(true);
      setTimeout(() => setCopiedAllEmails(false), 2500);
    }
  };

  // Confirm and Delete Event Permanently
  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    const targetId = eventToDelete.id;
    try {
      await deleteAdminEvent(targetId);
      // Immediately remove from UI
      setEvents((prev) => prev.filter((ev) => ev.id !== targetId));
      setEventToDelete(null);
      await loadEvents();
    } catch (err) {
      alert(`Error deleting event: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // ===========================================================================
  // 1. PIN Security Lock Screen
  // ===========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-900 text-stone-100 font-sans selection:bg-rosewood-400 selection:text-white">
        <Navbar isAdmin={true} />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-800/80 backdrop-blur-md border border-stone-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-stone-700/60 border border-stone-600 flex items-center justify-center mx-auto mb-4 text-rosewood-300">
              <KeyRound className="w-7 h-7" />
            </div>

            <h2 className="font-serif text-2xl font-normal tracking-tight text-white mb-2">
              Satyam Fashion Photography — Studio Admin
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mb-6 leading-relaxed">
              Please enter your 6-digit studio security PIN to access event management and link generation.
            </p>

            {pinError && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700/50 text-red-200 text-xs flex items-center justify-center space-x-2 animate-bounce">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>Incorrect studio security PIN. Please try again.</span>
              </div>
            )}

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={10}
                  autoFocus
                  placeholder="Enter 6-digit PIN"
                  value={enteredPin}
                  onChange={(e) => {
                    setPinError(false);
                    setEnteredPin(e.target.value);
                  }}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl sm:text-2xl py-3 rounded-xl bg-stone-900/90 border border-stone-700 text-white placeholder:text-stone-600 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rosewood-500 hover:bg-rosewood-600 text-white font-medium text-sm transition shadow-lg active:scale-95 flex items-center justify-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Studio Admin</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-stone-700/50 text-xs text-stone-500">
              <button
                onClick={() => window.navigateTo ? window.navigateTo('/') : (window.location.href = '/')}
                className="text-stone-400 hover:text-stone-300 underline underline-offset-4 transition"
              >
                Return to Public Wedding Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // 2. Unlocked Studio Admin Panel
  // ===========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-rosewood-100 selection:text-rosewood-800">
      {/* Top Studio Navbar */}
      <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border border-stone-700 bg-white flex items-center justify-center shadow-xs">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-serif text-sm sm:text-xl font-bold tracking-tight text-white block leading-tight">
                  SATYAM FASHION PHOTOGRAPHY
                </span>
                <span className="text-[10px] sm:text-xs tracking-widest uppercase text-rosewood-300 font-medium">
                  Studio Admin Panel
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => window.navigateTo ? window.navigateTo('/') : (window.location.href = '/')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-700 text-stone-300 hover:bg-stone-800 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Live Gallery</span>
              </button>

              <button
                onClick={handleLockStudio}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition"
                title="Lock admin session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Section 1: Event Creation & Private Link Generator */}
        <section className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rosewood-100/70 text-rosewood-700 text-xs font-medium tracking-wide uppercase mb-3">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Event Creation & Link Generator</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight mb-2">
              Create New Wedding Gallery
            </h1>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              Connect a client's Google Drive folder, customize their captured date and venue location, auto-detect child categories, and generate a unique client link.
            </p>

            {/* Error Message Box */}
            {createError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Google Drive Verification Failed</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">{createError}</p>
                </div>
              </div>
            )}

            {/* Success Box with Link Generator Output */}
            {createdResult && (
              <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-50/70 via-stone-50 to-emerald-50/70 border border-amber-200/80 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/50">
                  <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Wedding Gallery Created & Connected!</span>
                  </div>
                  <button
                    onClick={() => setCreatedResult(null)}
                    className="text-stone-400 hover:text-stone-600 text-xs"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-stone-500 font-medium block">Private Client Link:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/e/${createdResult.event.slug}`}
                        className="w-full text-xs sm:text-sm font-mono px-3 py-2 bg-white rounded-lg border border-amber-300 text-stone-800 select-all"
                      />
                      <button
                        onClick={() => handleCopyLink(createdResult.event.slug)}
                        className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 text-xs rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const url = `/e/${createdResult.event.slug}`;
                          if (window.navigateTo) window.navigateTo(url);
                          else window.open(url, '_blank');
                        }}
                        className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs rounded-lg font-medium transition flex items-center space-x-1 shrink-0"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>

                  {/* Detected Categories */}
                  <div>
                    <span className="text-xs text-stone-500 font-medium block mb-1.5">
                      Detected Categories ({createdResult.categories?.length || 0}):
                    </span>
                    {createdResult.categories && createdResult.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {createdResult.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 shadow-2xs"
                          >
                            📁 {cat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic">
                        No subfolders found. Photos will stream directly from the parent folder root.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Creation Form */}
            <form onSubmit={handleCreateEvent} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Satyam weds Nagalaxmi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Satyam & Nagalaxmi"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                </div>
              </div>

              {/* Captured Date and Location Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-rosewood-500" />
                    <span>Captured Date (Display)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 22 November 2026"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rosewood-500" />
                    <span>Location / Venue (Display)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, Telangana"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Client Google Drive Folder Link or Raw Folder ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="https://drive.google.com/drive/folders/1znJU4nLx5dQM0kUKjEYIg14Zxtf8MYDX"
                    value={driveFolderUrl}
                    onChange={(e) => setDriveFolderUrl(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                  <FolderOpen className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                </div>
                <div className="mt-2 flex items-start space-x-1.5 text-[11px] text-stone-500">
                  <span className="text-amber-600 font-bold shrink-0">Important:</span>
                  <span>
                    Ensure the folder's General Access in Google Drive is set to <strong>"Anyone with the link can view"</strong> so guests can browse photos.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-rosewood-300" />
                      <span>Verifying Drive & Generating Link...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 text-rosewood-300" />
                      <span>Verify Drive & Create Event</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Section 2: Studio Contact Details & Social Media Links */}
        <section className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium tracking-wide uppercase mb-3">
              <Phone className="w-3.5 h-3.5 text-rosewood-500" />
              <span>Studio Contact & Public Footer Configuration</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 tracking-tight mb-2">
              Studio Contact & Social Media Profiles
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              Configure your studio brand name, contact numbers, email, default Google Maps location link, and official Instagram & YouTube profiles displayed in client gallery footers.
            </p>

            {studioSaveSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Studio contact and social profiles successfully updated!</span>
              </div>
            )}

            {studioSaveError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{studioSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudioSettings} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Studio Brand Title
                  </label>
                  <input
                    type="text"
                    required
                    value={studioSettings.studioName || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, studioName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="Satyam Fashion Photography"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-rosewood-500" />
                    <span>Primary Phone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={studioSettings.phone1 || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, phone1: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="9347242212"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-rosewood-500" />
                    <span>Secondary Phone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={studioSettings.phone2 || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, phone2: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="9440163135"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-rosewood-500" />
                    <span>Studio Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={studioSettings.email || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="a.satyamdigital@gmail.com"
                  />
                </div>
              </div>

              {/* Location Name & Google Maps Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rosewood-500" />
                    <span>Location Display Name</span>
                  </label>
                  <input
                    type="text"
                    value={studioSettings.locationName || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, locationName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="Hyderabad, Telangana"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rosewood-500" />
                      <span>Google Maps Location URL</span>
                    </span>
                    {studioSettings.mapsUrl && (
                      <a
                        href={studioSettings.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-rosewood-600 hover:underline flex items-center space-x-0.5 normal-case"
                      >
                        <span>Test Map Link</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={studioSettings.mapsUrl || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, mapsUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="https://maps.google.com/?q=Satyam+Fashion+Photography+Hyderabad"
                  />
                </div>
              </div>

              {/* Instagram & YouTube Profiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Instagram className="w-3.5 h-3.5 text-rosewood-500" />
                      <span>Instagram Profile Link</span>
                    </span>
                    {studioSettings.instagramUrl && (
                      <a
                        href={studioSettings.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-rosewood-600 hover:underline flex items-center space-x-0.5 normal-case"
                      >
                        <span>Test Instagram</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={studioSettings.instagramUrl || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, instagramUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="https://www.instagram.com/satyamfashionphotography"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Youtube className="w-3.5 h-3.5 text-rosewood-500" />
                      <span>YouTube Channel Link</span>
                    </span>
                    {studioSettings.youtubeUrl && (
                      <a
                        href={studioSettings.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-rosewood-600 hover:underline flex items-center space-x-0.5 normal-case"
                      >
                        <span>Test YouTube</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    value={studioSettings.youtubeUrl || ''}
                    onChange={(e) => setStudioSettings({ ...studioSettings, youtubeUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-stone-50/50 hover:bg-white focus:bg-white transition"
                    placeholder="https://www.youtube.com/@satyamfashionphotography"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingStudio}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs sm:text-sm hover:bg-stone-800 transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
                >
                  {isSavingStudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-rosewood-300" />
                      <span>Saving Studio Info...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-rosewood-300" />
                      <span>Save Studio Contact & Social Links</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Section 3: Manage Existing Galleries & Leads */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-stone-900">
                Existing Client Galleries
              </h2>
              <p className="text-xs text-stone-500">
                Manage wedding events, update captured date & venue details, view leads, and copy client sharing URLs.
              </p>
            </div>

            <button
              onClick={loadEvents}
              disabled={isLoadingEvents}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-600 transition shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>

          {isLoadingEvents && events.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-stone-200/70 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <FolderOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-stone-800">No Wedding Galleries Yet</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Use the form above to connect your first Google Drive folder and generate a private gallery link.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-sm transition p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Title and Leads Badge */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-serif text-base font-semibold text-stone-900 leading-snug line-clamp-2">
                        {ev.title}
                      </h3>
                      <button
                        onClick={() => handleViewLeads(ev)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rosewood-50 text-rosewood-700 hover:bg-rosewood-100 transition shrink-0"
                        title="View download leads"
                      >
                        <Users className="w-3 h-3" />
                        <span>{ev.lead_count ?? 0} Leads</span>
                      </button>
                    </div>

                    {/* Client Name */}
                    <p className="text-xs text-stone-600 mb-2 italic font-serif">
                      {ev.client_name}
                    </p>

                    {/* Captured Date and Location Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-stone-600">
                      {ev.event_date && (
                        <span className="inline-flex items-center space-x-1 bg-stone-100 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-rosewood-500" />
                          <span>{ev.event_date}</span>
                        </span>
                      )}
                      {ev.location && (
                        <span className="inline-flex items-center space-x-1 bg-stone-100 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-rosewood-500" />
                          <span>{ev.location}</span>
                        </span>
                      )}
                    </div>

                    {/* Slug & Date */}
                    <div className="space-y-1 text-xs text-stone-500 font-mono bg-stone-50 p-2.5 rounded-lg border border-stone-100 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-[190px]">/e/{ev.slug}</span>
                        <button
                          onClick={() => handleCopyLink(ev.slug)}
                          className="text-stone-400 hover:text-stone-700 transition"
                          title="Copy Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                    <button
                      onClick={() => {
                        const url = `/e/${ev.slug}`;
                        if (window.navigateTo) window.navigateTo(url);
                        else window.location.href = url;
                      }}
                      className="inline-flex items-center space-x-1 font-medium text-stone-800 hover:text-rosewood-600 transition"
                    >
                      <span>Open Gallery</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(ev)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                        title="Edit Event Details (Date, Location, Title)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewLeads(ev)}
                        className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
                      >
                        Leads
                      </button>
                      <button
                        onClick={() => setEventToDelete(ev)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete gallery"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* =======================================================================
          3. Edit Event Modal (Title, Client, Date, Location, Drive Link)
      ======================================================================= */}
      {eventToEdit && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-rosewood-600" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Update Event Details
                </h3>
              </div>
              <button
                onClick={() => setEventToEdit(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rosewood-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rosewood-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Captured Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 22 November 2026"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rosewood-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, Telangana"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:ring-2 focus:ring-rosewood-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Google Drive Folder Link / ID
                </label>
                <input
                  type="text"
                  value={editDriveFolderUrl}
                  onChange={(e) => setEditDriveFolderUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200 focus:ring-2 focus:ring-rosewood-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEventToEdit(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          4. Download Leads Modal / Drawer
      ======================================================================= */}
      {selectedEventForLeads && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center space-x-2 text-rosewood-600 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Users className="w-4 h-4" />
                  <span>Visitor Download Leads</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {selectedEventForLeads.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Slug: <span className="font-mono">/e/{selectedEventForLeads.slug}</span> • Total captured:{' '}
                  <strong>{leadsList.length}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedEventForLeads(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Leads List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {isLoadingLeads ? (
                <div className="py-12 text-center text-stone-400 flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading captured leads...</span>
                </div>
              ) : leadsList.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-serif">No download leads captured yet</p>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    When guests click "Download Gallery" or download high-res photos, their name and email appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {leadsList.map((lead) => (
                    <div
                      key={lead.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-stone-50/80 px-2 rounded-lg transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-stone-800 block">{lead.visitor_name}</span>
                          <span className="text-stone-500 font-mono text-[11px]">{lead.visitor_email}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-stone-400 text-[11px] pl-9 sm:pl-0">
                        <span>{new Date(lead.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lead.visitor_email);
                            alert(`Copied ${lead.visitor_email}`);
                          }}
                          className="hover:text-stone-700"
                          title="Copy email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              {leadsList.length > 0 && (
                <button
                  onClick={handleCopyAllEmails}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-700 transition flex items-center space-x-1.5"
                >
                  {copiedAllEmails ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>All Emails Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Copy All Emails</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setSelectedEventForLeads(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          5. Delete Confirmation Dialog
      ======================================================================= */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Delete Wedding Gallery?</h3>
            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong>"{eventToDelete.title}"</strong>? This will also remove all associated download leads. This action cannot be undone.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition flex items-center justify-center space-x-1"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

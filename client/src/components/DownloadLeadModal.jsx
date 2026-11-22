import React, { useState } from 'react';
import { X, Download, Mail, User, CheckCircle2, Loader2, Lock, Heart } from 'lucide-react';
import { submitDownloadLead } from '../services/api';

export default function DownloadLeadModal({ 
  isOpen, 
  onClose, 
  eventSlug, 
  targetPhoto = null,
  purpose = 'download', // 'download' | 'favorite' | 'download_gallery' | 'view_favorites'
  onSuccess = null 
}) {
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isFavoritePurpose = purpose === 'favorite' || purpose === 'view_favorites';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await submitDownloadLead({
        eventSlug: eventSlug || 'general',
        visitorName,
        visitorEmail
      });

      // Save visitor identity & per-event unlock state in localStorage
      const visitor = { 
        name: visitorName.trim(), 
        email: visitorEmail.trim().toLowerCase(),
        unlocked: true,
        unlockedAt: new Date().toISOString()
      };
      localStorage.setItem('wedding_visitor_lead', JSON.stringify(visitor));
      if (eventSlug) {
        localStorage.setItem(`wedding_unlock_${eventSlug}`, JSON.stringify(visitor));
      }

      setIsSuccess(true);

      // Trigger callback if provided
      if (onSuccess) {
        onSuccess(visitor);
      }

      // If downloading a specific photo, trigger download
      if (targetPhoto && targetPhoto.webContentLink && !isFavoritePurpose) {
        window.open(targetPhoto.webContentLink, '_blank');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to submit details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setVisitorName('');
    setVisitorEmail('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">Access Granted!</h3>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              Thank you, <strong>{visitorName}</strong>. You can now favorite photos and download high-resolution pictures freely.
            </p>
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition"
            >
              Continue to Gallery
            </button>
          </div>
        ) : (
          <div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isFavoritePurpose ? 'bg-rose-100 text-rose-600' : 'bg-rosewood-100 text-rosewood-600'
            }`}>
              {isFavoritePurpose ? <Heart className="w-6 h-6 fill-rose-600" /> : <Download className="w-6 h-6" />}
            </div>

            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1">
              {isFavoritePurpose ? 'Save Your Favorites' : 'Download Gallery Photos'}
            </h3>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              {isFavoritePurpose
                ? 'Please provide your name and email to save, review, and access your favorite wedding pictures.'
                : 'Please provide your name and email to access and download high-resolution gallery pictures.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Jessica Miller"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="e.g. jessica@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rosewood-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 pt-1">
                <Lock className="w-3 h-3 text-stone-400" />
                <span>Your contact info is saved only to this wedding client register.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rosewood-300" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    {isFavoritePurpose ? (
                      <Heart className="w-4 h-4 fill-rose-300 text-rose-300" />
                    ) : (
                      <Download className="w-4 h-4 text-rosewood-300" />
                    )}
                    <span>{isFavoritePurpose ? 'Unlock & Save Favorites' : 'Access & Download Photos'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Youtube, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Film, 
  Award, 
  Clock, 
  MessageCircle, 
  Heart,
  Lock,
  ChevronRight
} from 'lucide-react';
import { fetchStudioSettings } from '../services/api';
import Footer from '../components/Footer';

export default function HomePage() {
  const [settings, setSettings] = useState({
    studioName: 'Satyam Fashion Photography',
    phone1: '9347242212',
    phone2: '9440163135',
    email: 'a.satyamdigital@gmail.com',
    locationName: 'Hyderabad, Telangana',
    mapsUrl: 'https://maps.google.com/?q=Satyam+Fashion+Photography+Hyderabad',
    instagramUrl: 'https://www.instagram.com/satyamfashionphotography',
    youtubeUrl: 'https://www.youtube.com/@satyamfashionphotography'
  });

  const [galleryCode, setGalleryCode] = useState('');
  const [galleryError, setGalleryError] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchStudioSettings().then((data) => {
      if (mounted && data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleNav = (path) => {
    if (window.navigateTo) window.navigateTo(path);
    else window.location.href = path;
  };

  const handleOpenGallery = (e) => {
    e.preventDefault();
    const cleaned = galleryCode.trim().replace(/^.*\/e\//, '').replace(/^\/+/, '');
    if (!cleaned) {
      setGalleryError('Please enter your event gallery code or slug.');
      return;
    }
    setGalleryError('');
    handleNav(`/e/${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-rosewood-100 selection:text-rosewood-900">
      {/* =======================================================================
          TOP STUDIO NAVBAR
      ======================================================================= */}
      <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Logo + Studio Name */}
            <div 
              onClick={() => handleNav('/')}
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group min-w-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-stone-200 bg-white shadow-2xs group-hover:scale-105 transition flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Satyam Fashion Photography Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none' }} className="w-full h-full bg-stone-900 text-stone-100 items-center justify-center">
                  <Camera className="w-5 h-5 text-rosewood-300" />
                </div>
              </div>

              <div className="min-w-0">
                <span className="font-serif text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-stone-900 block leading-tight truncate">
                  {settings.studioName || 'Satyam Fashion Photography'}
                </span>
                <span className="hidden sm:block text-[10px] sm:text-xs tracking-widest uppercase text-stone-500 font-medium truncate mt-0.5">
                  Luxury Wedding & Fashion Photography
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
              {/* WhatsApp / Call */}
              <a
                href={`https://wa.me/91${settings.phone1.replace(/\D/g, '')}?text=Hello%20Satyam%20Fashion%20Photography,%20I%20would%20like%20to%20inquire%20about%20a%20photoshoot.`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              {/* Call Button */}
              <a
                href={`tel:${settings.phone1}`}
                className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rosewood-300" />
                <span>Call Studio</span>
              </a>

              {/* Admin login */}
              <button
                onClick={() => handleNav('/admin')}
                className="p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition"
                title="Studio Portal (Admin)"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =======================================================================
          HERO BANNER
      ======================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 via-stone-50 to-white pt-16 sm:pt-24 pb-16 sm:pb-20 border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Studio Tag */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rosewood-50 border border-rosewood-200/80 text-rosewood-800 text-xs sm:text-sm font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-rosewood-600" />
            <span>Luxury Weddings • Cinematic Fashion • Candid Celebrations</span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-950 mb-6 leading-tight">
            Satyam Fashion Photography
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-stone-600 font-light leading-relaxed mb-8">
            Crafting timeless, emotional visual stories for your grand weddings, pre-wedding romantic portraits, and high-fashion editorials across Hyderabad and destinations worldwide.
          </p>

          {/* Quick Contact & Action Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
            <a
              href={`tel:${settings.phone1}`}
              className="inline-flex items-center space-x-2 px-5 sm:px-6 py-3 rounded-full text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition shadow-md active:scale-95"
            >
              <Phone className="w-4 h-4 text-rosewood-300" />
              <span>Call: {settings.phone1}</span>
            </a>

            <a
              href={`mailto:${settings.email}`}
              className="inline-flex items-center space-x-2 px-5 sm:px-6 py-3 rounded-full text-sm font-medium bg-white text-stone-800 border border-stone-300 hover:bg-stone-100 transition shadow-2xs"
            >
              <Mail className="w-4 h-4 text-rosewood-600" />
              <span>Email Studio</span>
            </a>

            <a
              href="#client-access"
              className="inline-flex items-center space-x-2 px-5 sm:px-6 py-3 rounded-full text-sm font-medium bg-rosewood-100 text-rosewood-900 hover:bg-rosewood-200 transition shadow-2xs"
            >
              <Lock className="w-4 h-4 text-rosewood-700" />
              <span>Client Gallery Portal</span>
            </a>
          </div>

          {/* Location & Social Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-stone-600">
            <a
              href={settings.mapsUrl || 'https://maps.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-200/70 hover:bg-stone-300/80 transition text-stone-800 font-medium"
            >
              <MapPin className="w-3.5 h-3.5 text-rosewood-600" />
              <span>{settings.locationName || 'Hyderabad, Telangana'} (Google Maps)</span>
            </a>

            <a
              href={settings.instagramUrl || 'https://instagram.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-200/70 hover:bg-stone-300/80 transition text-stone-800 font-medium"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>Instagram Profile</span>
            </a>

            <a
              href={settings.youtubeUrl || 'https://youtube.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-200/70 hover:bg-stone-300/80 transition text-stone-800 font-medium"
            >
              <Youtube className="w-3.5 h-3.5 text-red-600" />
              <span>YouTube Channel</span>
            </a>
          </div>
        </div>
      </section>

      {/* =======================================================================
          ABOUT THE PHOTOGRAPHER & STUDIO
      ======================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Visual Identity Frame */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-4 border-stone-100 shadow-2xl bg-gradient-to-tr from-stone-900 to-stone-800 flex items-center justify-center group">
                <img
                  src="/logo.png"
                  alt="Satyam Fashion Photography"
                  className="w-full h-full object-contain p-6 group-hover:scale-105 transition duration-500"
                />
              </div>

              <div className="mt-6 text-center">
                <h3 className="font-serif text-xl font-bold text-stone-900">Satyam Fashion Photography</h3>
                <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">Lead Photographer & Visual Storyteller</p>
                <div className="inline-flex items-center space-x-1.5 text-xs text-rosewood-700 bg-rosewood-50 px-3 py-1 rounded-full mt-2 font-medium">
                  <MapPin className="w-3 h-3 text-rosewood-600" />
                  <span>Hyderabad • Telangana • Worldwide</span>
                </div>
              </div>
            </div>

            {/* Editorial Biography */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 text-rosewood-700 text-xs font-bold tracking-wider uppercase">
                <Award className="w-4 h-4 text-rosewood-600" />
                <span>Our Philosophy & Craft</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-950 leading-tight">
                Preserving Every Sacred Ritual & Joyful Tear With Artistic Precision
              </h2>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                At <strong>Satyam Fashion Photography</strong>, we believe every wedding is an unrepeatable masterpiece of rituals, raw emotions, and timeless family bonds. Led by passionate photographers with over a decade of mastery, our team documents candid laughter, quiet emotional glances, and grand rituals without ever feeling intrusive.
              </p>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                From vibrant Haldi ceremonies and high-energy Sangeet nights to the solemn sanctity of the wedding Muhurtham, we capture every frame with editorial lighting, rich colors, and razor-sharp clarity.
              </p>

              {/* Core Studio Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">10+</div>
                  <div className="text-xs text-stone-600 font-medium mt-0.5">Years Experience</div>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">500+</div>
                  <div className="text-xs text-stone-600 font-medium mt-0.5">Couples & Weddings</div>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 col-span-2 sm:col-span-1">
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">100%</div>
                  <div className="text-xs text-stone-600 font-medium mt-0.5">Client Privacy Secured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================================
          OUR SERVICES & EXPERTISE
      ======================================================================= */}
      <section className="py-16 sm:py-20 bg-stone-50 border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-rosewood-700 text-xs font-bold uppercase tracking-wider">What We Create</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-950 mt-1">
              Photography & Cinematography Services
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2">
              Comprehensive visual production tailored for discerning families and couples.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rosewood-50 text-rosewood-700 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">Candid Wedding Photography</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Capturing spontaneous laughter, sacred vows, and emotional family moments with editorial elegance and natural colors.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rosewood-50 text-rosewood-700 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">Pre-Wedding & Engagement Shoots</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Creative concept and destination portraits celebrating your love story in breathtaking outdoor and architectural locations.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rosewood-50 text-rosewood-700 flex items-center justify-center mb-4">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">Cinematography & 4K Teasers</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Bespoke wedding films, Instagram reels, drone cinematography, and musical wedding teasers edited to cinematic perfection.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rosewood-50 text-rosewood-700 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">Haldi, Mehendi & Sangeet</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Vibrant, fast-paced event coverage capturing yellow splash memories, henna details, and high-energy dance floor celebrations.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rosewood-50 text-rosewood-700 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">Fashion & Bridal Couture</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                High-end jewelry, bridal styling, designer lehenga details, and editorial model portfolios photographed with studio lighting.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rosewood-50 text-rosewood-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">Private Digital Client Archives</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                High-resolution cloud delivery powered by Google Drive, category filtering, favorites selection, and fast full-size downloads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================================
          CLIENT GALLERY ACCESS PORTAL (NO CLIENT PHOTOS EXPOSED PUBLICLY)
      ======================================================================= */}
      <section id="client-access" className="py-16 sm:py-20 bg-stone-900 text-stone-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center mx-auto mb-4 text-rosewood-400">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-bold mb-3">
            Looking For Your Private Event Gallery?
          </h2>

          <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            To safeguard our couples’ privacy, client wedding photos are never published on the public home page. Enter your private event link or code below to access your high-resolution gallery.
          </p>

          <form onSubmit={handleOpenGallery} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={galleryCode}
                  onChange={(e) => {
                    setGalleryCode(e.target.value);
                    if (galleryError) setGalleryError('');
                  }}
                  placeholder="e.g. satyam-and-nagalaxmi"
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-stone-800 border border-stone-700 text-white placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-rosewood-500 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-rosewood-600 hover:bg-rosewood-700 text-white font-semibold text-sm transition shrink-0 active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
              >
                <span>Open Gallery</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {galleryError && (
              <p className="text-rose-400 text-xs mt-2 text-left px-2">{galleryError}</p>
            )}

            <p className="text-stone-400 text-xs mt-4">
              Tip: You can also click the direct link sent to you by the studio or couple via WhatsApp/Email.
            </p>
          </form>
        </div>
      </section>

      {/* =======================================================================
          CONTACT & BOOKING SECTION
      ======================================================================= */}
      <section className="py-16 sm:py-24 bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-rosewood-700 text-xs font-bold uppercase tracking-wider">Get in Touch</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-950 mt-1">
              Contact Satyam Fashion Photography
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2">
              Book your wedding dates, schedule a consultation, or connect directly with our studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone Card */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Call / WhatsApp</h3>
              <p className="text-xs text-stone-500 mb-3">Available for bookings & consultations</p>
              <div className="space-y-1 text-sm font-semibold text-stone-800">
                <a href={`tel:${settings.phone1}`} className="block hover:text-rosewood-700 transition">
                  {settings.phone1}
                </a>
                <a href={`tel:${settings.phone2}`} className="block hover:text-rosewood-700 transition">
                  {settings.phone2}
                </a>
              </div>
            </div>

            {/* Email Card */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Email Inquiries</h3>
              <p className="text-xs text-stone-500 mb-3">Send your event date & requirements</p>
              <a 
                href={`mailto:${settings.email}`} 
                className="text-sm font-semibold text-stone-800 hover:text-rosewood-700 transition break-all"
              >
                {settings.email}
              </a>
            </div>

            {/* Location Card */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Studio Location</h3>
              <p className="text-xs text-stone-500 mb-3">{settings.locationName || 'Hyderabad, Telangana'}</p>
              <a
                href={settings.mapsUrl || 'https://maps.google.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition"
              >
                <span>Open in Google Maps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================================
          FOOTER WITH SOCIALS & ADMIN LINK
      ======================================================================= */}
      <Footer />
    </div>
  );
}

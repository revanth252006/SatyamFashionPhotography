import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Instagram, Youtube, Lock } from 'lucide-react';
import { fetchStudioSettings } from '../services/api';

export default function Footer() {
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

  useEffect(() => {
    let mounted = true;
    fetchStudioSettings().then((data) => {
      if (mounted && data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleAdminNav = () => {
    if (window.navigateTo) window.navigateTo('/admin');
    else window.location.href = '/admin';
  };

  return (
    <footer className="border-t border-stone-200 bg-white py-10 sm:py-12 text-stone-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
        {/* Studio Branding */}
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            {settings.studioName || 'Satyam Fashion Photography'}
          </h2>
        </div>

        {/* Contact Numbers & Email */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-stone-700">
          {/* Phone Numbers */}
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-rosewood-500 shrink-0" />
            <a 
              href={`tel:${settings.phone1}`} 
              className="hover:text-rosewood-600 transition underline-offset-4 hover:underline"
            >
              {settings.phone1}
            </a>
            <span className="text-stone-300">•</span>
            <a 
              href={`tel:${settings.phone2}`} 
              className="hover:text-rosewood-600 transition underline-offset-4 hover:underline"
            >
              {settings.phone2}
            </a>
          </div>

          <span className="hidden sm:inline text-stone-300">|</span>

          {/* Email */}
          <div className="flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-rosewood-500 shrink-0" />
            <a 
              href={`mailto:${settings.email}`} 
              className="hover:text-rosewood-600 transition underline-offset-4 hover:underline"
            >
              {settings.email}
            </a>
          </div>
        </div>

        {/* Location (Google Maps) and Social Media Symbols */}
        <div className="flex items-center justify-center space-x-5 pt-1">
          {/* Location Map Pin Symbol -> Google Maps */}
          <a
            href={settings.mapsUrl || 'https://maps.google.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition group"
            title="Open studio location in Google Maps"
          >
            <MapPin className="w-4 h-4 text-rosewood-500 group-hover:scale-110 transition shrink-0" />
            <span>{settings.locationName || 'View Location'}</span>
          </a>

          {/* Instagram Profile Symbol */}
          <a
            href={settings.instagramUrl || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-stone-100 hover:bg-rosewood-100 text-stone-700 hover:text-rosewood-600 transition shadow-2xs group"
            title="Follow on Instagram"
          >
            <Instagram className="w-4 h-4 group-hover:scale-110 transition" />
          </a>

          {/* YouTube Channel Symbol */}
          <a
            href={settings.youtubeUrl || 'https://youtube.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-600 transition shadow-2xs group"
            title="Watch on YouTube"
          >
            <Youtube className="w-4 h-4 group-hover:scale-110 transition" />
          </a>

          {/* Subtle Discreet Admin Portal Access */}
          <button
            onClick={handleAdminNav}
            className="p-2 rounded-full text-stone-300 hover:text-stone-600 transition ml-2"
            title="Studio Portal (Ctrl + Shift + A)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}


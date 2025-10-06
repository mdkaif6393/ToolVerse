import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Languages, Check } from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false }
];

const translations: Translations = {
  en: {
    'nav.tools': 'Tools',
    'nav.marketplace': 'Marketplace',
    'nav.collaboration': 'Team',
    'nav.analytics': 'Analytics',
    'tools.create': 'Create Tool',
    'tools.upload': 'Upload ZIP',
    'tools.preview': 'Live Preview',
    'tools.dependencies': 'Dependencies',
    'marketplace.browse': 'Browse Tools',
    'marketplace.featured': 'Featured',
    'marketplace.trending': 'Trending',
    'marketplace.install': 'Install',
    'marketplace.buy': 'Buy Now',
    'team.workspace': 'Team Workspace',
    'team.members': 'Team Members',
    'team.comments': 'Comments',
    'team.versions': 'Version History',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search...',
    'welcome.title': 'Welcome to CraftaSuite',
    'welcome.subtitle': 'Build, test, and deploy tools with ease'
  },
  hi: {
    'nav.tools': 'उपकरण',
    'nav.marketplace': 'मार्केटप्लेस',
    'nav.collaboration': 'टीम',
    'nav.analytics': 'एनालिटिक्स',
    'tools.create': 'टूल बनाएं',
    'tools.upload': 'ZIP अपलोड करें',
    'tools.preview': 'लाइव प्रीव्यू',
    'tools.dependencies': 'डिपेंडेंसी',
    'marketplace.browse': 'टूल्स ब्राउज़ करें',
    'marketplace.featured': 'फीचर्ड',
    'marketplace.trending': 'ट्रेंडिंग',
    'marketplace.install': 'इंस्टॉल करें',
    'marketplace.buy': 'अभी खरीदें',
    'team.workspace': 'टीम वर्कस्पेस',
    'team.members': 'टीम मेंबर्स',
    'team.comments': 'कमेंट्स',
    'team.versions': 'वर्जन हिस्ट्री',
    'common.loading': 'लोड हो रहा है...',
    'common.save': 'सेव करें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'डिलीट करें',
    'common.edit': 'एडिट करें',
    'common.search': 'खोजें...',
    'welcome.title': 'CraftaSuite में आपका स्वागत है',
    'welcome.subtitle': 'आसानी से टूल्स बनाएं, टेस्ट करें और डिप्लॉय करें'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLang);
    document.documentElement.lang = savedLang;
    document.documentElement.dir = languages.find(l => l.code === savedLang)?.rtl ? 'rtl' : 'ltr';
  }, []);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = languages.find(l => l.code === lang)?.rtl ? 'rtl' : 'ltr';
  };

  const t = (key: string, params?: Record<string, string>) => {
    let translation = translations[currentLanguage]?.[key] || translations['en'][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageSelector = () => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span>{languages.find(l => l.code === currentLanguage)?.flag}</span>
        <span className="hidden sm:inline">
          {languages.find(l => l.code === currentLanguage)?.nativeName}
        </span>
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 z-50 w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Select Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {languages.map(lang => (
              <Button
                key={lang.code}
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  currentLanguage === lang.code ? 'bg-primary/10' : ''
                }`}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
              >
                <span className="mr-2">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.nativeName}</span>
                <span className="text-xs text-muted-foreground">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <Check className="h-4 w-4 ml-2 text-primary" />
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const MultiLanguageDemo = () => {
  const { t, currentLanguage } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          {t('welcome.title')}
        </CardTitle>
        <p className="text-muted-foreground">{t('welcome.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Badge variant="outline">{t('nav.tools')}</Badge>
          <Badge variant="outline">{t('nav.marketplace')}</Badge>
          <Badge variant="outline">{t('nav.collaboration')}</Badge>
          <Badge variant="outline">{t('nav.analytics')}</Badge>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm">{t('tools.create')}</Button>
          <Button size="sm" variant="outline">{t('tools.upload')}</Button>
          <Button size="sm" variant="outline">{t('marketplace.browse')}</Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Current Language: <Badge>{currentLanguage.toUpperCase()}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

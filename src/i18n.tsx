import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Filipino', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
] as const;

type LanguageCode = (typeof languages)[number]['code'];
type Dictionary = Record<string, string>;

const en: Dictionary = {
  home: 'Home', browseApps: 'Browse Apps', newApps: 'New Apps', topApps: 'Top Apps', submitApp: 'Submit App', favorites: 'Favorites', feedback: 'Feedback', blog: 'Blog', purchases: 'Purchases', profile: 'Profile', developer: 'Developer', developerDashboard: 'Developer Dashboard', myApps: 'My Apps', adNetwork: 'Ad Network', advertiserDashboard: 'Advertiser Dashboard', analytics: 'Analytics', admin: 'Admin', appModeration: 'App Moderation', adModeration: 'Ad Moderation', blogManager: 'Blog Manager', legal: 'Legal', aboutOpenApp: 'About OpenApp', privacyPolicy: 'Privacy Policy', termsOfService: 'Terms of Service', license: 'License', lightMode: 'Light Mode', darkMode: 'Dark Mode', signOut: 'Sign Out', signIn: 'Sign In', language: 'Language', today: 'Today', games: 'Games', apps: 'Apps', arcade: 'Arcade', search: 'Search', about: 'About', privacy: 'Privacy', selectLanguage: 'Select language', openApp: 'OpenApp', dashboard: 'Dashboard', wallet: 'Wallet', balance: 'Balance', send: 'Send', receive: 'Receive', qrPay: 'QR Pay', merchant: 'Merchant', settings: 'Settings', notifications: 'Notifications', login: 'Login', signup: 'Signup', checkout: 'Checkout', paymentAmount: 'Payment amount', price: 'Price', free: 'Free', total: 'Total', back: 'Back', signInRequired: 'Sign in Required'
};

const dictionaries: Record<LanguageCode, Dictionary> = {
  en,
  tl: { ...en, home: 'Home', browseApps: 'Mag-browse ng Apps', newApps: 'Bagong Apps', topApps: 'Nangungunang Apps', submitApp: 'Isumite ang App', favorites: 'Mga Paborito', feedback: 'Feedback', purchases: 'Mga Binili', profile: 'Profile', developer: 'Developer', developerDashboard: 'Dashboard ng Developer', myApps: 'Aking Apps', adNetwork: 'Ad Network', advertiserDashboard: 'Dashboard ng Advertiser', analytics: 'Analytics', admin: 'Admin', legal: 'Legal', about: 'Tungkol', privacy: 'Privacy', language: 'Wika', selectLanguage: 'Pumili ng wika', signIn: 'Mag-sign In', signOut: 'Mag-sign Out' },
  es: { ...en, home: 'Inicio', browseApps: 'Explorar apps', newApps: 'Nuevas apps', topApps: 'Mejores apps', submitApp: 'Enviar app', favorites: 'Favoritos', feedback: 'Comentarios', blog: 'Blog', purchases: 'Compras', profile: 'Perfil', developer: 'Desarrollador', developerDashboard: 'Panel de desarrollador', myApps: 'Mis apps', adNetwork: 'Red publicitaria', advertiserDashboard: 'Panel de anunciante', analytics: 'Analíticas', admin: 'Admin', legal: 'Legal', about: 'Acerca de', privacy: 'Privacidad', language: 'Idioma', selectLanguage: 'Seleccionar idioma', signIn: 'Iniciar sesión', signOut: 'Cerrar sesión' },
  zh: { ...en, home: '首页', browseApps: '浏览应用', newApps: '新应用', topApps: '热门应用', submitApp: '提交应用', favorites: '收藏', feedback: '反馈', purchases: '购买', profile: '个人资料', developer: '开发者', developerDashboard: '开发者面板', myApps: '我的应用', adNetwork: '广告网络', analytics: '分析', admin: '管理', legal: '法律', language: '语言', selectLanguage: '选择语言', signIn: '登录', signOut: '退出' },
  ja: { ...en, home: 'ホーム', browseApps: 'アプリを見る', newApps: '新着アプリ', topApps: 'トップアプリ', submitApp: 'アプリを提出', favorites: 'お気に入り', feedback: 'フィードバック', purchases: '購入', profile: 'プロフィール', developer: '開発者', language: '言語', selectLanguage: '言語を選択', signIn: 'サインイン', signOut: 'サインアウト' },
  ko: { ...en, home: '홈', browseApps: '앱 탐색', newApps: '새 앱', topApps: '인기 앱', submitApp: '앱 제출', favorites: '즐겨찾기', feedback: '피드백', purchases: '구매', profile: '프로필', language: '언어', selectLanguage: '언어 선택', signIn: '로그인', signOut: '로그아웃' },
  fr: { ...en, home: 'Accueil', browseApps: 'Parcourir', newApps: 'Nouvelles apps', topApps: 'Meilleures apps', submitApp: 'Soumettre', favorites: 'Favoris', feedback: 'Retour', purchases: 'Achats', profile: 'Profil', developer: 'Développeur', language: 'Langue', selectLanguage: 'Choisir la langue', signIn: 'Connexion', signOut: 'Déconnexion' },
  de: { ...en, home: 'Start', browseApps: 'Apps durchsuchen', newApps: 'Neue Apps', topApps: 'Top-Apps', submitApp: 'App einreichen', favorites: 'Favoriten', feedback: 'Feedback', purchases: 'Käufe', profile: 'Profil', language: 'Sprache', selectLanguage: 'Sprache wählen', signIn: 'Anmelden', signOut: 'Abmelden' },
  pt: { ...en, home: 'Início', browseApps: 'Explorar apps', newApps: 'Novos apps', topApps: 'Top apps', submitApp: 'Enviar app', favorites: 'Favoritos', feedback: 'Feedback', purchases: 'Compras', profile: 'Perfil', language: 'Idioma', selectLanguage: 'Selecionar idioma', signIn: 'Entrar', signOut: 'Sair' },
  ar: { ...en, home: 'الرئيسية', browseApps: 'تصفح التطبيقات', newApps: 'تطبيقات جديدة', topApps: 'أفضل التطبيقات', submitApp: 'إرسال تطبيق', favorites: 'المفضلة', feedback: 'ملاحظات', purchases: 'المشتريات', profile: 'الملف الشخصي', language: 'اللغة', selectLanguage: 'اختر اللغة', signIn: 'تسجيل الدخول', signOut: 'تسجيل الخروج' },
  hi: { ...en, home: 'होम', browseApps: 'ऐप्स ब्राउज़ करें', newApps: 'नए ऐप्स', topApps: 'टॉप ऐप्स', submitApp: 'ऐप जमा करें', favorites: 'पसंदीदा', feedback: 'प्रतिक्रिया', purchases: 'खरीदारी', profile: 'प्रोफ़ाइल', language: 'भाषा', selectLanguage: 'भाषा चुनें', signIn: 'साइन इन', signOut: 'साइन आउट' },
  ru: { ...en, home: 'Главная', browseApps: 'Обзор приложений', newApps: 'Новые приложения', topApps: 'Лучшие приложения', submitApp: 'Отправить приложение', favorites: 'Избранное', feedback: 'Отзывы', purchases: 'Покупки', profile: 'Профиль', language: 'Язык', selectLanguage: 'Выберите язык', signIn: 'Войти', signOut: 'Выйти' },
};

const storageKey = 'openapp.language';
function detectLanguage(): LanguageCode { const saved = localStorage.getItem(storageKey) as LanguageCode | null; if (saved && dictionaries[saved]) return saved; const browser = navigator.language.split('-')[0] as LanguageCode; return dictionaries[browser] ? browser : 'en'; }

const I18nContext = createContext<{ language: LanguageCode; setLanguage: (language: LanguageCode) => void; t: (key: string) => string }>({ language: 'en', setLanguage: () => undefined, t: (key) => en[key] ?? key });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => detectLanguage());
  const setLanguage = (next: LanguageCode) => { const safe = dictionaries[next] ? next : 'en'; localStorage.setItem(storageKey, safe); setLanguageState(safe); };
  useEffect(() => { const meta = languages.find((l) => l.code === language); document.documentElement.lang = language; document.documentElement.dir = meta?.dir ?? 'ltr'; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: string) => dictionaries[language]?.[key] ?? en[key] ?? key }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }

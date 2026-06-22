import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ar: {
    translation: {
      nav: {
        home: "الرئيسية",
        browse: "تصفح الدروس",
        login: "تسجيل الدخول",
        signup: "إنشاء حساب",
        dashboard: "لوحة التحكم",
        logout: "تسجيل الخروج",
      },
      landing: {
        hero: "اسأل معلمك الخاص",
        subtitle: "منصة تعليمية جزائرية تربط الطلاب بالمدرسين لدورات فيديو وجلوس مباشرة",
        cta: "ابدأ الآن",
        browse: "تصفح المدرسين",
      },
      auth: {
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        name: "الاسم الكامل",
        login: "تسجيل الدخول",
        signup: "إنشاء حساب",
        student: "طالب",
        teacher: "معلم",
        noAccount: "ليس لديك حساب؟",
        hasAccount: "لديك حساب بالفعل؟",
      },
      common: {
        loading: "جاري التحميل...",
        save: "حفظ",
        cancel: "إلغاء",
        edit: "تعديل",
        delete: "حذف",
        search: "بحث",
        filter: "تصفية",
        all: "الكل",
        back: "رجوع",
      },
    },
  },
  fr: {
    translation: {
      nav: {
        home: "Accueil",
        browse: "Parcourir",
        login: "Connexion",
        signup: "S'inscrire",
        dashboard: "Tableau de bord",
        logout: "Déconnexion",
      },
      landing: {
        hero: "Trouvez votre tuteur",
        subtitle: "Plateforme éducative algérienne connectant étudiants et tuteurs pour des cours vidéo et sessions en direct",
        cta: "Commencer",
        browse: "Voir les tuteurs",
      },
      auth: {
        email: "E-mail",
        password: "Mot de passe",
        name: "Nom complet",
        login: "Se connecter",
        signup: "S'inscrire",
        student: "Étudiant",
        teacher: "Enseignant",
        noAccount: "Pas encore de compte ?",
        hasAccount: "Déjà un compte ?",
      },
      common: {
        loading: "Chargement...",
        save: "Enregistrer",
        cancel: "Annuler",
        edit: "Modifier",
        delete: "Supprimer",
        search: "Rechercher",
        filter: "Filtrer",
        all: "Tout",
        back: "Retour",
      },
    },
  },
  en: {
    translation: {
      nav: {
        home: "Home",
        browse: "Browse",
        login: "Login",
        signup: "Sign Up",
        dashboard: "Dashboard",
        logout: "Logout",
      },
      landing: {
        hero: "Find Your Tutor",
        subtitle: "Algerian educational platform connecting students with tutors for video courses and live sessions",
        cta: "Get Started",
        browse: "Browse Tutors",
      },
      auth: {
        email: "Email",
        password: "Password",
        name: "Full Name",
        login: "Log In",
        signup: "Sign Up",
        student: "Student",
        teacher: "Teacher",
        noAccount: "Don't have an account?",
        hasAccount: "Already have an account?",
      },
      common: {
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        search: "Search",
        filter: "Filter",
        all: "All",
        back: "Back",
      },
    },
  },
};

const savedLang = typeof localStorage !== "undefined" ? localStorage.getItem("moualim-lang") : null;

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang ?? "ar",
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

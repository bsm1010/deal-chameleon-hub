import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  GraduationCap,
  ArrowLeft,
  Star,
  BookOpen,
  Users,
  Award,
  Clock,
  CreditCard,
  Video,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Play,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const subjects = [
  { id: "math", name: "الرياضيات", nameKey: "subjects.math", icon: "📐", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "physics", name: "العلوم الفيزيائية", nameKey: "subjects.physics", icon: "⚛️", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "biology", name: "العلوم الطبيعية", nameKey: "subjects.biology", icon: "🧬", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  { id: "arabic", name: "اللغة العربية", nameKey: "subjects.arabic", icon: "📖", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "french", name: "اللغة الفرنسية", nameKey: "subjects.french", icon: "🇫🇷", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  { id: "english", name: "اللغة الإنجليزية", nameKey: "subjects.english", icon: "🌐", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  { id: "history-geo", name: "التاريخ والجغرافيا", nameKey: "subjects.historyGeo", icon: "🌍", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "philosophy", name: "الفلسفة", nameKey: "subjects.philosophy", icon: "🧠", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
];

const educationLevels = [
  { id: "primary", name: "ابتدائي", nameKey: "levels.primary" },
  { id: "middle", name: "متوسط", nameKey: "levels.middle" },
  { id: "secondary1", name: "ثانوي 1", nameKey: "levels.secondary1" },
  { id: "secondary2", name: "ثانوي 2", nameKey: "levels.secondary2" },
  { id: "bac", name: "BAC", nameKey: "levels.bac" },
  { id: "university", name: "جامعي", nameKey: "levels.university" },
];

const howItWorks = [
  { step: 1, icon: UserPlusIcon, titleKey: "howItWorks.step1.title", descKey: "howItWorks.step1.desc" },
  { step: 2, icon: SearchIcon, titleKey: "howItWorks.step2.title", descKey: "howItWorks.step2.desc" },
  { step: 3, icon: PlayIcon, titleKey: "howItWorks.step3.title", descKey: "howItWorks.step3.desc" },
];

const testimonials = [
  {
    name: "أحمد",
    location: "الجزائر",
    role: "طالب ثانوي",
    rating: 5,
    textKey: "testimonials.ahmed.text",
    avatar: "👨‍🎓",
  },
  {
    name: "سارة",
    location: "وهران",
    role: "ثانوي السنة الثانية",
    rating: 5,
    textKey: "testimonials.sarah.text",
    avatar: "👩‍🎓",
  },
  {
    name: "يوسف",
    location: "قسنطينة",
    role: "طالب جامعي",
    rating: 4,
    textKey: "testimonials.youcef.text",
    avatar: "🧑‍🎓",
  },
];

function UserPlusIcon({ className }: { className?: string }) {
  return <Users className={className} />;
}
function SearchIcon({ className }: { className?: string }) {
  return <Search className={className} />;
}
function PlayIcon({ className }: { className?: string }) {
  return <Play className={className} />;
}

interface TutorProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  subjects: string[];
  rating: number;
  hourly_rate: number;
  bio: string | null;
}

const placeholderTutors: TutorProfile[] = [
  { id: "1", full_name: "محمد أمين", avatar_url: null, subjects: ["الرياضيات", "الفيزياء"], rating: 4.9, hourly_rate: 1500, bio: "مدرس خبرة 8 سنوات" },
  { id: "2", full_name: "فاطمة الزهراء", avatar_url: null, subjects: ["اللغة العربية", "التاريخ"], rating: 4.8, hourly_rate: 1200, bio: "معلمة متميزة" },
  { id: "3", full_name: "عبد الرحمن", avatar_url: null, subjects: ["الفيزياء", "علوم"], rating: 4.7, hourly_rate: 1800, bio: "دكتور في الفيزياء" },
  { id: "4", full_name: "نورة", avatar_url: null, subjects: ["اللغة الفرنسية", "الإنجليزية"], rating: 4.9, hourly_rate: 1400, bio: "مترجمة معتمدة" },
  { id: "5", full_name: "ياسين", avatar_url: null, subjects: ["الفلسفة", "الرياضيات"], rating: 4.6, hourly_rate: 1600, bio: "أستاذ جامعي" },
  { id: "6", full_name: "مريم", avatar_url: null, subjects: ["العلوم الطبيعية", "الكيمياء"], rating: 4.8, hourly_rate: 1300, bio: "مختصة في العلوم" },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const subjectsScrollRef = useRef<HTMLDivElement>(null);
  const tutorsScrollRef = useRef<HTMLDivElement>(null);

  const heroAnim = useScrollReveal();
  const subjectsAnim = useScrollReveal();
  const levelsAnim = useScrollReveal();
  const tutorsAnim = useScrollReveal();
  const howItWorksAnim = useScrollReveal();
  const testimonialsAnim = useScrollReveal();
  const ctaAnim = useScrollReveal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_profiles" as any)
        .select("id, full_name, avatar_url, subjects, rating, hourly_rate, bio")
        .eq("verification_status", "approved")
        .order("rating", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching tutors:", error);
        setTutors(placeholderTutors);
      } else {
        setTutors(data && data.length > 0 ? data : placeholderTutors);
      }
    } catch {
      setTutors(placeholderTutors);
    }
  };

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const scrollSubjects = (direction: "left" | "right") => {
    if (subjectsScrollRef.current) {
      const scrollAmount = direction === "right" ? -300 : 300;
      subjectsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollTutors = (direction: "left" | "right") => {
    if (tutorsScrollRef.current) {
      const scrollAmount = direction === "right" ? -320 : 320;
      tutorsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md" : "bg-background/80 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">{t("app.name", "معلم")}</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/browse" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {t("nav.browse", "استعرض المدرسين")}
              </Link>
              <Link to="/how-it-works" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {t("nav.howItWorks", "كيف يعمل")}
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {t("nav.pricing", "الأسعار")}
              </Link>
              <Link to="/signup/teacher" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {t("nav.becomeTeacher", "انضم كمدرس")}
              </Link>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {["ar", "fr", "en"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => switchLanguage(lang)}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      i18n.language === lang
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>

              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t("nav.login", "تسجيل الدخول")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/browse">{t("nav.startLearning", "ابدأ التعلم")}</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <Link to="/browse" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.browse", "استعرض المدرسين")}
              </Link>
              <Link to="/how-it-works" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.howItWorks", "كيف يعمل")}
              </Link>
              <Link to="/pricing" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.pricing", "الأسعار")}
              </Link>
              <Link to="/signup/teacher" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.becomeTeacher", "انضم كمدرس")}
              </Link>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="flex-1" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.login", "تسجيل الدخول")}
                  </Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link to="/browse" onClick={() => setMobileMenuOpen(false)}>
                    {t("nav.startLearning", "ابدأ التعلم")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        ref={heroAnim.ref}
        className="relative min-h-screen flex items-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial="hidden"
            animate={heroAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {t("hero.title", "تعلّم مع أفضل المدرسين الجزائريين")}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("hero.subtitle", "دروس فيديو وحصص مباشرة في جميع المواد — من الابتدائي إلى الجامعة")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" asChild>
                <Link to="/browse">
                  {t("hero.ctaPrimary", "ابدأ التعلم مجاناً")}
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/signup/teacher">
                  {t("hero.ctaSecondary", "أنا مدرس")}
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              animate={heroAnim.isVisible ? "visible" : "hidden"}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {[
                { value: "500+", label: t("hero.stats.teachers", "مدرس"), icon: Users },
                { value: "10,000+", label: t("hero.stats.students", "طالب"), icon: GraduationCap },
                { value: "50+", label: t("hero.stats.subjects", "مادة"), icon: BookOpen },
                { value: "4.8 ★", label: t("hero.stats.rating", "تقييم"), icon: Star },
              ].map((stat) => (
                <motion.div key={stat.label} variants={staggerItem} className="text-center">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Subjects Section */}
      <section ref={subjectsAnim.ref} className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={subjectsAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                {t("subjects.title", "استعرض حسب المادة")}
              </h2>
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={() => scrollSubjects("right")}
                  className="p-2 rounded-full bg-background border hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollSubjects("left")}
                  className="p-2 rounded-full bg-background border hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          <div ref={subjectsScrollRef} className="overflow-x-auto pb-4 -mx-4 px-4">
            <motion.div
              initial="hidden"
              animate={subjectsAnim.isVisible ? "visible" : "hidden"}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              style={{ minWidth: "max-content" }}
            >
              {subjects.map((subject) => (
                <motion.div key={subject.id} variants={staggerItem}>
                  <Link
                    to={`/browse?subject=${subject.id}`}
                    className="block"
                  >
                    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-background hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${subject.color}`}>
                        {subject.icon}
                      </div>
                      <span className="text-sm font-medium text-foreground">{subject.name}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Education Levels */}
      <section ref={levelsAnim.ref} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={levelsAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              {t("levels.title", "اختر مستواك الدراسي")}
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={levelsAnim.isVisible ? "visible" : "hidden"}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-3"
          >
            {educationLevels.map((level) => (
              <motion.div key={level.id} variants={staggerItem}>
                <Link to={`/browse?level=${level.id}`}>
                  <Badge
                    variant="secondary"
                    className="px-6 py-3 text-base font-medium rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
                  >
                    {level.name}
                  </Badge>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Tutors */}
      <section ref={tutorsAnim.ref} className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={tutorsAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                {t("tutors.title", "أفضل المدرسين")}
              </h2>
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={() => scrollTutors("right")}
                  className="p-2 rounded-full bg-background border hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollTutors("left")}
                  className="p-2 rounded-full bg-background border hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          <div ref={tutorsScrollRef} className="overflow-x-auto pb-4 -mx-4 px-4">
            <motion.div
              initial="hidden"
              animate={tutorsAnim.isVisible ? "visible" : "hidden"}
              variants={staggerContainer}
              className="flex gap-6"
              style={{ minWidth: "max-content" }}
            >
              {tutors.map((tutor) => (
                <motion.div key={tutor.id} variants={staggerItem}>
                  <div className="w-72 bg-background rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                        {tutor.avatar_url ? (
                          <img src={tutor.avatar_url} alt={tutor.full_name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          tutor.full_name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{tutor.full_name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-muted-foreground">{tutor.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tutor.subjects?.slice(0, 3).map((sub) => (
                        <Badge key={sub} variant="outline" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                    {tutor.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tutor.bio}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{tutor.hourly_rate} {t("tutors.dzd", "دج")}/ساعة</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/teacher/${tutor.id}`}>
                          {t("tutors.viewProfile", "عرض الملف")}
                          <ArrowLeft className="w-4 h-4 mr-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howItWorksAnim.ref} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={howItWorksAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
              {t("howItWorks.title", "كيف يعمل معلم؟")}
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={howItWorksAnim.isVisible ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {howItWorks.map((item) => (
              <motion.div key={item.step} variants={staggerItem} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t(item.titleKey)}
                </h3>
                <p className="text-muted-foreground">
                  {t(item.descKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsAnim.ref} className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={testimonialsAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
              {t("testimonials.title", "ماذا يقول طلابنا")}
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={testimonialsAnim.isVisible ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.name} variants={staggerItem}>
                <div className="bg-background rounded-2xl border p-6 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < testimonial.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">
                    {t(testimonial.textKey)}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.location} — {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Become a Teacher CTA */}
      <section ref={ctaAnim.ref} className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate={ctaAnim.isVisible ? "visible" : "hidden"}
            variants={containerVariants}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              {t("cta.title", "هل أنت مدرس؟ شارك علمك واكسب من الإنترنت")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {[
                { icon: Clock, textKey: "cta.benefit1" },
                { icon: CreditCard, textKey: "cta.benefit2" },
                { icon: Video, textKey: "cta.benefit3" },
              ].map((benefit) => (
                <div key={benefit.textKey} className="flex flex-col items-center gap-3">
                  <benefit.icon className="w-8 h-8 text-white/80" />
                  <span className="text-white/90">{t(benefit.textKey)}</span>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="lg" asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/signup/teacher">
                {t("cta.button", "انضم كمدرس — مجاناً")}
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold text-primary">معلم</span>
              </Link>
              <p className="text-background/60 text-sm leading-relaxed mb-6">
                {t("footer.tagline", "المنصة الأولى للمدرسين والطلاب في الجزائر. تعلّم بسهولة مع أفضل المدرسين.")}
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.platform", "المنصة")}</h3>
              <ul className="space-y-3">
                <li><Link to="/browse" className="text-background/60 hover:text-background text-sm transition-colors">{t("nav.browse", "استعرض المدرسين")}</Link></li>
                <li><Link to="/how-it-works" className="text-background/60 hover:text-background text-sm transition-colors">{t("nav.howItWorks", "كيف يعمل")}</Link></li>
                <li><Link to="/pricing" className="text-background/60 hover:text-background text-sm transition-colors">{t("nav.pricing", "الأسعار")}</Link></li>
                <li><Link to="/signup/teacher" className="text-background/60 hover:text-background text-sm transition-colors">{t("nav.becomeTeacher", "انضم كمدرس")}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.support", "الدعم")}</h3>
              <ul className="space-y-3">
                <li><Link to="/faq" className="text-background/60 hover:text-background text-sm transition-colors">{t("footer.faq", "الأسئلة الشائعة")}</Link></li>
                <li><Link to="/contact" className="text-background/60 hover:text-background text-sm transition-colors">{t("footer.contact", "تواصل معنا")}</Link></li>
                <li><Link to="/help" className="text-background/60 hover:text-background text-sm transition-colors">{t("footer.help", "مركز المساعدة")}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.legal", "قانوني")}</h3>
              <ul className="space-y-3">
                <li><Link to="/terms" className="text-background/60 hover:text-background text-sm transition-colors">{t("footer.terms", "شروط الاستخدام")}</Link></li>
                <li><Link to="/privacy" className="text-background/60 hover:text-background text-sm transition-colors">{t("footer.privacy", "سياسة الخصوصية")}</Link></li>
              </ul>
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-background/60 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>contact@moualim.dz</span>
                </div>
                <div className="flex items-center gap-2 text-background/60 text-sm">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">+213 XX XX XX XX</span>
                </div>
                <div className="flex items-center gap-2 text-background/60 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{t("footer.location", "الجزائر العاصمة")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-background/10 pt-8 text-center">
            <p className="text-background/40 text-sm">
              © {new Date().getFullYear()} {t("app.name", "معلم")}. {t("footer.rights", "جميع الحقوق محفوظة.")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

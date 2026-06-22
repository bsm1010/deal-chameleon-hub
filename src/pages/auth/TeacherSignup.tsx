import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  User,
  BookOpen,
  FileCheck,
  ClipboardCheck,
} from "lucide-react";

const WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار",
  "البليدة","البويرة","تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر",
  "الجلفة","جيجل","سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة",
  "قسنطينة","المدية","عمالة المسيلة","معسكر","ورقلة","وهران","البيض","إليزي",
  "برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي","خنشلة",
  "سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تموشنت","غرداية",
  "غليزان","تيميمون","برج باجي مختار","أولاد جلال","بني عباس","عين صالح",
  "عين قزام","توقرت","جانت","المغير","المنيعة",
];

const SUBJECTS = [
  "الرياضيات",
  "الفيزياء",
  "البيولوجيا",
  "العربية",
  "الفرنسية",
  "الإنجليزية",
  "التاريخ والجغرافيا",
  "الفلسفة",
  "الإعلام الآلي",
  "اللغة الأمازيغية",
];

const EDUCATION_LEVELS = ["ابتدائي", "متوسط", "ثانوي", "جامعي"];

const EXPERIENCE_OPTIONS = [
  "0-1 سنوات",
  "1-3 سنوات",
  "3-5 سنوات",
  "5-10 سنوات",
  "+10 سنوات",
];

const baseSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string(),
  phone: z
    .string()
    .min(10, "رقم الهاتف غير صالح")
    .max(10, "رقم الهاتف غير صالح"),
  wilaya: z.string().min(1, "الولاية مطلوبة"),
  subjects: z
    .array(z.string())
    .min(1, "اختر مادة واحدة على الأقل"),
  educationLevels: z
    .array(z.string())
    .min(1, "اختر مستوى تعليمي واحد على الأقل"),
  yearsExperience: z.string().min(1, "اختر سنوات الخبرة"),
  bio: z
    .string()
    .min(50, "النبذة يجب أن تكون 50 حرف على الأقل")
    .max(500, "النبذة يجب ألا تتجاوز 500 حرف"),
  diploma: z.string().min(2, "الشهادة مطلوبة"),
  ccpNumber: z.string().min(4, "رقم CCP غير صالح"),
  isQualified: z.boolean().refine((v) => v === true, {
    message: "يجب تأكيد أنك معلم مؤهل",
  }),
  termsAgreed: z.boolean().refine((v) => v === true, {
    message: "يجب الموافقة على الشروط",
  }),
});

type FormData = z.infer<typeof baseSchema>;

const stepSchemas = [
  baseSchema.pick({
    fullName: true,
    email: true,
    password: true,
    confirmPassword: true,
    phone: true,
    wilaya: true,
  }).extend({
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  }),
  baseSchema.pick({
    subjects: true,
    educationLevels: true,
    yearsExperience: true,
    bio: true,
  }),
  baseSchema.pick({
    diploma: true,
    ccpNumber: true,
    isQualified: true,
  }),
  baseSchema.pick({
    termsAgreed: true,
  }),
];

const STEP_FIELDS: (keyof FormData)[][] = [
  ["fullName", "email", "password", "confirmPassword", "phone", "wilaya"],
  ["subjects", "educationLevels", "yearsExperience", "bio"],
  ["diploma", "ccpNumber", "isQualified"],
  ["termsAgreed"],
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function TeacherSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      wilaya: "",
      subjects: [],
      educationLevels: [],
      yearsExperience: "",
      bio: "",
      diploma: "",
      ccpNumber: "",
      isQualified: false,
      termsAgreed: false,
    },
  });

  const watchedSubjects = watch("subjects") || [];
  const watchedLevels = watch("educationLevels") || [];
  const watchedBio = watch("bio") || "";

  async function onNext() {
    const valid = await trigger(STEP_FIELDS[step] as any);
    if (valid) {
      setDirection(1);
      setStep((s) => Math.min(s + 1, 3));
    }
  }

  function onBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function toggleSubject(subject: string) {
    const current = watchedSubjects;
    if (current.includes(subject)) {
      setValue(
        "subjects",
        current.filter((s) => s !== subject),
        { shouldValidate: true }
      );
    } else {
      setValue("subjects", [...current, subject], { shouldValidate: true });
    }
  }

  function toggleLevel(level: string) {
    const current = watchedLevels;
    if (current.includes(level)) {
      setValue(
        "educationLevels",
        current.filter((l) => l !== level),
        { shouldValidate: true }
      );
    } else {
      setValue("educationLevels", [...current, level], { shouldValidate: true });
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميغابايت");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(data: FormData) {
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "teacher",
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        toast.error(authError.message === "User already registered"
          ? "هذا البريد الإلكتروني مسجل بالفعل"
          : "حدث خطأ أثناء إنشاء الحساب");
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        toast.error("حدث خطأ غير متوقع");
        setLoading(false);
        return;
      }

      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const filePath = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          avatarUrl = urlData.publicUrl;
        }
      }

      const { error: profileError } = await supabase
        .from("teacher_profiles")
        .insert({
          id: userId,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          wilaya: data.wilaya,
          avatar_url: avatarUrl,
          subjects: data.subjects,
          education_levels: data.educationLevels,
          years_experience: data.yearsExperience,
          bio: data.bio,
          diploma: data.diploma,
          ccp_number: data.ccpNumber,
          verification_status: "pending",
        });

      if (profileError) {
        toast.error("حدث خطأ أثناء حفظ الملف الشخصي");
        setLoading(false);
        return;
      }

      await supabase.from("admin_notifications").insert({
        type: "new_teacher_application",
        title: "طلب تسجيل معلم جديد",
        message: `المعلم ${data.fullName} قدم طلب تسجيل. يرجى مراجعة ملفه الشخصي.`,
        user_id: userId,
        read: false,
      });

      toast.success("تم إرسال طلبك بنجاح! سيتم مراجعة حسابك خلال 24-48 ساعة.");
      reset();
      setAvatarFile(null);
      setAvatarPreview(null);
      navigate("/dashboard/teacher");
    } catch {
      toast.error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  const stepIcons = [User, BookOpen, FileCheck, ClipboardCheck];
  const stepTitles = [
    "المعلومات الأساسية",
    "الملف التعليمي",
    "الشهادات والمدفوعات",
    "المراجعة والإرسال",
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="text-3xl font-bold text-primary">
            معلم Moualim
          </Link>
          <p className="text-muted-foreground mt-2">تسجيل حساب معلم جديد</p>
        </div>

        <div className="rounded-[12px] bg-card p-8 shadow-sm border border-border">
          <div className="flex items-center justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      i < step
                        ? "bg-primary text-primary-foreground"
                        : i === step
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {i < 3 && (
                    <div
                      className={`h-0.5 w-8 rounded transition-colors ${
                        i < step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="text-lg font-semibold text-center mb-6">
            {stepTitles[step]}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <div>
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        {...register("fullName")}
                        placeholder="محمد أحمد"
                        className="mt-1"
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="you@example.com"
                        className="mt-1"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">كلمة المرور</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">
                        تأكيد كلمة المرور
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmPassword")}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register("phone")}
                        placeholder="0555123456"
                        className="mt-1"
                        dir="ltr"
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>الولاية</Label>
                      <Select
                        value={watch("wilaya")}
                        onValueChange={(val) =>
                          setValue("wilaya", val, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر ولايتك" />
                        </SelectTrigger>
                        <SelectContent>
                          {WILAYAS.map((w, i) => (
                            <SelectItem key={w} value={w}>
                              {i + 1}. {w}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.wilaya && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.wilaya.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <Label>المواد التعليمية</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        اختر المواد التي تُدرّسها
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.map((subject) => (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => toggleSubject(subject)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              watchedSubjects.includes(subject)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                      {errors.subjects && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.subjects.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>المستويات التعليمية</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        اختر المستويات التي تُدرّس لها
                      </p>
                      <div className="space-y-2">
                        {EDUCATION_LEVELS.map((level) => (
                          <div key={level} className="flex items-center gap-2">
                            <Checkbox
                              id={`level-${level}`}
                              checked={watchedLevels.includes(level)}
                              onCheckedChange={() => toggleLevel(level)}
                            />
                            <Label
                              htmlFor={`level-${level}`}
                              className="cursor-pointer"
                            >
                              {level}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {errors.educationLevels && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.educationLevels.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>سنوات الخبرة</Label>
                      <Select
                        value={watch("yearsExperience")}
                        onValueChange={(val) =>
                          setValue("yearsExperience", val, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر سنوات الخبرة" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.yearsExperience && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.yearsExperience.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="bio">نبذة عنك</Label>
                      <Textarea
                        id="bio"
                        {...register("bio")}
                        placeholder="اكتب نبذة مختصرة عن خبرتك التعليمية وتخصصك..."
                        className="mt-1"
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground mt-1 text-left">
                        {watchedBio.length}/500
                      </p>
                      {errors.bio && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.bio.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <Label>الصورة الشخصية</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        اختياري - سيتم رفعها بعد إنشاء الحساب
                      </p>
                      {avatarPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={avatarPreview}
                            alt="معاينة"
                            className="h-24 w-24 rounded-full object-cover border-2 border-border"
                          />
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            اضغط لرفع صورة
                          </span>
                          <span className="text-xs text-muted-foreground">
                            JPG, PNG - حد أقصى 2MB
                          </span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <Label htmlFor="diploma">الشهادة / الشهادات</Label>
                      <Input
                        id="diploma"
                        {...register("diploma")}
                        placeholder="مثال: ليسانس في الرياضيات - جامعة الجزائر"
                        className="mt-1"
                      />
                      {errors.diploma && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.diploma.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ccpNumber">رقم CCP</Label>
                      <Input
                        id="ccpNumber"
                        {...register("ccpNumber")}
                        placeholder="مثال: 1234567890"
                        className="mt-1"
                        dir="ltr"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        رقم الحساب البريدي الجاري لتحويل الأرباح
                      </p>
                      {errors.ccpNumber && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.ccpNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="isQualified"
                        checked={watch("isQualified")}
                        onCheckedChange={(v) =>
                          setValue("isQualified", v as boolean, {
                            shouldValidate: true,
                          })
                        }
                      />
                      <Label htmlFor="isQualified" className="cursor-pointer">
                        أنا معلم مؤهل ولديّ الشهادات اللازمة
                      </Label>
                    </div>
                    {errors.isQualified && (
                      <p className="text-sm text-destructive">
                        {errors.isQualified.message}
                      </p>
                    )}
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                      <h4 className="font-semibold">ملخص طلبك</h4>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">الاسم:</span>
                          <p className="font-medium">{watch("fullName")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            البريد:
                          </span>
                          <p className="font-medium">{watch("email")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            الهاتف:
                          </span>
                          <p className="font-medium" dir="ltr">
                            {watch("phone")}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            الولاية:
                          </span>
                          <p className="font-medium">{watch("wilaya")}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-sm">
                          المواد:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {watchedSubjects.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-sm">
                          المستويات:
                        </span>
                        <p className="font-medium text-sm">
                          {watchedLevels.join("، ")}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-sm">
                          الخبرة:
                        </span>
                        <p className="font-medium text-sm">
                          {watch("yearsExperience")}
                        </p>
                      </div>

                      <div>
                        <span className="text-muted-foreground text-sm">
                          النبذة:
                        </span>
                        <p className="text-sm">{watchedBio}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            الشهادة:
                          </span>
                          <p className="font-medium">{watch("diploma")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            رقم CCP:
                          </span>
                          <p className="font-medium" dir="ltr">
                            {watch("ccpNumber")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300">
                          ملاحظة مهمة
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                          سيتم مراجعة طلبك من قبل فريق الإدارة خلال 24-48 ساعة.
                          ستصلك رسالة تأكيد على بريدك الإلكتروني عند الموافقة على
                          حسابك.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="termsAgreed"
                        checked={watch("termsAgreed")}
                        onCheckedChange={(v) =>
                          setValue("termsAgreed", v as boolean, {
                            shouldValidate: true,
                          })
                        }
                      />
                      <Label htmlFor="termsAgreed" className="cursor-pointer text-sm">
                        أوافق على{" "}
                        <Link
                          to="/terms"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          الشروط والأحكام
                        </Link>{" "}
                        و{" "}
                        <Link
                          to="/privacy"
                          className="text-primary hover:underline"
                          target="_blank"
                        >
                          سياسة الخصوصية
                        </Link>
                      </Label>
                    </div>
                    {errors.termsAgreed && (
                      <p className="text-sm text-destructive">
                        {errors.termsAgreed.message}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="rounded-[8px]"
                  disabled={loading}
                >
                  <ArrowRight className="h-4 w-4 ml-1" />
                  السابق
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={onNext}
                  className="rounded-[8px]"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4 mr-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="rounded-[8px]"
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner size="sm" className="text-white" />
                  ) : (
                    "أرسل طلبي"
                  )}
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary hover:underline">
              سجل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

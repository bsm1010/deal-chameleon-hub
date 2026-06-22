import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة",
  "بشار", "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت",
  "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة",
  "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة",
  "معسكر", "ورقلة", "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس",
  "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس", "تيبازة",
  "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان",
  "تيميمون", "برج باجي مختار", "أولاد جلال", "بني عباس", "عين صالح",
  "عين قزام", "توقرت", "جانت", "المغير", "المنيعة",
];

const EDUCATION_LEVELS = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "متوسط" },
  { value: "secondary_1", label: "ثانوي 1" },
  { value: "secondary_2", label: "ثانوي 2" },
  { value: "secondary_3", label: "ثانوي 3 (BAC)" },
  { value: "bachelor", label: "جامععي ليسانس" },
  { value: "master", label: "جامععي ماستر" },
  { value: "other", label: "أخرى" },
];

const SUBJECTS = [
  "الرياضيات", "الفيزياء", "البيولوجيا", "العربية", "الفرنسية",
  "الإنجليزية", "التاريخ", "الجغرافيا", "الفلسفة", "الإعلام الآلي",
  "اللغة الأمازيغية",
];

const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

const step1Schema = z.object({
  full_name: z.string().min(2, "الاسم الكامل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(0[5-7]\d{8})$/.test(val),
      "رقم الهاتف غير صحيح (مثال: 0555123456)"
    ),
  wilaya: z.string().min(1, "الولاية مطلوبة"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  birth_year: z.string().min(1, "سنة الميلاد مطلوبة"),
  education_level: z.string().min(1, "مستوى التعليم مطلوب"),
  subjects_of_interest: z
    .array(z.string())
    .min(1, "اختر مادة واحدة على الأقل")
    .max(5, "5 مواد كحد أقصى"),
});

const step3Schema = z.object({
  agree_terms: z.literal(true, {
    errorMap: () => ({ message: "يجب الموافقة على الشروط والأحكام" }),
  }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

function PasswordStrength({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "جيدة", "قوية"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score - 1] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        قوة كلمة المرور: {labels[Math.max(0, score - 1)] || "ضعيفة جداً"}
      </p>
    </div>
  );
}

export default function StudentSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      wilaya: "",
    },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      birth_year: "",
      education_level: "",
      subjects_of_interest: [],
    },
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      agree_terms: false as unknown as true,
    },
  });

  const password = form1.watch("password");

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    setStep(3);
  };

  const onStep3Submit = async () => {
    if (!step1Data || !step2Data) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: step1Data.email,
        password: step1Data.password,
        options: {
          data: {
            role: "student",
            full_name: step1Data.full_name,
          },
        },
      });

      if (authError) {
        toast.error(authError.message === "User already registered"
          ? "هذا البرد مسجّل بالفعل"
          : "حدث خطأ أثناء إنشاء الحساب");
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("student_profiles")
          .insert({
            user_id: authData.user.id,
            birth_year: parseInt(step2Data.birth_year),
            education_level: step2Data.education_level,
            subjects_of_interest: step2Data.subjects_of_interest,
            phone: step1Data.phone || null,
            wilaya: step1Data.wilaya,
          });

        if (profileError) {
          toast.error("حدث خطأ أثناء حفظ الملف الشخصي");
          setLoading(false);
          return;
        }
      }

      toast.success("تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني للتأكيد");
      navigate("/dashboard/student");
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const direction = 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">
            معلم Moualim
          </Link>
        </div>

        <div className="rounded-[12px] bg-card p-8 shadow-sm border border-border">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      s < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden min-h-[400px]">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <h2 className="text-xl font-bold mb-1">المعلومات الأساسية</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    أدخل معلوماتك الشخصية
                  </p>

                  <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">الاسم الكامل *</Label>
                      <Input
                        id="full_name"
                        className="mt-1"
                        placeholder="أدخل اسمك الكامل"
                        {...form1.register("full_name")}
                      />
                      {form1.formState.errors.full_name && (
                        <p className="text-sm text-destructive mt-1">
                          {form1.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        className="mt-1"
                        placeholder="you@example.com"
                        {...form1.register("email")}
                      />
                      {form1.formState.errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {form1.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">كلمة المرور *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="8 أحرف على الأقل"
                          {...form1.register("password")}
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
                      <PasswordStrength password={password} />
                      {form1.formState.errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {form1.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="أعد إدخال كلمة المرور"
                          {...form1.register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {form1.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive mt-1">
                          {form1.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        className="mt-1"
                        placeholder="0555123456"
                        dir="ltr"
                        {...form1.register("phone")}
                      />
                      {form1.formState.errors.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {form1.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>الولاية *</Label>
                      <Select
                        value={form1.watch("wilaya")}
                        onValueChange={(val) => form1.setValue("wilaya", val)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر ولايتك" />
                        </SelectTrigger>
                        <SelectContent>
                          {WILAYAS.map((wilaya, index) => (
                            <SelectItem key={index + 1} value={wilaya}>
                              {String(index + 1).padStart(2, "0")} - {wilaya}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form1.formState.errors.wilaya && (
                        <p className="text-sm text-destructive mt-1">
                          {form1.formState.errors.wilaya.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full rounded-[8px]">
                      التالي
                      <ArrowLeft className="h-4 w-4 mr-1" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <h2 className="text-xl font-bold mb-1">الملف الأكاديمي</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    أدخل معلوماتك الدراسية
                  </p>

                  <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
                    <div>
                      <Label>سنة الميلاد *</Label>
                      <Select
                        value={form2.watch("birth_year")}
                        onValueChange={(val) => form2.setValue("birth_year", val)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر سنة ميلادك" />
                        </SelectTrigger>
                        <SelectContent>
                          {BIRTH_YEARS.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form2.formState.errors.birth_year && (
                        <p className="text-sm text-destructive mt-1">
                          {form2.formState.errors.birth_year.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>مستوى التعليم *</Label>
                      <RadioGroup
                        value={form2.watch("education_level")}
                        onValueChange={(val) => form2.setValue("education_level", val)}
                        className="mt-2 grid grid-cols-2 gap-2"
                      >
                        {EDUCATION_LEVELS.map((level) => (
                          <div key={level.value} className="flex items-center gap-2">
                            <RadioGroupItem
                              value={level.value}
                              id={level.value}
                            />
                            <Label htmlFor={level.value} className="cursor-pointer text-sm">
                              {level.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {form2.formState.errors.education_level && (
                        <p className="text-sm text-destructive mt-1">
                          {form2.formState.errors.education_level.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>مواد الاهتمام * (حد أقصى 5)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SUBJECTS.map((subject) => {
                          const selected = form2.watch("subjects_of_interest").includes(subject);
                          const count = form2.watch("subjects_of_interest").length;
                          return (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => {
                                const current = form2.getValues("subjects_of_interest");
                                if (selected) {
                                  form2.setValue(
                                    "subjects_of_interest",
                                    current.filter((s) => s !== subject)
                                  );
                                } else if (count < 5) {
                                  form2.setValue("subjects_of_interest", [
                                    ...current,
                                    subject,
                                  ]);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:bg-accent"
                              } ${!selected && count >= 5 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected && <X className="h-3 w-3" />}
                              {subject}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {form2.watch("subjects_of_interest").length}/5 مواد محددة
                      </p>
                      {form2.formState.errors.subjects_of_interest && (
                        <p className="text-sm text-destructive mt-1">
                          {form2.formState.errors.subjects_of_interest.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-[8px]"
                        onClick={() => setStep(1)}
                      >
                        <ArrowRight className="h-4 w-4 ml-1" />
                        السابق
                      </Button>
                      <Button type="submit" className="flex-1 rounded-[8px]">
                        التالي
                        <ArrowLeft className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <h2 className="text-xl font-bold mb-1">تأكيد المعلومات</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    راجع معلوماتك قبل إنشاء الحساب
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm">المعلومات الأساسية</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">الاسم: </span>
                          <span className="font-medium">{step1Data?.full_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">البريد: </span>
                          <span className="font-medium" dir="ltr">{step1Data?.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الهاتف: </span>
                          <span className="font-medium" dir="ltr">{step1Data?.phone || "غير محدد"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الولاية: </span>
                          <span className="font-medium">{step1Data?.wilaya}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                      <h3 className="font-semibold text-sm">الملف الأكاديمي</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">سنة الميلاد: </span>
                          <span className="font-medium">{step2Data?.birth_year}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المستوى: </span>
                          <span className="font-medium">
                            {EDUCATION_LEVELS.find(
                              (l) => l.value === step2Data?.education_level
                            )?.label}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">المواد: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step2Data?.subjects_of_interest.map((subject) => (
                            <span
                              key={subject}
                              className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agree_terms"
                        checked={form3.watch("agree_terms")}
                        onCheckedChange={(checked) =>
                          form3.setValue("agree_terms", checked as true)
                        }
                      />
                      <Label htmlFor="agree_terms" className="text-sm cursor-pointer leading-relaxed">
                        أوافق على{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          الشروط والأحكام
                        </Link>{" "}
                        و{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          سياسة الخصوصية
                        </Link>{" "}
                        الخاصة بالمنصة *
                      </Label>
                    </div>
                    {form3.formState.errors.agree_terms && (
                      <p className="text-sm text-destructive">
                        {form3.formState.errors.agree_terms.message}
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-[8px]"
                        onClick={() => setStep(2)}
                      >
                        <ArrowRight className="h-4 w-4 ml-1" />
                        السابق
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 rounded-[8px]"
                        disabled={loading}
                      >
                        {loading ? (
                          <Spinner size="sm" className="text-white" />
                        ) : (
                          "إنشاء حسابي"
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              تسجيل الدخول
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-2">
            أنت معلم؟{" "}
            <Link to="/signup/teacher" className="text-primary hover:underline font-medium">
              تسجيل كمعلم
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

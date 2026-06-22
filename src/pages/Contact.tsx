import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DMark } from "@/components/DMark";
import { toast } from "sonner";
import { Send, ArrowLeft } from "lucide-react";

export default function Contact() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("contact_requests").insert({
      name,
      email,
      message,
    });

    setLoading(false);

    if (error) {
      toast.error(t("common.error"));
      return;
    }

    toast.success(t("common.contactSuccess"));
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5">
            <DMark className="h-7 w-7 text-foreground" />
            <span className="font-bold text-lg tracking-tight text-foreground">Dealflow</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("common.contactUs")}</h1>
            <p className="text-muted-foreground">يسعدنا تلقي رسالتك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.fullName")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailLabel")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                t("common.loading")
              ) : (
                <>
                  <Send className="h-4 w-4 ml-1.5" />
                  إرسال الرسالة
                </>
              )}
            </Button>
          </form>
        </div>
      </main>

      <footer className="border-t border-border px-4 py-8">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <DMark className="h-5 w-5 text-muted-foreground" />
            <span className="font-bold text-sm tracking-tight text-muted-foreground">Dealflow</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">{t("landing.footer.platform")}</Link>
            <Link to="/browse" className="hover:text-foreground transition-colors">{t("nav.browse")}</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">{t("nav.login")}</Link>
          </div>
          <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} Dealflow</p>
        </div>
      </footer>
    </div>
  );
}

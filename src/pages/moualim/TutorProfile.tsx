import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold text-primary">معلم Moualim</a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-card bg-card p-8 shadow-sm border border-border">
            <div className="flex items-start gap-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                T
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">Tutor #{id}</h1>
                <p className="text-muted-foreground mb-3">Mathematics • Physics</p>
                <div className="flex gap-2 mb-4">
                  <Badge>Verified</Badge>
                  <Badge variant="secondary">5+ years</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Experienced educator specializing in mathematics and physics for Algerian students.
                  Available for live sessions and video courses.
                </p>
                <Button className="rounded-button">{t("nav.signup")}</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

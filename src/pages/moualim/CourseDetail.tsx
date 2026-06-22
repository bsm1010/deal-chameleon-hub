import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CourseDetail() {
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
            <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
              <span className="text-muted-foreground">Course Video Preview</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Course #{id}</h1>
            <p className="text-muted-foreground mb-4">by Tutor Name</p>
            <div className="flex gap-2 mb-4">
              <Badge>Mathematics</Badge>
              <Badge variant="secondary">24 lessons</Badge>
              <Badge variant="secondary">12h 30m</Badge>
            </div>
            <p className="text-muted-foreground mb-6">
              Comprehensive mathematics course covering algebra, geometry, and analysis.
              Suitable for baccalaureate preparation.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">5000 DZD</span>
              <Button size="lg" className="rounded-button">{t("nav.signup")}</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

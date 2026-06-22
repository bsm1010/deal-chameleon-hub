import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PurchaseFailed() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-[12px] bg-card p-8 shadow-sm border border-border">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("common.error")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("common.retry")}
          </p>

          <div className="space-y-3">
            <Button
              className="w-full rounded-[8px]"
              onClick={() => window.history.back()}
            >
              {t("common.retry")}
            </Button>
            <Link to="/browse">
              <Button variant="outline" className="w-full rounded-[8px]">
                {t("nav.browse")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

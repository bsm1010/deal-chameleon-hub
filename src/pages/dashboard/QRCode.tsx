import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRestaurant } from "@/hooks/useRestaurant";
import QRCodeLib from "qrcode";
import { jsPDF } from "jspdf";
import { DownloadIcon } from "@/lib/icons";

export default function QRCodePage() {
  const { user } = useAuth();
  const { data: restaurant } = useOwnerRestaurant(user?.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showLabel, setShowLabel] = useState(true);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (restaurant) {
      setQrUrl(`${window.location.origin}/restaurant/${restaurant.id}`);
    }
  }, [restaurant]);

  useEffect(() => {
    if (!canvasRef.current || !qrUrl) return;
    QRCodeLib.toCanvas(canvasRef.current, qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#1A1A2E", light: "#ffffff" },
    });
  }, [qrUrl, showLabel]);

  function downloadPNG() {
    if (!canvasRef.current || !restaurant) return;
    const canvas = canvasRef.current;

    const exportCanvas = document.createElement("canvas");
    const padding = 40;
    const labelHeight = showLabel ? 60 : 0;
    exportCanvas.width = canvas.width + padding * 2;
    exportCanvas.height = canvas.height + padding * 2 + labelHeight;
    const ctx = exportCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, padding, padding);

    if (showLabel) {
      ctx.fillStyle = "#1A1A2E";
      ctx.font = "bold 20px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(restaurant.name, exportCanvas.width / 2, canvas.height + padding + 40);
    }

    const link = document.createElement("a");
    link.download = `${restaurant.name}-qr.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  function downloadPDF() {
    if (!canvasRef.current || !restaurant) return;
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(26, 26, 46);
    pdf.text(restaurant.name, pageWidth / 2, 40, { align: "center" });

    const qrSize = 100;
    pdf.addImage(imgData, "PNG", (pageWidth - qrSize) / 2, 55, qrSize, qrSize);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Scan to see our menu", pageWidth / 2, 175, { align: "center" });
    pdf.text("امسح الرمز لرؤية القائمة", pageWidth / 2, 185, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(180, 180, 180);
    pdf.text("Menuly - menuly.app", pageWidth / 2, pageHeight - 20, { align: "center" });

    pdf.save(`${restaurant.name}-qr.pdf`);
  }

  if (!restaurant) {
    return <div className="bg-white rounded-2xl p-8 text-center text-gray-500">أنشئ ملف مطعمك أولاً</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1A1A2E]">رمز QR</h1>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center gap-6">
          {/* QR Preview */}
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 inline-block">
            <canvas ref={canvasRef} />
          </div>

          {showLabel && (
            <p className="text-lg font-bold text-[#1A1A2E]">{restaurant.name}</p>
          )}

          {/* Options */}
          <div className="w-full max-w-sm space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <span className="text-sm font-medium text-[#1A1A2E]">إظهار اسم المطعم</span>
              <div className={`relative w-11 h-6 rounded-full transition-colors ${showLabel ? "bg-[#FF6B35]" : "bg-gray-300"}`}
                onClick={() => setShowLabel(!showLabel)}>
                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ right: showLabel ? "2px" : "22px" }} />
              </div>
            </label>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={downloadPNG} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#e55a2b] transition-colors text-sm">
              <DownloadIcon className="h-4 w-4" />
              تحميل PNG
            </button>
            <button onClick={downloadPDF} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1A1A2E] text-white rounded-xl font-bold hover:bg-[#2a2a4e] transition-colors text-sm">
              <DownloadIcon className="h-4 w-4" />
              تحميل PDF
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            QR ي linked مباشرة إلى صفحة مطعمك العامة
          </p>
        </div>
      </div>

      {/* Print Preview */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h3 className="font-bold text-[#1A1A2E] mb-4">معاينة الطباعة (A4)</h3>
        <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center border border-gray-200">
          <div className="w-[200px] h-[200px] bg-white rounded-lg flex items-center justify-center mb-4 shadow-inner">
            <canvas ref={(el) => {
              if (el && qrUrl) {
                QRCodeLib.toCanvas(el, qrUrl, { width: 180, margin: 1, color: { dark: "#1A1A2E", light: "#ffffff" } });
              }
            }} />
          </div>
          <p className="font-bold text-[#1A1A2E] text-lg">{restaurant.name}</p>
          <p className="text-xs text-gray-400 mt-1">امسح الرمز لرؤية القائمة</p>
        </div>
      </div>
    </div>
  );
}

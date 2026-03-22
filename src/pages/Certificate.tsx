import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Printer, ArrowLeft, Award, Download, Home } from 'lucide-react';
import Footer from '../components/Footer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Certificate() {
  const navigate = useNavigate();
  const { gameState, setGameState, resetGameState } = useStore();
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const currentTeam = gameState.teams[gameState.currentTeamIndex] || { name: 'Đang tải...', score: 0, correctAnswers: 0 };
  const hasNextTeam = gameState.currentTeamIndex < gameState.teams.length - 1;

  const handlePrint = () => {
    window.print();
  };

  const handleNextTeam = () => {
    setGameState({ currentTeamIndex: gameState.currentTeamIndex + 1 });
    navigate('/game');
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `giay-khen-${currentTeam.name || 'doi-choi'}.pdf`;
      
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Check if we are in an iframe (like AI Studio preview)
      if (window !== window.top) {
        // In iframe, direct download might be blocked. Open in new tab instead.
        const newWindow = window.open(url, '_blank');
        
        // If popup was blocked, fallback to normal save and hope for the best
        if (!newWindow) {
          pdf.save(fileName);
        }
      } else {
        // Normal environment, use standard save
        pdf.save(fileName);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tạo file PDF. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoHome = () => {
    resetGameState();
    navigate('/');
  };

  if (!gameState.teams || gameState.teams.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-wrap justify-between items-center gap-4 mb-8 print:hidden">
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/game')}
            className="bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 flex items-center gap-2 font-bold text-gray-700 transition-all active:scale-95"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <button 
            onClick={handleGoHome}
            className="bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-600 flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <Home size={20} /> Trang chủ
          </button>
        </div>

        <div className="flex gap-2">
          {pdfUrl && (
            <a 
              href={pdfUrl}
              download={`giay-khen-${currentTeam.name || 'doi-choi'}.pdf`}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 font-bold transition-all active:scale-95"
            >
              <Download size={20} /> Tải trực tiếp
            </a>
          )}
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <Download size={20} /> {isGenerating ? 'Đang tạo...' : 'Tạo PDF'}
          </button>
          <button 
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <Printer size={24} /> IN GIẤY KHEN
          </button>
        </div>
      </div>

      {/* Next Team Notification */}
      {hasNextTeam && (
        <div className="w-full max-w-4xl mb-6 bg-orange-100 border-2 border-orange-200 p-4 rounded-2xl flex items-center justify-between animate-pulse print:hidden">
          <div className="flex items-center gap-3">
            <Award className="text-orange-500 w-8 h-8" />
            <div>
              <p className="font-black text-orange-800 uppercase tracking-tight">Thông báo lượt chơi tiếp theo!</p>
              <p className="text-orange-700 font-bold">Đội tiếp theo: <span className="text-indigo-700">{gameState.teams[gameState.currentTeamIndex + 1].name}</span></p>
            </div>
          </div>
          <button 
            onClick={handleNextTeam}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95"
          >
            ĐỘI TIẾP THEO BẮT ĐẦU
          </button>
        </div>
      )}

      {/* Certificate Container */}
      <div 
        ref={certRef}
        className="bg-white w-full max-w-4xl aspect-[1.414/1] relative shadow-2xl overflow-hidden print:shadow-none print:w-[297mm] print:h-[210mm]"
        style={{ backgroundColor: '#f0fdf4' }}
      >
        {/* Background Decorations */}
        <div className="absolute top-[10%] left-[10%] w-[10%] aspect-square rounded-full" style={{ backgroundColor: 'rgba(252, 211, 77, 0.3)' }}></div>
        <div className="absolute top-[80%] left-[90%] w-[16%] aspect-square rounded-full -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: 'rgba(110, 231, 183, 0.3)' }}></div>
        <div className="absolute top-[20%] left-[80%] w-[8%] aspect-square rounded-full -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: 'rgba(147, 197, 253, 0.3)' }}></div>
        <div className="absolute top-[85%] left-[20%] w-[12%] aspect-square rounded-full -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: 'rgba(252, 165, 165, 0.3)' }}></div>

        {/* Border */}
        <div className="absolute inset-4 border-[12px] border-double rounded-2xl z-10" style={{ borderColor: '#34d399' }}></div>
        <div className="absolute inset-8 border-2 rounded-xl z-10" style={{ borderColor: '#a7f3d0' }}></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-8 md:p-16 z-20">
          <Award className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-2 sm:mb-6" strokeWidth={1.5} style={{ color: '#fbbf24' }} />
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-2 sm:mb-4 tracking-widest uppercase" style={{ fontFamily: 'serif', color: '#059669' }}>
            GIẤY KHEN
          </h1>
          
          <p className="text-sm sm:text-lg md:text-2xl mb-2 sm:mb-8 font-medium" style={{ color: '#4b5563' }}>
            Chứng nhận và chúc mừng đội/em:
          </p>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-8 border-b-2 sm:border-b-4 pb-1 sm:pb-2 px-4 sm:px-12 inline-block" style={{ color: '#f97316', borderColor: '#fed7aa' }}>
            {currentTeam.name}
          </h2>
          
          <p className="text-sm sm:text-xl md:text-2xl mb-2 sm:mb-4" style={{ color: '#374151' }}>
            Đã xuất sắc hoàn thành trò chơi
          </p>
          <p className="text-2xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-12 drop-shadow-md tracking-wide" style={{ color: '#4338ca' }}>
            "Nghiêng đầu trí tuệ"
          </p>

          <div className="flex justify-center gap-8 sm:gap-16 w-full px-4 sm:px-24">
            <div className="text-center">
              <p className="text-xs sm:text-sm md:text-lg uppercase font-bold mb-1" style={{ color: '#6b7280' }}>Điểm số</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black" style={{ color: '#4f46e5' }}>{currentTeam.score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm md:text-lg uppercase font-bold mb-1" style={{ color: '#6b7280' }}>Ngày cấp</p>
              <p className="text-sm sm:text-xl md:text-2xl font-bold mt-1 sm:mt-2" style={{ color: '#1f2937' }}>
                {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-8 border-l-8 rounded-tl-xl" style={{ borderColor: '#10b981' }}></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-8 border-r-8 rounded-tr-xl" style={{ borderColor: '#10b981' }}></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-8 border-l-8 rounded-bl-xl" style={{ borderColor: '#10b981' }}></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-8 border-r-8 rounded-br-xl" style={{ borderColor: '#10b981' }}></div>
      </div>
      <Footer />

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}

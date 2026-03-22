import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Question, QuestionType } from '../store/useStore';
import { ArrowLeft, Plus, Trash2, Edit2, Save, Image as ImageIcon, Type, Download, Upload, Music, X, FileSpreadsheet, Volume2, Trophy, Settings as SettingsIcon, Award, Sparkles, MessageCircle, User, Zap, Filter, Video } from 'lucide-react';
import Footer from '../components/Footer';
import * as XLSX from 'xlsx';
import { saveMedia, deleteMedia, getMedia } from '../utils/audioStorage';
import { useIndexedDBMedia } from '../utils/useIndexedDBMedia';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const IndexedDBMediaPlayer = ({ mediaId, fallbackUrl, type }: { mediaId?: string, fallbackUrl?: string, type?: 'audio' | 'video' }) => {
  const { mediaUrl, isLoading } = useIndexedDBMedia(mediaId);
  const finalUrl = mediaUrl || (fallbackUrl?.startsWith('data:') ? fallbackUrl : null);
  if (isLoading) return <span className="text-xs text-gray-400">Đang tải...</span>;
  if (!finalUrl) return <span className="text-xs text-gray-400">Không có dữ liệu</span>;
  if (type === 'video') return <video src={finalUrl} controls className="h-20 rounded-lg" />;
  return <audio src={finalUrl} controls className="h-8 scale-90 origin-left" />;
};

export default function Admin() {
  const navigate = useNavigate();
  const { questions, settings, addQuestion, updateQuestion, removeQuestion, updateSettings, loadInitialQuestions, leaderboard, removeLeaderboardEntry, clearLeaderboard, setGameState } = useStore();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'collaborator' | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'leaderboard'>('questions');
  const [isGeneratingCert, setIsGeneratingCert] = useState<string | null>(null);
  const [selectedCertEntry, setSelectedCertEntry] = useState<any>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<number>(0); // 0 for all
  const [newQ, setNewQ] = useState<Partial<Question>>({
    type: 'text',
    correct: 'A',
    groupId: 1,
    question: '',
    A: '',
    A_type: 'text',
    B: '',
    B_type: 'text'
  });

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const fileInputQRef = useRef<HTMLInputElement>(null);
  const fileInputAudioQRef = useRef<HTMLInputElement>(null);
  const fileInputVideoQRef = useRef<HTMLInputElement>(null);
  const fileInputAAudioRef = useRef<HTMLInputElement>(null);
  const fileInputBAudioRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'soangiangtv' && password === '2026') {
      setIsAuthenticated(true);
      setUserRole('admin');
      setLoginError('');
    } else if (username === 'congtacvien' && password === '1234') {
      setIsAuthenticated(true);
      setUserRole('collaborator');
      setLoginError('');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-t-[12px] border-emerald-500 relative">
          <button onClick={() => navigate('/')} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={32} />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Quản Trị Viên</h2>
            <p className="text-gray-500 font-medium">Vui lòng đăng nhập để quản lý trò chơi</p>
          </div>

          {/* Quick Instruction */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-8 rounded-r-2xl">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <SettingsIcon /> Hướng dẫn nhập liệu
            </h3>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Hệ thống hỗ trợ tạo câu hỏi đa phương tiện (Chữ, Ảnh, Âm thanh). Bạn có thể tự soạn hoặc nhập nhanh từ file Excel (.xlsx).
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Tài khoản</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all text-lg"
                placeholder="Tên đăng nhập..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all text-lg"
                placeholder="••••••••"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-shake">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-emerald-200 text-lg uppercase tracking-widest active:scale-[0.98]"
            >
              Đăng nhập hệ thống
            </button>
          </form>


        </div>
      </div>
    );
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, target: 'question' | 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewQ(prev => ({ ...prev, [target]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('File video quá lớn. Vui lòng chọn file dưới 100MB.');
        return;
      }
      try {
        const id = `video_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await saveMedia(id, file);
        setNewQ(prev => ({ ...prev, question: id }));
      } catch (error) {
        alert('Lỗi khi lưu file video!');
      }
    }
  };

  const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'bgm' | 'question') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File âm thanh quá lớn. Vui lòng chọn file dưới 50MB.');
        return;
      }
      try {
        const id = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await saveMedia(id, file);
        if (target === 'bgm') {
          updateSettings({
            customSounds: {
              ...settings.customSounds,
              bgm: id
            }
          });
        } else {
          setNewQ(prev => ({ ...prev, question: id }));
        }
      } catch (error) {
        alert('Lỗi khi lưu file âm thanh!');
      }
    }
  };

  const handleIndexedDBAudioUpload = async (e: ChangeEvent<HTMLInputElement>, target: 'questionAudioId' | 'A_audioId' | 'B_audioId') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File âm thanh quá lớn. Vui lòng chọn file dưới 50MB.');
        return;
      }
      try {
        const id = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await saveMedia(id, file);
        if (newQ.type === 'audio_question' && target === 'questionAudioId') {
          setNewQ(prev => ({ ...prev, [target]: id, question: 'Câu hỏi âm thanh' }));
        } else {
          setNewQ(prev => ({ ...prev, [target]: id }));
        }
      } catch (error) {
        alert('Lỗi khi lưu file âm thanh!');
      }
    }
  };

  const removeCustomAudio = async (type: 'bgm') => {
    const newSounds = { ...settings.customSounds };
    if (newSounds[type] && newSounds[type].startsWith('audio_')) {
      await deleteMedia(newSounds[type]);
    }
    delete newSounds[type];
    updateSettings({ customSounds: newSounds });
  };

  const handleSaveNew = () => {
    if (!newQ.question || !newQ.A || !newQ.B) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (userRole === 'collaborator') {
      const groupCount = questions.filter(q => q.groupId === (newQ.groupId || 1)).length;
      if (groupCount >= 2) {
        alert(`Tài khoản cộng tác viên chỉ được tạo tối đa 2 câu hỏi cho mỗi nhóm. Nhóm ${newQ.groupId || 1} đã có ${groupCount} câu hỏi.`);
        return;
      }
    }

    addQuestion(newQ as Omit<Question, 'id'>);
    setNewQ({ 
      type: 'text', 
      correct: 'A', 
      groupId: 1,
      question: '', 
      A: '', 
      A_type: 'text', 
      B: '', 
      B_type: 'text',
      questionAudioId: undefined,
      A_audioId: undefined,
      B_audioId: undefined
    });
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setNewQ({ ...q });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewQ({ 
      type: 'text', 
      correct: 'A', 
      groupId: 1,
      question: '', 
      A: '', 
      A_type: 'text', 
      B: '', 
      B_type: 'text',
      questionAudioId: undefined,
      A_audioId: undefined,
      B_audioId: undefined
    });
  };

  const handleSaveEdit = () => {
    if (!newQ.question || !newQ.A || !newQ.B) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (editingId) {
      updateQuestion(editingId, newQ);
      handleCancelEdit();
    }
  };

  const handleExportExcel = () => {
    const MAX_EXCEL_LEN = 32760; // Slightly less than 32767 to be safe
    const data = questions.map(q => {
      const processValue = (val: string) => {
        if (val && val.length > MAX_EXCEL_LEN) {
          return `[DỮ LIỆU QUÁ LỚN (${(val.length / 1024).toFixed(1)}KB) - VUI LÒNG DÙNG XUẤT JSON ĐỂ SAO LƯU ĐẦY ĐỦ]`;
        }
        return val;
      };

      return {
        'Loại câu hỏi': q.type,
        'Nhóm': q.groupId || 1,
        'Nội dung câu hỏi': processValue(q.question),
        'Loại đáp án A': q.A_type,
        'Nội dung đáp án A': processValue(q.A),
        'Loại đáp án B': q.B_type,
        'Nội dung đáp án B': processValue(q.B),
        'Đáp án đúng': q.correct
      };
    });

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
      XLSX.writeFile(workbook, "questions.xlsx");
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xuất file Excel. Có thể do dữ liệu quá lớn. Vui lòng thử Xuất JSON.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questions_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDownloadCertificate = async (entry: any) => {
    setSelectedCertEntry(entry);
    setIsGeneratingCert(entry.id);
    
    // Small delay to ensure the hidden cert is rendered with correct data
    setTimeout(async () => {
      if (!certRef.current) {
        setIsGeneratingCert(null);
        return;
      }
      
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
        
        const fileName = `giay-khen-${entry.teamName}.pdf`;
        pdf.save(fileName);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Có lỗi xảy ra khi tạo file PDF.');
      } finally {
        setIsGeneratingCert(null);
        setSelectedCertEntry(null);
      }
    }, 500);
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedQuestions = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedQuestions)) {
            const valid = importedQuestions.every(q => q.question && q.A && q.B && q.correct);
            if (valid) {
              loadInitialQuestions(importedQuestions);
              alert('Nhập JSON thành công!');
            } else {
              alert('File JSON không đúng định dạng!');
            }
          }
        } catch (error) {
          alert('Lỗi đọc file JSON!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportExcel = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const importedQuestions: Omit<Question, 'id'>[] = jsonData.map((row: any) => ({
            type: row['Loại câu hỏi'] as QuestionType,
            groupId: Number(row['Nhóm'] || 1),
            question: String(row['Nội dung câu hỏi'] || ''),
            A_type: (row['Loại đáp án A'] || 'text') as 'text' | 'image',
            A: String(row['Nội dung đáp án A'] || ''),
            B_type: (row['Loại đáp án B'] || 'text') as 'text' | 'image',
            B: String(row['Nội dung đáp án B'] || ''),
            correct: (row['Đáp án đúng'] || 'A') as 'A' | 'B'
          }));

          if (importedQuestions.length > 0) {
            const valid = importedQuestions.every(q => q.question && q.A && q.B && q.correct);
            if (valid) {
              loadInitialQuestions(importedQuestions as Question[]);
              alert('Nhập dữ liệu thành công!');
            } else {
              alert('Dữ liệu trong file Excel không đúng định dạng!');
            }
          }
        } catch (error) {
          alert('Lỗi đọc file Excel!');
        }
      };
      reader.readAsArrayBuffer(file);
    }
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Loại câu hỏi': 'text',
        'Nhóm': 1,
        'Nội dung câu hỏi': 'Thủ đô của Việt Nam là gì?',
        'Loại đáp án A': 'text',
        'Nội dung đáp án A': 'Hà Nội',
        'Loại đáp án B': 'text',
        'Nội dung đáp án B': 'TP.HCM',
        'Đáp án đúng': 'A'
      },
      {
        'Loại câu hỏi': 'image_question',
        'Nội dung câu hỏi': 'data:image/png;base64,... (hoặc text nếu là câu hỏi chữ)',
        'Loại đáp án A': 'image',
        'Nội dung đáp án A': 'data:image/png;base64,...',
        'Loại đáp án B': 'image',
        'Nội dung đáp án B': 'data:image/png;base64,...',
        'Đáp án đúng': 'B'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "mau_cau_hoi.xlsx");
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-emerald-500 p-4 flex flex-col sm:flex-row items-center justify-between text-white gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-emerald-600 rounded-xl transition-all active:scale-90">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Quản Trị Game</h1>
              <p className="text-emerald-100 text-[10px] sm:text-xs font-medium">Thiết lập câu hỏi và cấu hình trò chơi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
            {userRole === 'admin' && (
              <>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  ref={importFileRef}
                  onChange={handleImportExcel}
                />
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  id="import-json-input"
                  onChange={handleImportJSON}
                />
                <button 
                  onClick={handleDownloadTemplate}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm"
                  title="Tải file Excel mẫu"
                >
                  <FileSpreadsheet size={14} /> File Mẫu
                </button>
                <button 
                  onClick={() => importFileRef.current?.click()}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm"
                  title="Nhập file Excel"
                >
                  <Upload size={14} /> Nhập Excel
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm"
                  title="Xuất file Excel"
                >
                  <Download size={14} /> Xuất Excel
                </button>
                <div className="h-6 w-[1px] bg-white/20 mx-1"></div>
                <button 
                  onClick={() => document.getElementById('import-json-input')?.click()}
                  className="bg-blue-500/40 hover:bg-blue-500/60 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm border border-blue-400/30"
                  title="Nhập file JSON (Dành cho dữ liệu lớn)"
                >
                  <Upload size={14} /> Nhập JSON
                </button>
                <button 
                  onClick={handleExportJSON}
                  className="bg-blue-500/40 hover:bg-blue-500/60 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm border border-blue-400/30"
                  title="Xuất file JSON (Sao lưu đầy đủ)"
                >
                  <Download size={14} /> Xuất JSON
                </button>
              </>
            )}
            <div className="bg-emerald-700/50 px-3 py-1.5 rounded-xl font-black border border-emerald-400/30 backdrop-blur-md text-base ml-2">
              {questions.length} <span className="text-[10px] font-bold opacity-70">CÂU HỎI</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4">
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                activeTab === 'questions'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <SettingsIcon /> QUẢN LÝ CÂU HỎI
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-100'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Trophy size={20} /> QUẢN LÝ BẢNG VINH DANH
            </button>
          </div>

          {activeTab === 'questions' ? (
            <>
              {userRole === 'collaborator' && (
                <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <Award className="text-amber-600" size={20} />
                    <p className="text-amber-800 font-bold">
                      Tài khoản Cộng tác viên: Bạn chỉ được phép tạo tối đa 2 câu hỏi cho mỗi nhóm câu hỏi.
                    </p>
                  </div>
                </div>
              )}
              {/* Instruction Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500 text-white p-1.5 rounded-lg">
                <SettingsIcon />
              </div>
              <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Hướng dẫn nhập liệu</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[13px] font-medium text-blue-800/80">
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                <span>Chọn <span className="font-black text-blue-900">Loại câu hỏi</span>: Chữ, Ảnh, hoặc Âm.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                <span>Nhập nội dung <span className="font-black text-blue-900">Câu hỏi</span> hoặc tải file.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                <span>Thiết lập <span className="font-black text-blue-900">Đáp án A & B</span>: Chuyển đổi Chữ/Ảnh.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">4</span>
                <span>Chọn <span className="font-black text-blue-900">Đáp án đúng</span> và nhấn <span className="font-black text-blue-900">Thêm</span>.</span>
              </li>
            </ul>
          </div>

          {/* Add Question Form - Structured Grid */}
          <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 mb-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            
            <h2 className="text-xl font-black text-emerald-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
              <div className="bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg shadow-emerald-200">
                {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
              </div>
              {editingId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
              {/* Row 1: Type and Content */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest opacity-80">1. Loại câu hỏi</label>
                <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-emerald-100 shadow-sm h-12">
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'text' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'text', question: '' })}
                  >
                    <Type size={14} /> CHỮ
                  </button>
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'image_question' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'image_question', question: '' })}
                  >
                    <ImageIcon size={14} /> ẢNH
                  </button>
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'audio_question' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'audio_question', question: '' })}
                  >
                    <Music size={14} /> ÂM
                  </button>
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'video_question' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'video_question', question: '' })}
                  >
                    <Video size={14} /> VIDEO
                  </button>
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest opacity-80">2. Nhóm câu hỏi</label>
                <div className="relative">
                  <select
                    value={newQ.groupId || 1}
                    onChange={(e) => setNewQ({ ...newQ, groupId: parseInt(e.target.value) })}
                    className="w-full h-12 px-4 bg-white border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-black shadow-sm transition-all appearance-none cursor-pointer text-emerald-800"
                  >
                    {[1, 2, 3, 4, 5].map((g) => (
                      <option key={g} value={g}>NHÓM {g}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                    <ArrowLeft size={16} className="-rotate-90" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-black text-emerald-700 uppercase tracking-widest opacity-80">3. Nội dung câu hỏi</label>
                  {newQ.type !== 'audio_question' && (
                    <button 
                      onClick={() => fileInputAudioQRef.current?.click()}
                      className={`text-[9px] font-black px-3 py-1 rounded-lg transition-all shadow-sm border-2 flex items-center gap-1.5 ${
                        newQ.questionAudioId 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Volume2 size={12} /> {newQ.questionAudioId ? 'ĐÃ TẢI ÂM THANH' : 'THÊM ÂM THANH'}
                    </button>
                  )}
                </div>
                <input type="file" accept="audio/*" className="hidden" ref={fileInputAudioQRef} onChange={(e) => handleIndexedDBAudioUpload(e, 'questionAudioId')} />
                {newQ.type === 'image_question' ? (
                  <div className="flex gap-2 h-12">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputQRef} onChange={(e) => handleImageUpload(e, 'question')} />
                    <button onClick={() => fileInputQRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500 shadow-sm">
                      {newQ.question && newQ.question !== 'Câu hỏi âm thanh' ? <img src={newQ.question} alt="Q" className="h-full object-contain" /> : <><Plus size={20} className="mr-2" /> Tải ảnh câu hỏi</>}
                    </button>
                  </div>
                ) : newQ.type === 'audio_question' ? (
                  <div className="flex gap-2 h-12">
                    <button onClick={() => fileInputAudioQRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all hover:border-emerald-500 shadow-sm">
                      {newQ.questionAudioId ? <span className="text-sm font-black flex items-center gap-2"><Music size={16} /> ✓ Đã tải âm thanh</span> : <><Music size={20} className="mr-2" /> Tải file âm thanh</>}
                    </button>
                  </div>
                ) : newQ.type === 'video_question' ? (
                  <div className="flex gap-2 h-12">
                    <input type="file" accept="video/*" className="hidden" ref={fileInputVideoQRef} onChange={handleVideoUpload} />
                    <button onClick={() => fileInputVideoQRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all hover:border-emerald-500 shadow-sm">
                      {newQ.question && newQ.question.startsWith('video_') ? <span className="text-sm font-black flex items-center gap-2"><Video size={16} /> ✓ Đã tải video</span> : <><Video size={20} className="mr-2" /> Tải file video</>}
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={newQ.question}
                    onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                    className="w-full h-12 px-4 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-bold shadow-sm transition-all placeholder:text-gray-300"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                )}
              </div>

              {/* Row 2: Answers */}
              <div className="md:col-span-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-emerald-700 uppercase tracking-widest opacity-80">3. Đáp án A</label>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => fileInputAAudioRef.current?.click()}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md border-2 flex items-center justify-center gap-1.5 ${
                          newQ.A_audioId 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Volume2 size={12} /> {newQ.A_audioId ? 'ĐÃ TẢI ÂM THANH' : 'THÊM ÂM THANH'}
                      </button>
                      <button 
                        onClick={() => setNewQ({ ...newQ, A_type: newQ.A_type === 'text' ? 'image' : 'text', A: '' })}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md border-2 flex items-center justify-center gap-1.5 ${
                          newQ.A_type === 'image' 
                            ? 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600' 
                            : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                        }`}
                      >
                        {newQ.A_type === 'image' ? (
                          <><Type size={12} /> CHUYỂN ĐÁP ÁN CHỮ</>
                        ) : (
                          <><ImageIcon size={12} /> CHUYỂN ĐÁP ÁN ẢNH</>
                        )}
                      </button>
                    </div>
                  </div>
                  <input type="file" accept="audio/*" className="hidden" ref={fileInputAAudioRef} onChange={(e) => handleIndexedDBAudioUpload(e, 'A_audioId')} />
                  {newQ.A_type === 'image' ? (
                    <div className="flex gap-2 h-16">
                      <input type="file" accept="image/*" className="hidden" ref={fileInputARef} onChange={(e) => handleImageUpload(e, 'A')} />
                      <button onClick={() => fileInputARef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500 shadow-sm">
                        {newQ.A ? <img src={newQ.A} alt="A" className="h-full object-contain" /> : <Plus size={24} />}
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={newQ.A}
                      onChange={(e) => setNewQ({ ...newQ, A: e.target.value })}
                      className="w-full h-16 px-4 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-black shadow-sm transition-all text-center placeholder:text-gray-200"
                      placeholder="Nhập chữ..."
                    />
                  )}
                </div>
              </div>

              <div className="md:col-span-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-emerald-700 uppercase tracking-widest opacity-80">4. Đáp án B</label>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => fileInputBAudioRef.current?.click()}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md border-2 flex items-center justify-center gap-1.5 ${
                          newQ.B_audioId 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Volume2 size={12} /> {newQ.B_audioId ? 'ĐÃ TẢI ÂM THANH' : 'THÊM ÂM THANH'}
                      </button>
                      <button 
                        onClick={() => setNewQ({ ...newQ, B_type: newQ.B_type === 'text' ? 'image' : 'text', B: '' })}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md border-2 flex items-center justify-center gap-1.5 ${
                          newQ.B_type === 'image' 
                            ? 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600' 
                            : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                        }`}
                      >
                        {newQ.B_type === 'image' ? (
                          <><Type size={12} /> CHUYỂN ĐÁP ÁN CHỮ</>
                        ) : (
                          <><ImageIcon size={12} /> CHUYỂN ĐÁP ÁN ẢNH</>
                        )}
                      </button>
                    </div>
                  </div>
                  <input type="file" accept="audio/*" className="hidden" ref={fileInputBAudioRef} onChange={(e) => handleIndexedDBAudioUpload(e, 'B_audioId')} />
                  {newQ.B_type === 'image' ? (
                    <div className="flex gap-2 h-16">
                      <input type="file" accept="image/*" className="hidden" ref={fileInputBRef} onChange={(e) => handleImageUpload(e, 'B')} />
                      <button onClick={() => fileInputBRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500 shadow-sm">
                        {newQ.B ? <img src={newQ.B} alt="B" className="h-full object-contain" /> : <Plus size={24} />}
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={newQ.B}
                      onChange={(e) => setNewQ({ ...newQ, B: e.target.value })}
                      className="w-full h-16 px-4 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-black shadow-sm transition-all text-center placeholder:text-gray-200"
                      placeholder="Nhập chữ..."
                    />
                  )}
                </div>
              </div>

              {/* Row 3: Correct Answer and Submit */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest opacity-80">6. Đáp án đúng</label>
                <div className="flex bg-white p-1.5 rounded-2xl border-2 border-emerald-100 h-14 shadow-sm">
                  <button
                    className={`flex-1 rounded-xl text-xl font-black transition-all ${newQ.correct === 'A' ? 'bg-emerald-500 text-white shadow-md scale-[1.05]' : 'text-gray-400 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, correct: 'A' })}
                  >
                    A
                  </button>
                  <button
                    className={`flex-1 rounded-xl text-xl font-black transition-all ${newQ.correct === 'B' ? 'bg-emerald-500 text-white shadow-md scale-[1.05]' : 'text-gray-400 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, correct: 'B' })}
                  >
                    B
                  </button>
                </div>
              </div>

              <div className="md:col-span-8 flex items-end gap-4">
                {editingId ? (
                  <>
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl hover:shadow-emerald-200 text-xl uppercase tracking-tighter"
                    >
                      <Save size={24} /> LƯU THAY ĐỔI
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md text-lg uppercase tracking-tighter"
                    >
                      <X size={24} /> HỦY
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleSaveNew}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl hover:shadow-emerald-200 text-xl uppercase tracking-tighter"
                  >
                    <Plus size={24} /> THÊM CÂU HỎI
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tabs (Full Width) */}
          <div className="mb-8 flex items-center gap-4 bg-white p-4 rounded-3xl border-2 border-emerald-100 shadow-xl overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 shrink-0">
              <Filter size={18} className="text-emerald-600" />
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Lọc theo nhóm:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilterGroup(0)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${selectedFilterGroup === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent'}`}
              >
                TẤT CẢ CÂU HỎI
              </button>
              {[1, 2, 3, 4, 5].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedFilterGroup(g)}
                  className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${selectedFilterGroup === g ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent'}`}
                >
                  NHÓM {g}
                </button>
              ))}
            </div>
            <div className="ml-auto px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng: {questions.length} câu</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <SettingsIcon /> Cài đặt vòng chơi
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số câu mỗi vòng</label>
                    <input 
                      type="number" 
                      min="1"
                      value={settings.questionsPerRound}
                      onChange={(e) => updateSettings({ questionsPerRound: parseInt(e.target.value) || 5 })}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <span className="font-medium text-gray-700">Đảo ngẫu nhiên</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.randomize}
                        onChange={(e) => updateSettings({ randomize: e.target.checked })}
                        disabled={userRole === 'collaborator'}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {userRole === 'admin' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa tất cả đội chơi và reset game hiện tại?')) {
                          setGameState({ teams: [], currentTeamIndex: 0, currentRound: 1 });
                          alert('Đã reset game thành công!');
                        }
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 uppercase text-sm"
                    >
                      <Trash2 size={18} /> Reset Game Hiện Tại
                    </button>
                  )}
                </div>
              </div>

              {/* Audio Settings Panel */}
              <div className="bg-sky-50 p-6 rounded-2xl border border-sky-200">
                <h2 className="text-xl font-bold text-sky-800 mb-4 flex items-center gap-2">
                  <Music size={24} /> Cài đặt Âm thanh
                </h2>
                
                <div className="space-y-4">
                  {/* BGM */}
                  <div className="bg-white p-3 rounded-xl border border-sky-100">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700">Nhạc nền (BGM)</label>
                      {settings.customSounds?.bgm && userRole === 'admin' && (
                        <button onClick={() => removeCustomAudio('bgm')} className="text-red-500 hover:text-red-700 p-1" title="Xóa nhạc nền tùy chỉnh">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={(e) => handleAudioUpload(e, 'bgm')}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 w-full"
                        disabled={userRole === 'collaborator'}
                      />
                    </div>
                    {settings.customSounds?.bgm && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mb-1">✓ Đã tải lên nhạc tùy chỉnh</p>
                        <IndexedDBMediaPlayer mediaId={settings.customSounds.bgm} fallbackUrl={settings.customSounds.bgm} type="audio" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Danh sách câu hỏi</h2>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{questions.length} câu hỏi đã tạo</div>
              </div>
              
              <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {questions
                  .filter(q => selectedFilterGroup === 0 || q.groupId === selectedFilterGroup)
                  .map((q, index) => (
                  <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="bg-emerald-500 text-white font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">NHÓM {q.groupId || 1}</span>
                        </div>
                        <div className="flex-1">
                          {q.type === 'image_question' ? (
                            <div className="flex items-center gap-4">
                              <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">ẢNH CÂU HỎI</span>
                              <img src={q.question} alt="Question" className="h-16 w-24 object-contain rounded-xl border border-gray-100 shadow-sm" />
                            </div>
                          ) : q.type === 'audio_question' ? (
                            <div className="flex items-center gap-4">
                              <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">ÂM THANH</span>
                              <IndexedDBMediaPlayer mediaId={q.questionAudioId} fallbackUrl={q.question} type="audio" />
                            </div>
                          ) : q.type === 'video_question' ? (
                            <div className="flex items-center gap-4">
                              <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">VIDEO</span>
                              <IndexedDBMediaPlayer mediaId={q.question} fallbackUrl={q.question} type="video" />
                            </div>
                          ) : (
                            <h3 className="text-lg font-black text-gray-800 tracking-tight leading-tight">{q.question}</h3>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditQuestion(q)}
                          className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                          title="Sửa câu hỏi"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
                              if (q.type === 'video_question' && q.question.startsWith('video_')) await deleteMedia(q.question);
                              if (q.questionAudioId) await deleteMedia(q.questionAudioId);
                              if (q.A_audioId) await deleteMedia(q.A_audioId);
                              if (q.B_audioId) await deleteMedia(q.B_audioId);
                              removeQuestion(q.id);
                            }
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${q.correct === 'A' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-50 bg-gray-50/20'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-xs uppercase tracking-widest ${q.correct === 'A' ? 'text-emerald-600' : 'text-gray-400'}`}>ĐÁP ÁN A</span>
                          {q.correct === 'A' && <div className="bg-emerald-500 text-white p-1 rounded-full shadow-md"><Save size={10} /></div>}
                        </div>
                        {q.A_type === 'image' || (q.type === 'image' && !q.A_type) ? (
                          <img src={q.A} alt="A" className="h-24 object-contain rounded-xl shadow-sm border-2 border-white" />
                        ) : (
                          <span className={`text-base font-black text-center px-2 ${q.correct === 'A' ? 'text-emerald-900' : 'text-gray-600'}`}>{q.A}</span>
                        )}
                        {q.A_audioId && <IndexedDBMediaPlayer mediaId={q.A_audioId} type="audio" />}
                      </div>
                      <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${q.correct === 'B' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-50 bg-gray-50/20'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-xs uppercase tracking-widest ${q.correct === 'B' ? 'text-emerald-600' : 'text-gray-400'}`}>ĐÁP ÁN B</span>
                          {q.correct === 'B' && <div className="bg-emerald-500 text-white p-1 rounded-full shadow-md"><Save size={10} /></div>}
                        </div>
                        {q.B_type === 'image' || (q.type === 'image' && !q.B_type) ? (
                          <img src={q.B} alt="B" className="h-24 object-contain rounded-xl shadow-sm border-2 border-white" />
                        ) : (
                          <span className={`text-base font-black text-center px-2 ${q.correct === 'B' ? 'text-emerald-900' : 'text-gray-600'}`}>{q.B}</span>
                        )}
                        {q.B_audioId && <IndexedDBMediaPlayer mediaId={q.B_audioId} type="audio" />}
                      </div>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Plus size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-black uppercase tracking-widest opacity-30">Chưa có câu hỏi nào</p>
                    <p className="text-xs font-medium mt-1">Hãy sử dụng thanh công cụ phía trên để thêm câu hỏi mới</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Bảng vinh danh hệ thống</h2>
                  <p className="text-gray-500 font-medium">Quản lý danh sách các đội chơi đã đạt thành tích cao</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng vinh danh?')) {
                      clearLeaderboard();
                    }
                  }}
                  disabled={userRole === 'collaborator'}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all border shadow-sm ${
                    userRole === 'collaborator' 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'
                  }`}
                >
                  <Trash2 size={20} /> XÓA TẤT CẢ
                </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 sm:p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Thứ hạng</th>
                        <th className="p-4 sm:p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Tên đội chơi</th>
                        <th className="p-4 sm:p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Điểm số</th>
                        <th className="p-4 sm:p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                        <th className="p-4 sm:p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Ngày chơi</th>
                        <th className="p-4 sm:p-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length > 0 ? (
                        leaderboard.map((entry, index) => (
                          <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                            <td className="p-4 sm:p-6">
                              <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-base sm:text-lg ${
                                index === 0 ? 'bg-amber-100 text-amber-600' :
                                index === 1 ? 'bg-slate-100 text-slate-600' :
                                index === 2 ? 'bg-orange-100 text-orange-600' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="p-4 sm:p-6">
                              <div className="flex items-center gap-3">
                                <span className="text-xl sm:text-2xl">{entry.icon || '🏆'}</span>
                                <div className="font-black text-gray-800 text-base sm:text-lg truncate max-w-[150px] sm:max-w-none">{entry.teamName}</div>
                              </div>
                            </td>
                            <td className="p-4 sm:p-6">
                              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-black text-sm sm:text-base">
                                <Trophy size={16} />
                                {entry.score}
                              </div>
                            </td>
                            <td className="p-4 sm:p-6">
                              <div className="text-gray-600 font-bold text-sm sm:text-base">
                                {(entry.totalTime / 1000).toFixed(1)}s
                              </div>
                            </td>
                            <td className="p-4 sm:p-6">
                              <div className="text-gray-500 font-medium text-xs sm:text-sm">
                                {new Date(entry.date).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="p-4 sm:p-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDownloadCertificate(entry)}
                                  disabled={isGeneratingCert === entry.id}
                                  className={`p-2 sm:p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs sm:text-sm ${
                                    isGeneratingCert === entry.id 
                                      ? 'bg-gray-100 text-gray-400' 
                                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                  }`}
                                  title="Tải giấy khen PDF"
                                >
                                  {isGeneratingCert === entry.id ? (
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Award size={18} />
                                  )}
                                  <span className="hidden sm:inline">{isGeneratingCert === entry.id ? 'ĐANG TẠO...' : 'GIẤY KHEN'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Xóa đội "${entry.teamName}" khỏi bảng vinh danh?`)) {
                                      removeLeaderboardEntry(entry.id);
                                    }
                                  }}
                                  disabled={userRole === 'collaborator'}
                                  className={`p-2 sm:p-3 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
                                    userRole === 'collaborator' ? 'text-gray-200 cursor-not-allowed' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                                  }`}
                                >
                                  <Trash2 size={18} sm:size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-10 sm:p-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                              <Trophy size={60} sm:size={80} />
                              <div className="text-xl sm:text-2xl font-black uppercase tracking-widest">Chưa có dữ liệu</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Hidden Certificate Template for PDF Generation */}
      {selectedCertEntry && (
        <div className="fixed -left-[9999px] top-0">
          <div 
            ref={certRef}
            className="bg-white w-[1123px] h-[794px] relative overflow-hidden"
            style={{ 
              width: '1123px', 
              height: '794px',
              backgroundColor: '#f0fdf4' // bg-green-50
            }} 
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-16 z-20">
              <Award className="w-32 h-32 mb-6" strokeWidth={1.5} style={{ color: '#fbbf24' }} />
              
              <h1 className="text-6xl font-black mb-4 tracking-widest uppercase" style={{ fontFamily: 'serif', color: '#059669' }}>
                GIẤY KHEN
              </h1>
              
              <p className="text-2xl mb-8 font-medium" style={{ color: '#4b5563' }}>
                Chứng nhận và chúc mừng đội/em:
              </p>
              
              <div className="flex items-center gap-4 mb-8 border-b-4 pb-2 px-12 inline-block" style={{ borderColor: '#fed7aa' }}>
                <span className="text-6xl">{selectedCertEntry.icon || '🏆'}</span>
                <h2 className="text-5xl font-bold" style={{ color: '#f97316' }}>
                  {selectedCertEntry.teamName}
                </h2>
              </div>
              
              <p className="text-2xl mb-4" style={{ color: '#374151' }}>
                Đã xuất sắc hoàn thành trò chơi
              </p>
              <p className="text-5xl font-black mb-12 drop-shadow-md tracking-wide" style={{ color: '#4338ca' }}>
                "Nghiêng đầu trí tuệ"
              </p>

              <div className="flex justify-center gap-24 w-full px-24">
                <div className="text-center">
                  <p className="text-lg uppercase font-bold mb-1" style={{ color: '#6b7280' }}>Điểm số</p>
                  <p className="text-4xl font-black" style={{ color: '#4f46e5' }}>{selectedCertEntry.score}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg uppercase font-bold mb-1" style={{ color: '#6b7280' }}>Thời gian</p>
                  <p className="text-4xl font-black" style={{ color: '#10b981' }}>{(selectedCertEntry.totalTime / 1000).toFixed(1)}s</p>
                </div>
                <div className="text-center">
                  <p className="text-lg uppercase font-bold mb-1" style={{ color: '#6b7280' }}>Ngày cấp</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: '#1f2937' }}>
                    {new Date(selectedCertEntry.date).toLocaleDateString('vi-VN')}
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
        </div>
      )}
    </div>
  );
}


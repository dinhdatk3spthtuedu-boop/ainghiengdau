import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Team } from '../store/useStore';
import { Play, Settings, Plus, Trash2, Trophy, User, Video, ExternalLink, Settings as SettingsIcon } from 'lucide-react';
import Footer from '../components/Footer';

const TEAM_ICONS = ['🦁', '🐯', '🐼', '🦊', '🐨', '🐸', '🦄', '🐲', '🐙', '🦋', '🐝', '🐢', '🦖', '🚀', '🌈', '⚽', '🎨', '🎸'];

interface TeamInput {
  name: string;
  icon: string;
  selectedGroupId: number;
}

export default function Home() {
  const navigate = useNavigate();
  const setGameState = useStore((state) => state.setGameState);
  const resetGameState = useStore((state) => state.resetGameState);
  const leaderboard = useStore((state) => state.leaderboard);
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  const [teams, setTeams] = useState<TeamInput[]>([{ name: '', icon: TEAM_ICONS[0], selectedGroupId: settings.selectedGroupId || 1 }]);

  const handleStart = () => {
    const validTeams = teams.filter(t => t.name.trim() !== '');
    if (validTeams.length === 0) {
      alert('Vui lòng nhập ít nhất một tên đội!');
      return;
    }

    if (settings.isSimultaneous && validTeams.length < 2) {
      alert('Chế độ 2 đội cùng chơi yêu cầu ít nhất 2 đội!');
      return;
    }

    // Check for duplicate names in current list
    const names = validTeams.map(t => t.name.trim().toLowerCase());
    const duplicateInList = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicateInList) {
      alert(`Tên đội "${validTeams[names.indexOf(duplicateInList)].name}" bị trùng trong danh sách!`);
      return;
    }

    // Check for duplicate names in leaderboard
    const duplicateInLeaderboard = validTeams.find(t => 
      leaderboard.some(entry => entry.teamName.trim().toLowerCase() === t.name.trim().toLowerCase())
    );
    if (duplicateInLeaderboard) {
      alert(`Tên đội "${duplicateInLeaderboard.name}" đã tồn tại trong Top vinh danh! Vui lòng chọn tên khác.`);
      return;
    }

    const finalTeams: Team[] = validTeams.map((t, index) => ({
      id: `team_${Date.now()}_${index}`,
      name: t.name.trim(),
      icon: t.icon,
      score: 0,
      correctAnswers: 0,
      totalTime: 0,
      selectedGroupId: t.selectedGroupId
    }));

    resetGameState();
    setGameState({ teams: finalTeams, currentTeamIndex: 0 });
    navigate('/game');
  };

  const addTeam = () => {
    setTeams([...teams, { name: '', icon: TEAM_ICONS[teams.length % TEAM_ICONS.length], selectedGroupId: settings.selectedGroupId || 1 }]);
  };

  const removeTeam = (index: number) => {
    if (teams.length > 1) {
      const newTeams = [...teams];
      newTeams.splice(index, 1);
      setTeams(newTeams);
    }
  };

  const updateTeam = (index: number, updates: Partial<TeamInput>) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], ...updates };
    setTeams(newTeams);
  };

  return (
    <div className="min-h-[100dvh] bg-emerald-400 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 w-full max-w-6xl items-start justify-center overflow-x-hidden">
        {/* Main Setup Card */}
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-8 flex-1 w-full text-center border-4 border-emerald-500">
          <h1 className="text-2xl sm:text-4xl font-black text-emerald-600 mb-1 sm:mb-2 uppercase tracking-tight text-balance">
            Nghiêng đầu trí tuệ
          </h1>
          <p className="text-emerald-500 font-bold text-base sm:text-lg mb-1 sm:mb-2 text-center">AI TOÁN THẦY ĐẠT PC</p>
          <p className="text-gray-500 mb-4 sm:mb-8 font-medium text-sm sm:text-base">Trò chơi tương tác bằng cử động đầu</p>

          <div className="space-y-6">
            <div className="text-left">
              <label className="block text-lg font-bold text-gray-700 mb-4">
                Danh sách đội chơi:
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {teams.map((team, index) => {
                  const isDuplicateInList = teams.some((t, i) => i !== index && t.name.trim() !== '' && t.name.trim().toLowerCase() === team.name.trim().toLowerCase());
                  const isDuplicateInLeaderboard = leaderboard.some(entry => entry.teamName.trim().toLowerCase() === team.name.trim().toLowerCase());
                  const isDuplicate = isDuplicateInList || isDuplicateInLeaderboard;
                  
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          <button
                            className="w-12 h-12 flex items-center justify-center bg-emerald-50 border-2 border-emerald-200 rounded-xl text-2xl hover:border-emerald-500 transition-colors"
                            title="Chọn icon"
                          >
                            {team.icon}
                          </button>
                          <div className="absolute left-0 top-full mt-2 hidden group-hover:grid grid-cols-6 gap-1 p-2 bg-white rounded-xl shadow-2xl border-2 border-emerald-100 z-[100] w-48">
                            {TEAM_ICONS.map(icon => (
                              <button
                                key={icon}
                                onClick={() => updateTeam(index, { icon })}
                                className="w-7 h-7 flex items-center justify-center hover:bg-emerald-50 rounded text-lg"
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => updateTeam(index, { name: e.target.value })}
                          placeholder={`Tên đội ${index + 1}...`}
                          className={`flex-1 text-lg p-3 rounded-xl border-2 focus:outline-none font-bold text-gray-800 placeholder-gray-300 transition-colors ${
                            isDuplicate ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-emerald-200 focus:border-emerald-500'
                          }`}
                          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                        />
                        <select
                          value={team.selectedGroupId}
                          onChange={(e) => updateTeam(index, { selectedGroupId: parseInt(e.target.value) })}
                          className="w-24 p-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:outline-none font-bold text-emerald-700 bg-white"
                          title="Chọn gói câu hỏi"
                        >
                          {[1, 2, 3, 4, 5].map((g) => (
                            <option key={g} value={g}>
                              Gói {g}
                            </option>
                          ))}
                        </select>
                        {teams.length > 1 && (
                          <button
                            onClick={() => removeTeam(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      {isDuplicateInList && (
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-14">Tên đội bị trùng trong danh sách!</p>
                      )}
                      {isDuplicateInLeaderboard && !isDuplicateInList && (
                        <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest ml-14">Tên đội đã tồn tại trong Top vinh danh!</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={addTeam}
                className="mt-4 w-full py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-500 transition-all"
              >
                <Plus size={20} /> Thêm đội chơi
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
              <div className="flex items-center gap-3">
                <Video className="text-emerald-600" size={24} />
                <div className="text-left">
                  <p className="font-black text-emerald-800 uppercase text-sm tracking-tight">Chế độ 2 đội cùng chơi</p>
                  <p className="text-xs text-emerald-600 font-bold">Chia đôi màn hình, thi đấu trực tiếp</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ isSimultaneous: !settings.isSimultaneous })}
                className={`w-14 h-8 rounded-full transition-all relative ${settings.isSimultaneous ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.isSimultaneous ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-2xl font-black py-4 px-8 rounded-2xl shadow-[0_8px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Play fill="currentColor" size={32} />
              BẮT ĐẦU CHƠI
            </button>

            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all border-2 border-emerald-200"
            >
              <Settings size={20} />
              Quản trị câu hỏi
            </button>

          </div>

          <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 text-left">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Hướng dẫn chơi:</h3>
            <ul className="space-y-2 text-gray-600 font-medium">
              <li className="flex items-center gap-2">
                <span className="text-2xl">⬅️</span> Nghiêng đầu TRÁI để chọn B
              </li>
              <li className="flex items-center gap-2">
                <span className="text-2xl">➡️</span> Nghiêng đầu PHẢI để chọn A
              </li>
              <li className="flex items-center gap-2">
                <span className="text-2xl">☝️</span> Giơ 1 NGÓN TAY để qua câu
              </li>
            </ul>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 w-full lg:w-80 border-4 border-emerald-500/50">
          <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-emerald-100">
            <Trophy className="text-orange-500" size={24} sm:size={28} />
            <h2 className="text-lg sm:text-xl font-black text-emerald-700 uppercase">Top 10 Vinh Danh</h2>
          </div>
          
          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                    index === 0 ? 'bg-yellow-50 border-yellow-200 scale-105 shadow-md' : 
                    index === 1 ? 'bg-slate-50 border-slate-200' :
                    index === 2 ? 'bg-orange-50 border-orange-200' :
                    'bg-white/50 border-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-black ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                      index === 1 ? 'bg-slate-300 text-slate-700' :
                      index === 2 ? 'bg-orange-300 text-orange-800' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{entry.icon || '🏆'}</span>
                      <span className="font-bold text-gray-700 truncate" title={entry.teamName}>
                        {entry.teamName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-black text-emerald-600 text-lg ml-2">{entry.score}</span>
                    <span className="text-[10px] font-bold text-gray-400">{(entry.totalTime / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400 font-bold">
                <User size={48} className="mx-auto mb-3 opacity-20" />
                Chưa có dữ liệu vinh danh
              </div>
            )}
          </div>

          {leaderboard.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">
                Cập nhật: {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Question } from '../store/useStore';
import { useVision } from '../hooks/useVision';
import confetti from 'canvas-confetti';
import { CheckCircle, XCircle, Trophy, ArrowRight, Printer, Facebook, Youtube, Phone, Music, Volume2, Home, Video } from 'lucide-react';
import Footer from '../components/Footer';
import { useIndexedDBMedia } from '../utils/useIndexedDBMedia';

const QuestionRenderer = ({ 
  question, 
  tIdx, 
  isSimultaneous, 
  teamBorderColor 
}: { 
  question: Question, 
  tIdx: number, 
  isSimultaneous: boolean, 
  teamBorderColor: string 
}) => {
  const { mediaUrl: questionMediaUrl } = useIndexedDBMedia(question.type === 'video_question' ? question.question : question.questionAudioId);

  if (question.type === 'image_question') {
    return <img src={question.question} alt="Question" className="max-h-full max-w-full object-contain rounded-xl z-10" />;
  }

  if (question.type === 'audio_question') {
    return (
      <div className="flex flex-col items-center gap-2 z-10">
        <Music size={32} className={`${tIdx === 0 ? 'text-sky-500' : 'text-rose-500'} animate-pulse`} />
        <h2 className={`text-lg font-bold ${tIdx === 0 ? 'text-sky-800' : 'text-rose-800'}`}>Nghe và chọn đáp án</h2>
      </div>
    );
  }

  if (question.type === 'video_question') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center z-10">
        {questionMediaUrl ? (
          <video 
            src={questionMediaUrl} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="max-h-full max-w-full object-contain rounded-xl"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Video size={32} className={`${tIdx === 0 ? 'text-sky-500' : 'text-rose-500'} animate-pulse`} />
            <h2 className={`text-lg font-bold ${tIdx === 0 ? 'text-sky-800' : 'text-rose-800'}`}>Đang tải video...</h2>
          </div>
        )}
      </div>
    );
  }

  return (
    <h2 className={`font-black text-gray-800 leading-tight px-4 w-full break-words ${isSimultaneous ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg sm:text-2xl md:text-4xl'}`}>
      {question.question}
    </h2>
  );
};

export default function Game() {
  const navigate = useNavigate();
  const { questions, settings, gameState, setGameState, resetGameState, addLeaderboardEntry, leaderboard } = useStore();
  const [isGameOver, setIsGameOver] = useState(false);
  const { videoRef, canvasRef, tilts, fingersRaised, isReady, cameraError, initError } = useVision(isGameOver);

  const [teamQuestions, setTeamQuestions] = useState<Question[][]>([[], []]);
  const [currentIndexes, setCurrentIndexes] = useState<number[]>([0, 0]);
  const [selectedAnswers, setSelectedAnswers] = useState<('A' | 'B' | null)[]>([null, null]);
  const [tiltLocked, setTiltLocked] = useState<boolean[]>([false, false]);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const [questionStartTimes, setQuestionStartTimes] = useState<number[]>([0, 0]);
  const answeredRefs = useRef<(number | null)[]>([null, null]);
  const [tiltProgresses, setTiltProgresses] = useState<number[]>([0, 0]);
  const [targetAnswers, setTargetAnswers] = useState<('A' | 'B' | null)[]>([null, null]);

  const isSimultaneous = settings.isSimultaneous && gameState.teams.length >= 2;
  const activeTeams = isSimultaneous ? [gameState.teams[0], gameState.teams[1]] : [gameState.teams[gameState.currentTeamIndex]];
  const hasNextTeam = !isSimultaneous && gameState.currentTeamIndex < gameState.teams.length - 1;

  const currentQ = teamQuestions[gameState.currentTeamIndex][currentIndexes[gameState.currentTeamIndex]];
  const selectedAnswer = selectedAnswers[gameState.currentTeamIndex];
  const tilt = tilts[gameState.currentTeamIndex];
  const fingersRaisedCount = fingersRaised[gameState.currentTeamIndex];
  const tiltProgress = tiltProgresses[gameState.currentTeamIndex];
  const targetAnswer = targetAnswers[gameState.currentTeamIndex];

  const { mediaUrl: aAudioUrl, isLoading: isAAudioLoading } = useIndexedDBMedia(currentQ?.A_audioId);
  const { mediaUrl: bAudioUrl, isLoading: isBAudioLoading } = useIndexedDBMedia(currentQ?.B_audioId);
  const { mediaUrl: bgmUrl } = useIndexedDBMedia(settings.customSounds?.bgm);

  // Audio objects (initialized once)
  const [correctSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'));
  const [wrongSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3'));
  const [winSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'));
  const [winnerSound] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'));
  const [bgmSound, setBgmSound] = useState<HTMLAudioElement | null>(null);

  const isFinalLeaderboardVisible = isGameOver && (!hasNextTeam && gameState.teams.length > 1 || showFinalLeaderboard);

  useEffect(() => {
    if (isFinalLeaderboardVisible) {
      winnerSound.play().catch(e => console.warn('Winner sound blocked:', e));
      
      // Grand confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isFinalLeaderboardVisible, winnerSound]);

  useEffect(() => {
    if (bgmUrl) {
      const audio = new Audio(bgmUrl);
      audio.loop = true;
      audio.volume = 0.3;
      setBgmSound(audio);
    } else {
      setBgmSound(null);
    }
  }, [bgmUrl]);

  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (isReady && !isGameOver) {
      const now = Date.now();
      setQuestionStartTimes(prev => prev.map((t, i) => {
        if (!selectedAnswers[i] && teamQuestions[i][currentIndexes[i]]) return now;
        return t;
      }));
    }
  }, [currentIndexes, gameState.currentTeamIndex, isReady, isGameOver, selectedAnswers, teamQuestions]);

  // Handle Audio Questions and Answers Sequence
  useEffect(() => {
    if (!isReady || isGameOver || selectedAnswer || !currentQ || isSimultaneous) {
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
      }
      return;
    }

    const allAudioReady = !isAAudioLoading && !isBAudioLoading;
    if (!allAudioReady) return;

    const seqId = ++sequenceRef.current;

    const playSequence = async () => {
      const playAudio = (url: string) => {
        return new Promise<void>((resolve) => {
          if (seqId !== sequenceRef.current) {
            resolve();
            return;
          }
          const audio = new Audio(url);
          questionAudioRef.current = audio;
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(e => {
            console.warn('Audio play blocked:', e);
            resolve();
          });
        });
      };

      // In non-simultaneous mode, we can play the question audio
      // For video questions, the video player handles its own audio
      if (currentQ.type === 'audio_question' && currentQ.question.startsWith('data:audio')) {
        await playAudio(currentQ.question);
      } else if (currentQ.questionAudioId) {
        // We need to fetch the media URL for the question audio if it's not simultaneous
        // But we removed the hook for it.
        // Actually, let's just skip question audio for now or re-add it if needed.
      }

      if (seqId !== sequenceRef.current) return;
      
      let aUrl = aAudioUrl;
      if (!aUrl && currentQ.A_audioId?.startsWith('data:audio')) aUrl = currentQ.A_audioId;
      if (aUrl) await playAudio(aUrl);
      if (seqId !== sequenceRef.current) return;
      
      let bUrl = bAudioUrl;
      if (!bUrl && currentQ.B_audioId?.startsWith('data:audio')) bUrl = currentQ.B_audioId;
      if (bUrl) await playAudio(bUrl);
    };

    playSequence();

    return () => {
      sequenceRef.current++;
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
        questionAudioRef.current = null;
      }
    };
  }, [currentQ, isReady, isGameOver, selectedAnswer, aAudioUrl, bAudioUrl, isAAudioLoading, isBAudioLoading, isSimultaneous]);

  // Handle BGM
  useEffect(() => {
    if (bgmSound && isReady && !isGameOver) {
      bgmSound.play().catch(e => console.warn('BGM play blocked:', e));
    }
    
    if (isGameOver && bgmSound) {
      bgmSound.pause();
      bgmSound.currentTime = 0;
    }

    return () => {
      if (bgmSound) {
        bgmSound.pause();
        bgmSound.currentTime = 0;
      }
    };
  }, [bgmSound, isReady, isGameOver]);

  useEffect(() => {
    if (!gameState.teams || gameState.teams.length === 0) {
      navigate('/');
      return;
    }

    // Reset local state
    setCurrentIndexes([0, 0]);
    setSelectedAnswers([null, null]);
    setIsGameOver(false);
    setTiltLocked([false, false]);
    setShowFinalLeaderboard(false);
    answeredRefs.current = [null, null];

    const setupTeam = (teamIdx: number) => {
      const team = gameState.teams[teamIdx];
      if (!team) return [];

      const groupQuestions = questions.filter(q => (q.groupId || 1) === team.selectedGroupId);
      const availableQuestions = groupQuestions.filter(q => !gameState.usedQuestionIds.includes(q.id));
      let selectedQs: Question[] = [];

      if (availableQuestions.length >= settings.questionsPerRound) {
        selectedQs = [...availableQuestions];
        if (settings.randomize) selectedQs = selectedQs.sort(() => Math.random() - 0.5);
        selectedQs = selectedQs.slice(0, settings.questionsPerRound);
      } else {
        const remainingNew = [...availableQuestions];
        const alreadyUsedInGroup = groupQuestions.filter(q => gameState.usedQuestionIds.includes(q.id));
        let fillCount = settings.questionsPerRound - remainingNew.length;
        let shuffledUsed = [...alreadyUsedInGroup].sort(() => Math.random() - 0.5);
        selectedQs = [...remainingNew, ...shuffledUsed.slice(0, fillCount)];
        if (selectedQs.length > settings.questionsPerRound) selectedQs = selectedQs.slice(0, settings.questionsPerRound);
      }

      if (settings.randomize) selectedQs = selectedQs.sort(() => Math.random() - 0.5);
      return selectedQs;
    };

    const t1Qs = setupTeam(isSimultaneous ? 0 : gameState.currentTeamIndex);
    const t2Qs = isSimultaneous ? setupTeam(1) : [];

    setTeamQuestions([t1Qs, t2Qs]);

    const newUsedIds = [...new Set([...gameState.usedQuestionIds, ...t1Qs.map(q => q.id), ...t2Qs.map(q => q.id)])];
    setGameState({ usedQuestionIds: newUsedIds });
  }, [questions, settings, gameState.currentTeamIndex, navigate, isSimultaneous]);

  useEffect(() => {
    if (isGameOver) return;

    [0, 1].forEach(i => {
      if (!isSimultaneous && i > 0) return;
      const currentQ = teamQuestions[i][currentIndexes[i]];
      if (!currentQ) return;

      // Handle next question via finger raise
      if (selectedAnswers[i] && fingersRaised[i] > 0) {
        handleNext(i);
      }
    });
  }, [fingersRaised, selectedAnswers, isGameOver, teamQuestions, currentIndexes, isSimultaneous]);

  const tiltStartTimes = useRef<(number | null)[]>( [null, null]);

  useEffect(() => {
    if (isGameOver) return;

    const intervals: (NodeJS.Timeout | null)[] = [null, null];

    [0, 1].forEach(i => {
      if (!isSimultaneous && i > 0) return;
      const currentQ = teamQuestions[i][currentIndexes[i]];
      if (!currentQ || selectedAnswers[i] || tiltLocked[i]) {
        tiltStartTimes.current[i] = null;
        setTiltProgresses(prev => {
          if (prev[i] === 0) return prev;
          const next = [...prev];
          next[i] = 0;
          return next;
        });
        setTargetAnswers(prev => {
          if (prev[i] === null) return prev;
          const next = [...prev];
          next[i] = null;
          return next;
        });
        return;
      }

      const tilt = tilts[i];
      if (tilt === 'left' || tilt === 'right') {
        const answer = tilt === 'left' ? 'B' : 'A';
        
        setTargetAnswers(prev => {
          if (prev[i] === answer) return prev;
          
          // If target answer changed, reset start time
          tiltStartTimes.current[i] = Date.now();
          
          const next = [...prev];
          next[i] = answer;
          return next;
        });

        const duration = 3000;

        intervals[i] = setInterval(() => {
          if (tiltStartTimes.current[i] === null) return;
          const elapsed = Date.now() - tiltStartTimes.current[i]!;
          const progress = Math.min((elapsed / duration) * 100, 100);
          
          setTiltProgresses(prev => {
            const nextProgress = progress;
            if (Math.abs(prev[i] - nextProgress) < 1) return prev; // Only update if changed by at least 1%
            const next = [...prev];
            next[i] = nextProgress;
            return next;
          });

          if (progress >= 100) {
            if (intervals[i]) clearInterval(intervals[i]!);
            tiltStartTimes.current[i] = null;
            handleAnswer(answer, i);
          }
        }, 50);
      } else {
        tiltStartTimes.current[i] = null;
        setTiltProgresses(prev => {
          if (prev[i] === 0) return prev;
          const next = [...prev];
          next[i] = 0;
          return next;
        });
        setTargetAnswers(prev => {
          if (prev[i] === null) return prev;
          const next = [...prev];
          next[i] = null;
          return next;
        });
      }
    });

    return () => {
      intervals.forEach(interval => interval && clearInterval(interval));
    };
  }, [tilts, selectedAnswers, isGameOver, teamQuestions, currentIndexes, tiltLocked, isSimultaneous]);

  const playSound = (audio: HTMLAudioElement) => {
    try {
      audio.currentTime = 0;
      audio.play().catch((e) => console.warn('Audio play blocked or failed:', e));
    } catch (e) {
      console.warn('Audio error:', e);
    }
  };

  const handleAnswer = (ans: 'A' | 'B', teamIdx: number = 0) => {
    if (selectedAnswers[teamIdx] || answeredRefs.current[teamIdx] === currentIndexes[teamIdx]) return;
    
    const currentQ = teamQuestions[teamIdx][currentIndexes[teamIdx]];
    if (!currentQ) return;

    const duration = Date.now() - questionStartTimes[teamIdx];
    answeredRefs.current[teamIdx] = currentIndexes[teamIdx];
    
    setTiltLocked(prev => {
      const next = [...prev];
      next[teamIdx] = true;
      return next;
    });
    setSelectedAnswers(prev => {
      const next = [...prev];
      next[teamIdx] = ans;
      return next;
    });
    
    const isCorrect = ans === currentQ.correct;
    const newTeams = [...gameState.teams];
    const actualTeamIdx = isSimultaneous ? teamIdx : gameState.currentTeamIndex;
    const team = { ...newTeams[actualTeamIdx] };
    
    team.totalTime += duration;

    if (isCorrect) {
      playSound(correctSound);
      team.score += 10;
      team.correctAnswers += 1;
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: isSimultaneous ? (teamIdx === 0 ? 0.25 : 0.75) : 0.5, y: 0.7 },
        colors: ['#10B981', '#F59E0B', '#3B82F6']
      });
    } else {
      playSound(wrongSound);
    }

    newTeams[actualTeamIdx] = team;
    setGameState({ teams: newTeams });
  };

  const handleNext = (teamIdx: number = 0) => {
    if (currentIndexes[teamIdx] < teamQuestions[teamIdx].length - 1) {
      setCurrentIndexes(prev => {
        const next = [...prev];
        next[teamIdx] = prev[teamIdx] + 1;
        return next;
      });
      setSelectedAnswers(prev => {
        const next = [...prev];
        next[teamIdx] = null;
        return next;
      });
      setTimeout(() => {
        setTiltLocked(prev => {
          const next = [...prev];
          next[teamIdx] = false;
          return next;
        });
      }, 1000);
    } else {
      // Mark this team as finished by setting its selected answer to something non-null if it's already answered
      // But we already have selectedAnswers[teamIdx] !== null check in allDone.
      
      // Check if all active teams are done
      const allDone = isSimultaneous 
        ? (currentIndexes[0] === teamQuestions[0].length - 1 && selectedAnswers[0] !== null &&
           currentIndexes[1] === teamQuestions[1].length - 1 && selectedAnswers[1] !== null)
        : true;

      if (allDone) {
        setIsGameOver(true);
        playSound(winSound);
        
        const actualTeams = isSimultaneous ? [0, 1] : [gameState.currentTeamIndex];
        actualTeams.forEach(idx => {
          addLeaderboardEntry({
            teamName: gameState.teams[idx].name,
            score: gameState.teams[idx].score,
            totalTime: gameState.teams[idx].totalTime,
            icon: gameState.teams[idx].icon,
          });
        });

        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6']
        });
      } else if (isSimultaneous) {
        // If one team is done but the other isn't, we can show a "Waiting for other team" message or just do nothing
        // For now, we'll just let it sit there.
      }
    }
  };

  if (cameraError) {
    return (
      <div className="min-h-[100dvh] bg-red-400 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi Camera</h2>
          <p className="text-gray-600 mb-6">{cameraError}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-[100dvh] bg-orange-400 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
          <XCircle className="w-20 h-20 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Lỗi tải dữ liệu AI</h2>
          <p className="text-gray-600 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-[100dvh] bg-emerald-400 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Đang khởi động AI...</h2>
          <p className="text-gray-500 mt-2">Vui lòng cho phép truy cập Camera</p>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    if (showFinalLeaderboard || (!hasNextTeam && gameState.teams.length > 1)) {
      const sortedTeams = [...gameState.teams].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.totalTime - b.totalTime; // Tie-breaker: shorter time wins
      });
      const winner = sortedTeams[0];

      return (
        <div className="min-h-[100dvh] bg-indigo-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Confetti effect for winner */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 animate-bounce delay-100">✨</div>
            <div className="absolute top-1/4 right-1/4 animate-bounce delay-300">🎉</div>
            <div className="absolute bottom-1/4 left-1/3 animate-bounce delay-500">🌟</div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-2xl w-full text-center border-8 border-yellow-400 relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Trophy className="text-yellow-500 w-24 h-24 sm:w-32 sm:h-32 animate-pulse" />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  WINNER!
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-indigo-700 mb-2 uppercase tracking-tight">
              BẢNG XẾP HẠNG CHUNG CUỘC
            </h1>
            <p className="text-gray-500 font-bold mb-8">Chúc mừng các đội đã hoàn thành xuất sắc!</p>

            <div className="space-y-4 mb-10">
              {sortedTeams.map((team, idx) => {
                const rank = sortedTeams.findIndex(t => t.score === team.score && t.totalTime === team.totalTime) + 1;
                return (
                  <div 
                    key={team.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border-4 transition-all ${
                      rank === 1 
                        ? 'bg-yellow-50 border-yellow-400 scale-105 shadow-xl' 
                        : rank === 2 
                          ? 'bg-gray-50 border-gray-300' 
                          : rank === 3 
                            ? 'bg-orange-50 border-orange-300' 
                            : 'bg-white border-indigo-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-xl sm:text-2xl font-black shadow-md ${
                        rank === 1 ? 'bg-yellow-400 text-yellow-900' : rank === 2 ? 'bg-gray-300 text-gray-800' : rank === 3 ? 'bg-orange-400 text-white' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {rank}
                      </span>
                      <div className="text-left flex items-center gap-3">
                        <span className="text-3xl sm:text-4xl">{team.icon || '🏆'}</span>
                        <div>
                          <p className={`font-black text-lg sm:text-2xl ${rank === 1 ? 'text-yellow-700' : 'text-gray-800'}`}>
                            {team.name}
                          </p>
                          {rank === 1 && <p className="text-xs sm:text-sm font-bold text-yellow-600 uppercase">Nhà vô địch 🏆</p>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl sm:text-4xl font-black text-indigo-600">{team.score}</p>
                      <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Điểm số</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">
                        {(team.totalTime / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    resetGameState();
                    setIsGameOver(false);
                    setCurrentIndexes([0, 0]);
                    setTiltLocked([false, false]);
                    setShowFinalLeaderboard(false);
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-black py-4 px-8 rounded-2xl shadow-[0_6px_0_rgb(5,150,105)] hover:shadow-[0_2px_0_rgb(5,150,105)] hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-6 h-6" />
                  CHƠI LẠI
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black py-4 px-8 rounded-2xl shadow-[0_6px_0_rgb(49,46,129)] hover:shadow-[0_2px_0_rgb(49,46,129)] hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <Home className="w-6 h-6" />
                  VỀ TRANG CHỦ
                </button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    const resultTeam = isSimultaneous ? (gameState.teams[0].score >= gameState.teams[1].score ? gameState.teams[0] : gameState.teams[1]) : activeTeams[0];

    return (
      <div className="min-h-[100dvh] bg-indigo-500 flex flex-col items-center justify-center p-4 relative">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-lg w-full text-center border-4 sm:border-8 border-yellow-400 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500"></div>
          
          <Trophy className="mx-auto text-yellow-500 mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20" />
          
          <h1 className="text-3xl sm:text-5xl font-black text-indigo-600 mb-2 uppercase tracking-tight">
            KẾT QUẢ
          </h1>
          
          <div className="bg-indigo-50 rounded-2xl p-4 sm:p-6 my-6 sm:my-8 border-2 border-indigo-100">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
              <span className="text-4xl">{resultTeam.icon || '🏆'}</span>
              Nhóm: <span className="text-indigo-600">{resultTeam.name}</span>
            </h2>
            
            <div className="flex justify-center gap-4 sm:gap-8 text-left">
              <div>
                <p className="text-gray-500 font-medium text-sm sm:text-lg uppercase">Điểm số</p>
                <p className="text-3xl sm:text-5xl font-black text-orange-500">{resultTeam.score}</p>
              </div>
              <div className="w-px bg-indigo-200"></div>
              <div>
                <p className="text-gray-500 font-medium text-sm sm:text-lg uppercase">Câu đúng</p>
                <p className="text-3xl sm:text-5xl font-black text-emerald-500">
                  {resultTeam.correctAnswers}/{teamQuestions[0].length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {hasNextTeam ? (
              <button
                onClick={() => {
                  setGameState({ currentTeamIndex: gameState.currentTeamIndex + 1 });
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xl sm:text-2xl font-black py-3 sm:py-4 px-4 sm:px-8 rounded-2xl shadow-[0_4px_0_rgb(5,150,105)] sm:shadow-[0_6px_0_rgb(5,150,105)] hover:shadow-[0_2px_0_rgb(5,150,105)] hover:translate-y-1 transition-all flex items-center justify-center gap-2 sm:gap-3 animate-pulse"
              >
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
                ĐỘI TIẾP THEO: {gameState.teams[gameState.currentTeamIndex + 1].name}
              </button>
            ) : gameState.teams.length > 1 && (
              <button
                onClick={() => setShowFinalLeaderboard(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl sm:text-2xl font-black py-3 sm:py-4 px-4 sm:px-8 rounded-2xl shadow-[0_4px_0_rgb(49,46,129)] sm:shadow-[0_6px_0_rgb(49,46,129)] hover:shadow-[0_2px_0_rgb(49,46,129)] hover:translate-y-1 transition-all flex items-center justify-center gap-2 sm:gap-3 animate-pulse"
              >
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />
                XEM BẢNG XẾP HẠNG CHUNG CUỘC
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg sm:text-xl font-bold py-3 sm:py-4 px-4 sm:px-8 rounded-2xl transition-colors"
            >
              Quay lại trang chủ
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-[100dvh] bg-sky-100 flex flex-col p-2 sm:p-4 relative">
      {/* Header */}
      {!isSimultaneous && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-3 bg-white p-3 rounded-2xl shadow-sm border-2 border-sky-200 gap-2 sm:gap-0">
          <div className="text-lg sm:text-2xl font-bold text-sky-800 text-center sm:text-left flex items-center gap-3">
            <span className="text-3xl">{activeTeams[0].icon || '🏆'}</span>
            <div className="flex flex-col">
              <span className="text-orange-500">Nhóm: {activeTeams[0].name}</span>
              <span className="text-xs text-emerald-600 uppercase tracking-widest">Gói câu hỏi: {activeTeams[0].selectedGroupId}</span>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-6 text-sm sm:text-xl font-bold">
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border border-emerald-200 whitespace-nowrap">
              Câu: {currentIndexes[0] + 1}/{teamQuestions[0].length}
            </div>
            <div className="bg-orange-100 text-orange-700 px-3 py-1 sm:px-4 sm:py-2 rounded-xl border border-orange-200 whitespace-nowrap">
              Điểm: {activeTeams[0].score}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col gap-3 sm:gap-4 min-h-0`}>
        {isSimultaneous ? (
          <>
            {/* Simultaneous Mode: Top-Middle-Bottom Layout */}
            
            {/* Top Section: Questions (Reduced height) */}
            <div className="grid grid-cols-2 gap-3 h-48 sm:h-60 min-h-[180px]">
              {activeTeams.map((team, tIdx) => {
                const currentQ = teamQuestions[tIdx][currentIndexes[tIdx]];
                if (!currentQ) return null;
                const isFinished = currentIndexes[tIdx] === teamQuestions[tIdx].length - 1 && selectedAnswers[tIdx] !== null;
                const teamBorderColor = tIdx === 0 ? 'border-sky-300' : 'border-rose-300';
                
                return (
                  <div key={`q-${team.id}`} className={`bg-white rounded-2xl shadow-md p-3 text-center border-4 ${teamBorderColor} flex flex-col justify-center items-center relative overflow-hidden`}>
                    {isFinished ? (
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className="text-2xl animate-bounce">🏁</div>
                        <h2 className="text-sm font-black text-emerald-600 uppercase">Đã hoàn thành!</h2>
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                          <span className="text-lg">☝️</span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase leading-tight">Giơ ngón tay để chuyển tiếp</span>
                        </div>
                      </div>
                    ) : (
                      <QuestionRenderer 
                        question={currentQ} 
                        tIdx={tIdx} 
                        isSimultaneous={true} 
                        teamBorderColor={teamBorderColor} 
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Middle Section: Camera & Stats Bar */}
            <div className="flex items-center justify-center gap-4 py-2 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-white/50 shadow-inner">
              {/* Team 1 Stats */}
              <div className="flex-1 flex flex-col items-end pr-4 border-r-2 border-sky-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{activeTeams[0].icon || '🏆'}</span>
                  <span className="font-black text-sky-800 text-lg truncate max-w-[120px]">{activeTeams[0].name}</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Đúng</span>
                    <span className="text-xl font-black text-emerald-800">{activeTeams[0].score}</span>
                  </div>
                  <div className="flex flex-col items-center bg-rose-100 px-3 py-1 rounded-xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Câu</span>
                    <span className="text-xl font-black text-rose-800">{currentIndexes[0] + 1}</span>
                  </div>
                </div>
              </div>

              {/* Central Camera (Enlarged) */}
              <div className="relative w-80 aspect-video sm:w-[450px] shrink-0">
                <div className="absolute inset-0 rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-gray-900 ring-4 ring-indigo-500/30">
                  <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" playsInline muted />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform scale-x-[-1]" />
                  
                  {/* Vertical Divider Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 -translate-x-1/2 z-10 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                  
                  {/* Team Indicators on Camera Sides */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-sky-500/60 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded shadow-sm z-20 border border-white/20">
                    {activeTeams[0].icon} ĐỘI 1
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-500/60 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded shadow-sm z-20 border border-white/20">
                    ĐỘI 2 {activeTeams[1].icon}
                  </div>

                  {/* Camera Overlay */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg z-20">
                    LIVE
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg z-30 border-2 border-white">
                    VS
                  </div>
                </div>
              </div>

              {/* Team 2 Stats */}
              <div className="flex-1 flex flex-col items-start pl-4 border-l-2 border-rose-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-rose-800 text-lg truncate max-w-[120px]">{activeTeams[1].name}</span>
                  <span className="text-2xl">{activeTeams[1].icon || '🏆'}</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center bg-rose-100 px-3 py-1 rounded-xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Câu</span>
                    <span className="text-xl font-black text-rose-800">{currentIndexes[1] + 1}</span>
                  </div>
                  <div className="flex flex-col items-center bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Đúng</span>
                    <span className="text-xl font-black text-emerald-800">{activeTeams[1].score}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Answers (Reduced height) */}
            <div className="grid grid-cols-2 gap-6 h-40 sm:h-52 min-h-[150px] px-2">
              {activeTeams.map((team, tIdx) => {
                const currentQ = teamQuestions[tIdx][currentIndexes[tIdx]];
                if (!currentQ) return null;
                const isFinished = currentIndexes[tIdx] === teamQuestions[tIdx].length - 1 && selectedAnswers[tIdx] !== null;
                
                return (
                  <div key={`a-${team.id}`} className="flex flex-col gap-4 min-h-0">
                    {!isFinished ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          {['A', 'B'].map((opt) => {
                            const isSelected = selectedAnswers[tIdx] === opt;
                            const isCorrect = currentQ.correct === opt;
                            const isTarget = targetAnswers[tIdx] === opt;
                            const tilt = tilts[tIdx];
                            const isTilting = (opt === 'A' && tilt === 'right') || (opt === 'B' && tilt === 'left');

                            return (
                              <div 
                                key={opt}
                                className={`relative rounded-[2rem] border-4 transition-all duration-300 flex flex-col items-center justify-center p-4 cursor-pointer overflow-hidden shadow-sm
                                  ${isSelected 
                                    ? isCorrect 
                                      ? 'border-emerald-500 bg-emerald-100 scale-105 shadow-xl z-10' 
                                      : 'border-red-500 bg-red-100 scale-95 opacity-70'
                                    : opt === 'A' ? 'border-rose-400 bg-rose-50 hover:bg-rose-100' : 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                                  }
                                  ${isTilting && !isSelected ? 'scale-105 border-opacity-100 shadow-xl z-10 ring-4 ring-indigo-500/20' : ''}
                                `}
                                onClick={() => handleAnswer(opt as 'A' | 'B', tIdx)}
                              >
                                {!isSelected && isTarget && (
                                  <div 
                                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 z-0 ${opt === 'A' ? 'bg-rose-500/30' : 'bg-blue-500/30'}`}
                                    style={{ height: `${tiltProgresses[tIdx]}%` }}
                                  />
                                )}
                                <div className={`absolute top-3 ${opt === 'A' ? 'left-3' : 'right-3'} w-9 h-9 rounded-full flex items-center justify-center text-base font-black shadow-lg z-20 ${opt === 'A' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                                  {opt}
                                </div>
                                
                                <div className="w-full h-full flex items-center justify-center relative p-2">
                                  {currentQ[`${opt}_type` as keyof Question] === 'image' || (currentQ.type === 'image' && !currentQ[`${opt}_type` as keyof Question]) ? (
                                    <img src={currentQ[opt as keyof Question] as string} alt={`Option ${opt}`} className="max-h-full max-w-full object-contain rounded-2xl shadow-sm" />
                                  ) : (
                                    <span className="font-black text-gray-800 text-center break-words px-2 text-base sm:text-xl lg:text-2xl tracking-tight">
                                      {currentQ[opt as keyof Question] as string}
                                    </span>
                                  )}
                                </div>

                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-[1.8rem] backdrop-blur-md z-30">
                                    {isCorrect ? (
                                      <div className="flex flex-col items-center animate-bounce text-center">
                                        <span className="text-5xl mb-1">🌟</span>
                                        <span className="text-base font-black text-emerald-600 uppercase tracking-widest">Đúng!</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center animate-pulse text-center">
                                        <span className="text-5xl mb-1">🤪</span>
                                        <span className="text-base font-black text-red-600 uppercase tracking-widest">Sai!</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {selectedAnswers[tIdx] && (
                          <button
                            onClick={() => handleNext(tIdx)}
                            className="bg-gray-900 text-white py-3 rounded-2xl flex items-center justify-center gap-3 animate-pulse shadow-xl hover:bg-black transition-colors"
                          >
                            <span className="text-2xl">☝️</span>
                            <span className="text-base font-black uppercase tracking-wider">Tiếp tục</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-200 flex items-center justify-center">
                        <div className="text-center opacity-30">
                          <div className="text-6xl mb-3">🏆</div>
                          <div className="text-base font-black uppercase tracking-widest">Đã xong</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Single Team Mode: Original Layout */
          activeTeams.map((team, tIdx) => {
            const currentQ = teamQuestions[tIdx][currentIndexes[tIdx]];
            if (!currentQ) return null;
            const isFinished = currentIndexes[tIdx] === teamQuestions[tIdx].length - 1 && selectedAnswers[tIdx] !== null;
            const teamBorderColor = tIdx === 0 ? 'border-sky-300' : 'border-rose-300';

            return (
              <div key={team.id} className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  {/* Question Area */}
                  <div className={`bg-white rounded-2xl shadow-lg p-4 text-center border-4 ${teamBorderColor} flex-1 flex flex-col justify-center items-center relative overflow-hidden min-h-[120px]`}>
                    {isFinished ? (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <div className="text-4xl animate-bounce">🏁</div>
                        <h2 className="text-xl font-black text-emerald-600 uppercase">Đã hoàn thành!</h2>
                        <p className="text-sm text-gray-500">Đang chờ đội kia...</p>
                        <div className="mt-2 flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 animate-pulse">
                          <span className="text-xl">☝️</span>
                          <span className="text-xs font-bold text-emerald-700 uppercase">Giơ ngón tay vào camera để chuyển tiếp</span>
                        </div>
                      </div>
                    ) : (
                      <QuestionRenderer 
                        question={currentQ} 
                        tIdx={tIdx} 
                        isSimultaneous={false} 
                        teamBorderColor={teamBorderColor} 
                      />
                    )}
                  </div>

                  {/* Answers Area (Reduced height) */}
                  {!isFinished && (
                    <div className="grid grid-cols-2 gap-2 sm:h-48 md:h-60 min-h-[150px]">
                      {['A', 'B'].map((opt) => {
                        const isSelected = selectedAnswers[tIdx] === opt;
                        const isCorrect = currentQ.correct === opt;
                        const isTarget = targetAnswers[tIdx] === opt;
                        const tilt = tilts[tIdx];
                        const isTilting = (opt === 'A' && tilt === 'right') || (opt === 'B' && tilt === 'left');

                        return (
                          <div 
                            key={opt}
                            className={`relative rounded-xl border-4 transition-all duration-300 flex flex-col items-center justify-center p-2 cursor-pointer overflow-hidden
                              ${isSelected 
                                ? isCorrect 
                                  ? 'border-emerald-500 bg-emerald-100 scale-105 shadow-xl z-10' 
                                  : 'border-red-500 bg-red-100 scale-95 opacity-70'
                                : opt === 'A' ? 'border-rose-400 bg-rose-50' : 'border-blue-400 bg-blue-50'
                              }
                              ${isTilting && !isSelected ? 'scale-105 border-opacity-100 shadow-xl z-10' : ''}
                            `}
                            onClick={() => handleAnswer(opt as 'A' | 'B', tIdx)}
                          >
                            {!isSelected && isTarget && (
                              <div 
                                className={`absolute bottom-0 left-0 w-full transition-all duration-75 z-0 ${opt === 'A' ? 'bg-rose-500/30' : 'bg-blue-500/30'}`}
                                style={{ height: `${tiltProgresses[tIdx]}%` }}
                              />
                            )}
                            <div className={`absolute top-1 ${opt === 'A' ? 'left-1' : 'right-1'} w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-md z-20 ${opt === 'A' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                              {opt}
                            </div>
                            
                            <div className="w-full h-full flex items-center justify-center relative">
                              {currentQ[`${opt}_type` as keyof Question] === 'image' || (currentQ.type === 'image' && !currentQ[`${opt}_type` as keyof Question]) ? (
                                <img src={currentQ[opt as keyof Question] as string} alt={`Option ${opt}`} className="max-h-full max-w-full object-contain rounded-lg" />
                              ) : (
                                <span className="font-bold text-gray-800 text-center break-words px-1 text-xl sm:text-3xl md:text-5xl">
                                  {currentQ[opt as keyof Question] as string}
                                </span>
                              )}
                            </div>

                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl backdrop-blur-sm z-30">
                                {isCorrect ? (
                                  <div className="flex flex-col items-center animate-bounce text-center">
                                    <span className="text-3xl sm:text-5xl">🌟</span>
                                    <span className="text-xs sm:text-sm font-black text-emerald-600 uppercase">Đúng!</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center animate-pulse text-center">
                                    <span className="text-3xl sm:text-5xl">🤪</span>
                                    <span className="text-xs sm:text-sm font-black text-red-600 uppercase">Sai!</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Finger Prompt */}
                  {selectedAnswers[tIdx] && !isFinished && (
                    <button
                      onClick={() => handleNext(tIdx)}
                      className="mt-2 bg-gray-900 text-white py-2 rounded-xl flex items-center justify-center gap-2 animate-pulse"
                    >
                      <span className="text-xl">☝️</span>
                      <span className="text-xs font-bold uppercase">Tiếp tục</span>
                    </button>
                  )}
                </div>

                {/* Camera Sidebar (Enlarged, Only in single mode) */}
                <div className="w-full lg:w-[450px] flex flex-col gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border-2 border-sky-200 p-2 relative aspect-video overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1] rounded-xl bg-gray-900" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] transform scale-x-[-1]" />
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border-2 border-sky-200 p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-sky-800 mb-4 flex items-center gap-2 pb-2 border-b-2 border-sky-100">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Bảng điểm
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                      {gameState.teams.map((team, idx) => (
                        <div 
                          key={team.id} 
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            idx === gameState.currentTeamIndex ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500' : 'bg-sky-50 border-sky-100 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${idx === gameState.currentTeamIndex ? 'bg-emerald-500 text-white' : 'bg-sky-200 text-sky-800'}`}>
                              {idx + 1}
                            </span>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span>{team.icon || '🏆'}</span>
                                <span className="font-bold text-gray-700 truncate max-w-[100px]">{team.name}</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-black text-orange-500 text-lg">{team.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Camera for Simultaneous Mode - Circular "Core" Layout */}
      {/* Removed from here as it's now integrated into the middle bar */}

      <Footer />
    </div>
  );
}

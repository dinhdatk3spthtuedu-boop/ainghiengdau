import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuestionType = 'text' | 'image' | 'image_question' | 'audio_question' | 'video_question';
export type AnswerType = 'text' | 'image';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  groupId: number; // 1-5
  questionAudioId?: string;
  A: string;
  A_type?: AnswerType;
  A_audioId?: string;
  B: string;
  B_type?: AnswerType;
  B_audioId?: string;
  correct: 'A' | 'B';
}

export interface GameSettings {
  questionsPerRound: number;
  randomize: boolean;
  totalRounds: number;
  selectedGroupId: number; // 1-5
  isSimultaneous?: boolean;
  customSounds?: {
    bgm?: string;
  };
}

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  score: number;
  totalTime: number;
  date: string;
  icon?: string;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalTime: number; // in milliseconds
  icon?: string;
  selectedGroupId: number;
}

export interface GameState {
  teams: Team[];
  currentTeamIndex: number;
  currentRound: number;
  usedQuestionIds: string[];
}

interface StoreState {
  questions: Question[];
  settings: GameSettings;
  gameState: GameState;
  leaderboard: LeaderboardEntry[];
  addQuestion: (q: Omit<Question, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  updateSettings: (s: Partial<GameSettings>) => void;
  setGameState: (s: Partial<GameState>) => void;
  resetGameState: () => void;
  loadInitialQuestions: (qs: Question[]) => void;
  addLeaderboardEntry: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  removeLeaderboardEntry: (id: string) => void;
  clearLeaderboard: () => void;
}

const defaultQuestions: Question[] = [
  // Nhóm 1: Động vật & Toán cơ bản
  {
    id: '1',
    question: 'Con mèo kêu thế nào?',
    type: 'text',
    groupId: 1,
    A: 'Meo meo',
    B: 'Gâu gâu',
    correct: 'A',
  },
  {
    id: '2',
    question: '1 + 1 bằng mấy?',
    type: 'text',
    groupId: 1,
    A: '2',
    B: '3',
    correct: 'A',
  },
  {
    id: '3',
    question: 'Con gà trống gáy thế nào?',
    type: 'text',
    groupId: 1,
    A: 'Ò ó o',
    B: 'Cục tác',
    correct: 'A',
  },
  {
    id: '1-video',
    question: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video_question',
    groupId: 1,
    A: 'Con Thỏ',
    B: 'Con Gấu',
    correct: 'A',
  },
  // Nhóm 2: Trái cây & Màu sắc
  {
    id: '4',
    question: 'Quả chuối có màu gì khi chín?',
    type: 'text',
    groupId: 2,
    A: 'Màu vàng',
    B: 'Màu xanh',
    correct: 'A',
  },
  {
    id: '5',
    question: 'Quả táo thường có màu gì?',
    type: 'text',
    groupId: 2,
    A: 'Màu đỏ',
    B: 'Màu tím',
    correct: 'A',
  },
  {
    id: '6',
    question: 'Quả cam có hình gì?',
    type: 'text',
    groupId: 2,
    A: 'Hình tròn',
    B: 'Hình vuông',
    correct: 'A',
  },
  {
    id: '2-video',
    question: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    type: 'video_question',
    groupId: 2,
    A: 'Quả Cam',
    B: 'Quả Táo',
    correct: 'A',
  },
  // Nhóm 3: Hình khối & Đồ vật
  {
    id: '7',
    question: 'Cái bàn thường có mấy chân?',
    type: 'text',
    groupId: 3,
    A: '4 chân',
    B: '2 chân',
    correct: 'A',
  },
  {
    id: '8',
    question: 'Bánh xe có hình gì?',
    type: 'text',
    groupId: 3,
    A: 'Hình tròn',
    B: 'Hình tam giác',
    correct: 'A',
  },
  {
    id: '9',
    question: 'Quyển vở dùng để làm gì?',
    type: 'text',
    groupId: 3,
    A: 'Để viết',
    B: 'Để ăn',
    correct: 'A',
  },
  {
    id: '3-video',
    question: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video_question',
    groupId: 3,
    A: 'Hình Vuông',
    B: 'Hình Tròn',
    correct: 'B',
  },
  // Nhóm 4: Tự nhiên & Thời tiết
  {
    id: '10',
    question: 'Ông mặt trời mọc ở hướng nào?',
    type: 'text',
    groupId: 4,
    A: 'Hướng Đông',
    B: 'Hướng Tây',
    correct: 'A',
  },
  {
    id: '11',
    question: 'Khi trời mưa chúng ta cần mang gì?',
    type: 'text',
    groupId: 4,
    A: 'Mang ô/dù',
    B: 'Mang kính râm',
    correct: 'A',
  },
  {
    id: '12',
    question: 'Cầu vồng có mấy màu?',
    type: 'text',
    groupId: 4,
    A: '7 màu',
    B: '3 màu',
    correct: 'A',
  },
  {
    id: '4-video',
    question: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    type: 'video_question',
    groupId: 4,
    A: 'Trời Nắng',
    B: 'Trời Mưa',
    correct: 'A',
  },
  // Nhóm 5: Kiến thức chung
  {
    id: '13',
    question: 'Đèn giao thông màu gì thì được đi?',
    type: 'text',
    groupId: 5,
    A: 'Màu xanh',
    B: 'Màu đỏ',
    correct: 'A',
  },
  {
    id: '14',
    question: 'Chúng ta nghe bằng gì?',
    type: 'text',
    groupId: 5,
    A: 'Tai',
    B: 'Mũi',
    correct: 'A',
  },
  {
    id: '15',
    question: 'Một tuần có mấy ngày?',
    type: 'text',
    groupId: 5,
    A: '7 ngày',
    B: '5 ngày',
    correct: 'A',
  },
  {
    id: '5-video',
    question: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    type: 'video_question',
    groupId: 5,
    A: 'Vui vẻ',
    B: 'Buồn bã',
    correct: 'A',
  },
];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      questions: defaultQuestions,
      settings: {
        questionsPerRound: 5,
        randomize: true,
        totalRounds: 1,
        selectedGroupId: 1,
      },
      gameState: {
        teams: [],
        currentTeamIndex: 0,
        currentRound: 1,
        usedQuestionIds: [],
      },
      leaderboard: [],
      addQuestion: (q) =>
        set((state) => ({
          questions: [...state.questions, { ...q, id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }],
        })),
      updateQuestion: (id, q) =>
        set((state) => ({
          questions: state.questions.map((question) =>
            question.id === id ? { ...question, ...q } : question
          ),
        })),
      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      setGameState: (s) =>
        set((state) => ({ gameState: { ...state.gameState, ...s } })),
      resetGameState: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            teams: (state.gameState.teams || []).map(t => ({ ...t, score: 0, correctAnswers: 0, totalTime: 0 })),
            currentTeamIndex: 0,
            currentRound: 1,
            usedQuestionIds: [],
          },
        })),
      loadInitialQuestions: (qs) => set({ questions: qs }),
      addLeaderboardEntry: (entry) =>
        set((state) => {
          const newEntry: LeaderboardEntry = {
            ...entry,
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            date: new Date().toISOString(),
          };
          const newLeaderboard = [...state.leaderboard, newEntry]
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return a.totalTime - b.totalTime;
            })
            .slice(0, 50);
          return { leaderboard: newLeaderboard };
        }),
      removeLeaderboardEntry: (id) =>
        set((state) => ({
          leaderboard: state.leaderboard.filter((entry) => entry.id !== id),
        })),
      clearLeaderboard: () => set({ leaderboard: [] }),
    }),
    {
      name: 'edu-game-storage',
    }
  )
);

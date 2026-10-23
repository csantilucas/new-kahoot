const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Alternative {
  id?: string;
  letter: string;
  text: string;
  isCorrect: boolean;
  color: string;
}

export interface Question {
  id: string;
  quizId: string;
  order: number;
  statement: string;
  imageUrl?: string | null;
  points: number;
  explanation?: string | null;
  alternatives: Alternative[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  secondsPerQuestion: number;
  warningSeconds: number;
  bgMusic: string;
  soundEffects: boolean;
  entranceEffect?: 'normal' | 'delay' | 'step_by_step' | string;
  autoReveal: boolean;
  showExplanation: boolean;
  customMusicUrl?: string | null;
  correctSoundUrl?: string | null;
  timeUpSoundUrl?: string | null;
  countdownSoundUrl?: string | null;
  confettiSoundUrl?: string | null;
  questionStartSoundUrl?: string | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
  questions?: Question[];
  _count?: {
    questions: number;
  };
}

class ApiService {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('revisao_token');
    }
    return null;
  }

  public setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('revisao_token', token);
    }
  }

  public removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('revisao_token');
      localStorage.removeItem('revisao_user');
    }
  }

  public getUser() {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('revisao_user');
      return u ? JSON.parse(u) : null;
    }
    return null;
  }

  public setUser(user: any) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('revisao_user', JSON.stringify(user));
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || 'Falha na requisição');
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Quizzes
  async getQuizzes(): Promise<Quiz[]> {
    return this.request<Quiz[]>('/quizzes');
  }

  async getQuiz(id: string): Promise<Quiz> {
    return this.request<Quiz>(`/quizzes/${id}`);
  }

  async createQuiz(data: Partial<Quiz>): Promise<Quiz> {
    return this.request<Quiz>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuiz(id: string, data: Partial<Quiz>): Promise<Quiz> {
    return this.request<Quiz>(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(id: string): Promise<void> {
    return this.request<void>(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateQuiz(id: string): Promise<Quiz> {
    return this.request<Quiz>(`/quizzes/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Questions
  async createQuestion(quizId: string, data: Partial<Question>): Promise<Question> {
    return this.request<Question>(`/questions/quiz/${quizId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    return this.request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: string): Promise<void> {
    return this.request<void>(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    return this.request<void>(`/questions/quiz/${quizId}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ questionIds }),
    });
  }
}

export const api = new ApiService();

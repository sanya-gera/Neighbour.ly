import {
  User, Issue, LeaderboardUser, CreateIssueData,
  UpdateIssueStatusData, ApiResponse, PaginatedResponse, IssuesFilters,
} from '@/types';

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000';

// ── Token management ──────────────────────────────────────────────────────────

export const tokenStore = {
  get: (): string | null => localStorage.getItem('auth_token'),
  set: (token: string) => localStorage.setItem('auth_token', token),
  clear: () => localStorage.removeItem('auth_token'),
};

// ── Base fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) tokenStore.clear();
  return res.json();
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const auth = {
  signInWithGoogle(): void {
    window.location.href = `${BASE_URL}/api/auth/google`;
  },
  handleCallback(token: string): void {
    tokenStore.set(token);
  },
  async signOut(): Promise<ApiResponse<null>> {
    const result = await apiFetch<null>('/api/auth/signout', { method: 'POST' });
    tokenStore.clear();
    return result;
  },
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    if (!tokenStore.get()) return { data: null, success: true };
    try {
      return await apiFetch<User>('/api/auth/me');
    } catch {
      return { data: null, success: true };
    }
  },
};

// ── Issues API ────────────────────────────────────────────────────────────────

export const api = {
  async getIssues(filters?: IssuesFilters): Promise<ApiResponse<PaginatedResponse<Issue>>> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category.toUpperCase());
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.mine) params.set('mine', 'true');
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<PaginatedResponse<Issue>>(`/api/issues${qs}`);
  },

  async createIssue(issueData: CreateIssueData): Promise<ApiResponse<Issue>> {
    // Use FormData so we can include the photo file
    const form = new FormData();
    form.append('title', issueData.title);
    form.append('description', issueData.description);
    form.append('category', issueData.category.toUpperCase());
    form.append('location', issueData.location);
    if (issueData.latitude != null) form.append('latitude', String(issueData.latitude));
    if (issueData.longitude != null) form.append('longitude', String(issueData.longitude));
    if (issueData.photo) form.append('photo', issueData.photo);

    return apiFetch<Issue>('/api/issues', { method: 'POST', body: form });
  },

  async upvoteIssue(issueId: string, _userId: string): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/api/issues/${issueId}/upvote`, { method: 'POST' });
  },

  async updateIssueStatus(issueId: string, statusData: UpdateIssueStatusData): Promise<ApiResponse<Issue>> {
    const statusMap: Record<string, string> = {
      'Reported': 'REPORTED',
      'In Progress': 'IN_PROGRESS',
      'Fixed': 'FIXED',
    };
    return apiFetch<Issue>(`/api/issues/${issueId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: statusMap[statusData.status] ?? statusData.status }),
    });
  },

  async getLeaderboard(): Promise<ApiResponse<{ users: LeaderboardUser[] }>> {
    return apiFetch<{ users: LeaderboardUser[] }>('/api/leaderboard');
  },
};

// ── User API ──────────────────────────────────────────────────────────────────

export const userApi = {
  async updateRole(role: 'citizen' | 'authority'): Promise<ApiResponse<User>> {
    return apiFetch<User>('/api/users/role', {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};

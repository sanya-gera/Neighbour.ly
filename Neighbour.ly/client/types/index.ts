export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  role: 'citizen' | 'authority';
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: 'Road' | 'Streetlight' | 'Garbage' | 'Water' | 'Pollution' | 'Other';
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  photos: string[];
  status: 'Reported' | 'In Progress' | 'Fixed';
  votes: number;
  reporter: string;
  reporterId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  avatar?: string;
}

export interface CreateIssueData {
  title: string;
  description: string;
  category: Issue['category'];
  location: string;
  latitude?: number;
  longitude?: number;
  photo?: File | null;
  reporterId: string;
}

export interface UpdateIssueStatusData {
  status: Issue['status'];
  byUserId: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface IssuesFilters {
  role?: 'citizen' | 'authority';
  category?: Issue['category'];
  status?: Issue['status'];
  search?: string;
  page?: number;
  limit?: number;
  mine?: boolean;
}

import { User, Issue, LeaderboardUser } from '@/types';

// Mock data store
export const mockData = {
  user: {
    id: "u1",
    name: "Demo User",
    email: "demo@example.com",
    points: 30,
    role: "citizen" as 'citizen' | 'authority'
  },

  issues: [
    {
      id: "1",
      title: "Pothole near Market",
      description: "Large pothole causing traffic issues and vehicle damage. The hole is approximately 2 feet wide and 6 inches deep, making it dangerous for vehicles, especially during night time.",
      category: "Road" as Issue['category'],
      location: "Main Market Street, near Metro Station",
      status: "Reported" as Issue['status'],
      votes: 5,
      reporter: "Demo User",
      reporterId: "u1",
      photos: [],
      createdAt: "2025-01-16T09:00:00Z"
    } as Issue,
    {
      id: "2",
      title: "Streetlight not working",
      description: "Street light has been non-functional for over a week, making the area dark and unsafe for pedestrians, especially women and elderly people walking at night.",
      category: "Streetlight" as Issue['category'],
      location: "Sector 21 Road, outside Community Center",
      status: "In Progress" as Issue['status'],
      votes: 8,
      reporter: "Citizen A",
      reporterId: "u2",
      photos: [],
      createdAt: "2025-01-14T18:30:00Z"
    } as Issue,
    {
      id: "3",
      title: "Garbage pile not collected",
      description: "Garbage has been accumulating for 3 days and is starting to smell. Attracting stray animals and creating unhygienic conditions.",
      category: "Garbage" as Issue['category'],
      location: "Park Avenue, Block C",
      status: "Fixed" as Issue['status'],
      votes: 12,
      reporter: "Citizen B",
      reporterId: "u3",
      photos: [],
      createdAt: "2025-01-12T14:20:00Z"
    } as Issue,
    {
      id: "4",
      title: "Water leakage from main pipe",
      description: "Major water leakage from the main supply pipe causing water wastage and road damage. The leak has created a small pond on the road.",
      category: "Water" as Issue['category'],
      location: "Green Street, near School Gate",
      status: "Reported" as Issue['status'],
      votes: 15,
      reporter: "Citizen C",
      reporterId: "u4",
      photos: [],
      createdAt: "2025-01-15T11:45:00Z"
    } as Issue
  ],
  
  leaderboard: [
    { id: "u2", name: "Citizen A", points: 80 },
    { id: "u4", name: "Citizen C", points: 65 },
    { id: "u5", name: "Environmental Hero", points: 45 },
    { id: "u1", name: "Demo User", points: 30 },
    { id: "u3", name: "Citizen B", points: 20 },
    { id: "u6", name: "Road Reporter", points: 15 },
    { id: "u7", name: "Community Helper", points: 10 }
  ]
};

// State management class
class MockDataStore {
  private data = { ...mockData };
  private listeners: Array<() => void> = [];

  // Subscribe to data changes
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // User methods
  getUser(): User {
    return { ...this.data.user };
  }

  updateUser(updates: Partial<User>) {
    this.data.user = { ...this.data.user, ...updates };
    this.notify();
  }

  updateUserRole(role: 'citizen' | 'authority') {
    this.data.user.role = role;
    this.notify();
  }

  addPoints(points: number) {
    this.data.user.points += points;
    // Update leaderboard
    const leaderboardUser = this.data.leaderboard.find(u => u.id === this.data.user.id);
    if (leaderboardUser) {
      leaderboardUser.points = this.data.user.points;
    }
    this.notify();
  }

  // Issues methods
  getIssues(filters?: {
    category?: Issue['category'];
    status?: Issue['status'];
    search?: string;
    page?: number;
    limit?: number;
  }): { items: Issue[]; total: number; page: number; pageSize: number } {
    let filteredIssues = [...this.data.issues];

    // Apply filters
    if (filters?.category) {
      filteredIssues = filteredIssues.filter(issue => issue.category === filters.category);
    }
    
    if (filters?.status) {
      filteredIssues = filteredIssues.filter(issue => issue.status === filters.status);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredIssues = filteredIssues.filter(issue => 
        issue.title.toLowerCase().includes(searchLower) ||
        issue.description.toLowerCase().includes(searchLower) ||
        issue.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedIssues = filteredIssues.slice(startIndex, startIndex + limit);

    return {
      items: paginatedIssues,
      total: filteredIssues.length,
      page,
      pageSize: limit
    };
  }

  createIssue(issueData: Omit<Issue, 'id' | 'votes' | 'createdAt'>) {
    const newIssue: Issue = {
      ...issueData,
      id: `issue_${Date.now()}`,
      votes: 0,
      createdAt: new Date().toISOString()
    };
    
    this.data.issues.unshift(newIssue);
    this.notify();
    return newIssue;
  }

  upvoteIssue(issueId: string, userId: string): boolean {
    const issue = this.data.issues.find(i => i.id === issueId);
    if (issue) {
      issue.votes += 1;
      this.notify();
      return true;
    }
    return false;
  }

  updateIssueStatus(issueId: string, status: Issue['status'], byUserId: string): Issue | null {
    const issue = this.data.issues.find(i => i.id === issueId);
    if (issue) {
      issue.status = status;
      issue.updatedAt = new Date().toISOString();
      
      // Award points to reporter if status is Fixed
      if (status === 'Fixed') {
        const reporter = this.data.leaderboard.find(u => u.id === issue.reporterId);
        if (reporter) {
          reporter.points += 10; // Award 10 points for fixing
        }
      }
      
      this.notify();
      return issue;
    }
    return null;
  }

  // Leaderboard methods
  getLeaderboard(): LeaderboardUser[] {
    return [...this.data.leaderboard].sort((a, b) => b.points - a.points);
  }

  // Reset data to initial state
  reset() {
    this.data = { ...mockData };
    this.notify();
  }
}

// Export singleton instance
export const mockStore = new MockDataStore();

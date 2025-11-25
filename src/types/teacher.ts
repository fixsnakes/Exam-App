export interface TeacherDashboardSummary {
  totalExams?: number;
  totalClasses?: number;
  totalStudents?: number;
  pendingFeedback?: number;
  activeSessions?: number;
  examsByStatus?: Record<string, number | undefined>;
  revenueThisMonth?: number;
  examRevenueTrend?: number;
}

export interface TeacherDashboardRecent {
  exams?: Array<{
    id: string | number;
    title: string;
    created_at: string;
  }>;
  classes?: Array<{
    id: string | number;
    className: string;
    classCode?: string;
    created_at: string;
  }>;
  notifications?: Array<{
    id: string | number;
    title: string;
    description?: string;
    created_at: string;
  }>;
  purchases?: Array<{
    id: string | number;
    examName: string;
    buyerName?: string;
    amount?: number;
    purchased_at: string;
  }>;
}

export interface TeacherDashboardStats {
  summary?: TeacherDashboardSummary;
  recent?: TeacherDashboardRecent;
}

export interface TeacherClassSummary {
  id: string | number;
  className: string;
  classCode: string;
  studentCount: number;
  createdAt?: string;
}

export interface TeacherClassInfo {
  id: string | number;
  className: string;
  classCode: string;
  createdAt?: string;
  totalStudents?: number;
}

export interface TeacherClassStudent {
  id: string | number;
  fullName: string;
  email: string;
  joinedAt?: string;
  isBanned?: boolean;
}

export interface TeacherClassDetail {
  classInfo: TeacherClassInfo | null;
  students: TeacherClassStudent[];
}

export interface ClassPost {
  id: string | number;
  title: string;
  text: string;
  created_at?: string;
  author?: {
    fullName?: string;
    fullname?: string;
  };
}

export interface ClassPostComment {
  id: string | number;
  text: string;
  created_at?: string;
  author?: {
    fullName?: string;
    fullname?: string;
  };
}

export interface ExamSummary {
  id: string | number;
  title: string;
  description?: string;
  minutes?: number;
  total_questions?: number;
  created_at?: string;
}



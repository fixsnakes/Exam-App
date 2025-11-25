import { api } from './api';
import { TeacherDashboardStats } from '../types/teacher';

export const TeacherService = {
  getDashboardStats: async (): Promise<TeacherDashboardStats> => {
    const { data } = await api.get('/api/teacher/dashboard/stats');
    const payload = (data as { data?: TeacherDashboardStats })?.data;
    return payload ?? (data as TeacherDashboardStats);
  },
};



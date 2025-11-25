import { api } from './api';
import { ExamSummary } from '../types/teacher';

export const ExamService = {
  list: async (params?: Record<string, string | number>): Promise<ExamSummary[]> => {
    const { data } = await api.get('/api/exams', { params });
    return (Array.isArray(data) ? data : data?.data ?? []).map((exam: any) => ({
      id: exam?.id ?? exam?.exam_id ?? '',
      title: exam?.title ?? 'Đề thi',
      description: exam?.description,
      minutes: exam?.minutes,
      total_questions: exam?.total_questions ?? exam?.question_count,
      created_at: exam?.created_at ?? exam?.createdAt,
    }));
  },
};



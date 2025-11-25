import { api, buildQueryString } from './api';
import {
  TeacherClassDetail,
  TeacherClassStudent,
  TeacherClassSummary,
} from '../types/teacher';

const normalizeTeacherClass = (item: any): TeacherClassSummary => ({
  id: item?.id ?? item?.classId ?? item?._id ?? String(Math.random()),
  className: item?.className ?? item?.name ?? 'Chưa đặt tên',
  classCode: item?.classCode ?? item?.class_code ?? '—',
  studentCount:
    item?.studentsCount ??
    item?.studentCount ??
    item?.totalStudents ??
    item?.students?.length ??
    0,
  createdAt: item?.createdAt ?? item?.created_at ?? item?.createdOn ?? undefined,
});

const extractClassList = (response: any): TeacherClassSummary[] => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response.map(normalizeTeacherClass);
  }

  if (Array.isArray(response?.data)) {
    return response.data.map(normalizeTeacherClass);
  }

  if (Array.isArray(response?.classes)) {
    return response.classes.map(normalizeTeacherClass);
  }

  return [];
};

const normalizeClassDetail = (payload: any): TeacherClassDetail => {
  const classInfo = payload?.class ?? payload?.classInfo ?? payload?.data ?? payload ?? {};
  const students = Array.isArray(payload?.students)
    ? payload.students
    : Array.isArray(payload?.data?.students)
      ? payload.data.students
      : Array.isArray(classInfo?.students)
        ? classInfo.students
        : [];

  return {
    classInfo: {
      id: classInfo?.id ?? classInfo?.classId ?? classInfo?._id ?? '',
      className: classInfo?.className ?? classInfo?.name ?? 'Chưa đặt tên',
      classCode: classInfo?.classCode ?? classInfo?.class_code ?? '—',
      createdAt: classInfo?.createdAt ?? classInfo?.created_at ?? undefined,
      totalStudents:
        classInfo?.studentsCount ??
        classInfo?.studentCount ??
        classInfo?.totalStudents ??
        students.length,
    },
    students: students.map((student: any) => ({
      id: student?.id ?? student?.student_id ?? student?._id ?? '',
      fullName: student?.fullName ?? student?.name ?? 'Chưa cập nhật',
      email: student?.email ?? '—',
      joinedAt: student?.joinedAt ?? student?.joined_at ?? student?.createdAt,
      isBanned: student?.is_banned ?? student?.isBanned ?? student?.isBan ?? false,
    })),
  };
};

export const TeacherClassService = {
  getClasses: async (
    params?: Record<string, string | number>,
  ): Promise<TeacherClassSummary[]> => {
    const { data } = await api.get('/api/classes', {
      params,
    });
    return extractClassList(data);
  },
  createClass: async (className: string): Promise<TeacherClassSummary> => {
    const response = await api.post('/api/classes', { className });
    const payload = (response as { data?: any })?.data ?? response;
    return normalizeTeacherClass(payload);
  },
  getClassDetail: async (params: {
    classId?: string | number;
    classCode?: string;
  }): Promise<TeacherClassDetail> => {
    if (!params.classId && !params.classCode) {
      throw new Error('classId hoặc classCode là bắt buộc.');
    }
    const query = buildQueryString({
      class_id: params.classId ? String(params.classId) : undefined,
      class: params.classCode,
    });
    const endpoint = query ? `/api/classes/students?${query}` : '/api/classes/students';
    const { data } = await api.get(endpoint);
    return normalizeClassDetail(data);
  },
  toggleStudentBan: async (payload: {
    classId: string | number;
    studentId: string | number;
    isBanned: boolean;
  }): Promise<void> => {
    await api.post('/api/classes/student/ban', {
      class_id: Number(payload.classId),
      student_id: Number(payload.studentId),
      is_banned: payload.isBanned,
    });
  },
  updateClassName: async (classId: string | number, className: string): Promise<void> => {
    await api.put(`/api/classes/${classId}`, { className });
  },
  deleteClass: async (classId: number | string): Promise<void> => {
    await api.delete('/api/classes', {
      params: { class_id: classId },
    });
  },
};



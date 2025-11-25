import { api } from './api';
import { ClassPost, ClassPostComment } from '../types/teacher';

export const ClassPostService = {
  getPosts: async (classId: string | number): Promise<ClassPost[]> => {
    const { data } = await api.get(`/api/classes/posts/${classId}`);
    return (Array.isArray(data) ? data : []).map((post: any) => ({
      id: post?.id ?? post?._id ?? '',
      title: post?.title ?? '',
      text: post?.text ?? post?.post ?? '',
      created_at: post?.created_at ?? post?.createdAt,
      author: post?.author,
    }));
  },
  createPost: async (payload: { classId: string | number; title: string; post: string }) => {
    await api.post('/api/posts/create', {
      classId: payload.classId,
      title: payload.title,
      post: payload.post,
    });
  },
  updatePost: async (postId: string | number, payload: { title: string; post: string }) => {
    await api.post(`/api/posts/update/${postId}`, payload);
  },
  deletePost: async (postId: string | number) => {
    await api.delete(`/api/posts/${postId}`);
  },
  getComments: async (postId: string | number): Promise<ClassPostComment[]> => {
    const { data } = await api.get(`/api/posts/comment/${postId}`);
    return (Array.isArray(data) ? data : []).map((comment: any) => ({
      id: comment?.id ?? comment?._id ?? '',
      text: comment?.text ?? comment?.comment ?? '',
      created_at: comment?.created_at ?? comment?.createdAt,
      author: comment?.author,
    }));
  },
  addComment: async (payload: { postId: string | number; comment: string }) => {
    await api.post('/api/posts/comment', payload);
  },
  deleteComment: async (commentId: string | number) => {
    await api.delete(`/api/posts/comment/${commentId}`);
  },
};



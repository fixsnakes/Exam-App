import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ClassPostService } from '../../../services/classPost';
import { ExamService } from '../../../services/exam';
import { TeacherClassService } from '../../../services/teacherClass';
import {
  ClassPost,
  ClassPostComment,
  ExamSummary,
  TeacherClassDetail,
  TeacherClassStudent,
} from '../../../types/teacher';
import { RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherClassDetail'>;

const TAB_ITEMS = [
  { key: 'students', label: 'Học sinh' },
  { key: 'posts', label: 'Bài đăng' },
  { key: 'exams', label: 'Đề thi' },
];

const ClassDetailScreen = ({ route, navigation }: Props) => {
  const { classId, classCode } = route.params;
  const [detail, setDetail] = useState<TeacherClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingStudentId, setProcessingStudentId] = useState<
    string | number | null
  >(null);
  const [activeTab, setActiveTab] =
    useState<'students' | 'posts' | 'exams'>('students');

  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [comments, setComments] = useState<
    Record<string | number, ClassPostComment[]>
  >({});
  const [loadingComments, setLoadingComments] = useState<
    Record<string | number, boolean>
  >({});

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setError('');
      const response = await TeacherClassService.getClassDetail({
        classCode,
        classId,
      });
      setDetail(response);
    } catch (err) {
      console.error('[ClassDetail] loadDetail error', err);
      setError('Không thể tải thông tin lớp.');
    } finally {
      setLoading(false);
    }
  }, [classId, classCode]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const loadPosts = useCallback(async () => {
    if (!detail?.classInfo?.id) return;
    try {
      setLoadingPosts(true);
      const list = await ClassPostService.getPosts(detail.classInfo.id);
      setPosts(list);
    } catch (err) {
      console.error('[ClassDetail] loadPosts error', err);
      Alert.alert('Lỗi', 'Không thể tải bài đăng.');
    } finally {
      setLoadingPosts(false);
    }
  }, [detail?.classInfo?.id]);

  const loadExams = useCallback(async () => {
    if (!detail?.classInfo?.id) return;
    try {
      setLoadingExams(true);
      const list = await ExamService.list({ class_id: detail.classInfo.id });
      setExams(list);
    } catch (err) {
      console.error('[ClassDetail] loadExams error', err);
      Alert.alert('Lỗi', 'Không thể tải đề thi.');
    } finally {
      setLoadingExams(false);
    }
  }, [detail?.classInfo?.id]);

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts();
    }
    if (activeTab === 'exams') {
      loadExams();
    }
  }, [activeTab, loadPosts, loadExams]);

  const filteredStudents = useMemo(() => {
    if (!detail?.students) return [];
    if (!search.trim()) {
      return detail.students;
    }
    const keyword = search.trim().toLowerCase();
    return detail.students.filter(
      student =>
        student.fullName.toLowerCase().includes(keyword) ||
        student.email.toLowerCase().includes(keyword),
    );
  }, [detail?.students, search]);

  const handleCopyCode = async () => {
    if (!detail?.classInfo?.classCode) return;
    try {
      await Clipboard.setString(detail.classInfo.classCode);
      Alert.alert('Đã copy', 'Mã lớp đã được sao chép.');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể copy mã lớp.');
    }
  };

  const handleBanToggle = async (student: TeacherClassStudent) => {
    if (!detail?.classInfo?.id) return;
    const newStatus = !student.isBanned;
    try {
      setProcessingStudentId(student.id);
      await TeacherClassService.toggleStudentBan({
        classId: detail.classInfo.id,
        studentId: student.id,
        isBanned: newStatus,
      });
      setDetail(prev =>
        prev
          ? {
              ...prev,
              students: prev.students.map(item =>
                item.id === student.id ? { ...item, isBanned: newStatus } : item,
              ),
            }
          : prev,
      );
    } catch (err) {
      console.error('[ClassDetail] toggleBan error', err);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái học sinh.');
    } finally {
      setProcessingStudentId(null);
    }
  };

  const handleDeleteClass = async () => {
    if (!detail?.classInfo?.id) return;
    Alert.alert(
      'Xóa lớp',
      'Bạn chắc chắn muốn xóa lớp này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await TeacherClassService.deleteClass(detail.classInfo!.id);
              navigation.replace('TeacherClasses');
            } catch (err) {
              console.error('[ClassDetail] delete error', err);
              Alert.alert('Lỗi', 'Không thể xóa lớp.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleCreatePost = async () => {
    if (!detail?.classInfo?.id) return;
    if (!postTitle.trim() || !postBody.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung.');
      return;
    }
    try {
      setPosting(true);
      await ClassPostService.createPost({
        classId: detail.classInfo.id,
        title: postTitle,
        post: postBody,
      });
      setPostTitle('');
      setPostBody('');
      loadPosts();
    } catch (err) {
      console.error('[ClassDetail] create post error', err);
      Alert.alert('Lỗi', 'Không thể tạo bài đăng.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    Alert.alert('Xóa bài đăng', 'Bạn chắc chắn muốn xóa bài đăng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await ClassPostService.deletePost(postId);
            loadPosts();
          } catch (err) {
            console.error('[ClassDetail] delete post error', err);
            Alert.alert('Lỗi', 'Không thể xóa bài đăng.');
          }
        },
      },
    ]);
  };

  const loadCommentsForPost = async (postId: string | number) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const list = await ClassPostService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: list }));
    } catch (err) {
      console.error('[ClassDetail] load comments error', err);
      Alert.alert('Lỗi', 'Không thể tải bình luận.');
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const renderStudent = ({ item }: { item: TeacherClassStudent }) => (
    <View style={styles.studentRow}>
      <View>
        <Text style={styles.studentName}>{item.fullName}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
        <Text style={styles.studentMeta}>
          Tham gia:{' '}
          {item.joinedAt
            ? new Date(item.joinedAt).toLocaleDateString('vi-VN')
            : '—'}
        </Text>
      </View>
      <Pressable
        style={[
          styles.banButton,
          item.isBanned ? styles.unban : styles.ban,
          processingStudentId === item.id && styles.disabled,
        ]}
        onPress={() => handleBanToggle(item)}
        disabled={processingStudentId === item.id}>
        <Text
          style={item.isBanned ? styles.unbanText : styles.banText}>
          {item.isBanned ? 'Mở khóa' : 'Khóa'}
        </Text>
      </Pressable>
    </View>
  );

  const renderPost = ({ item }: { item: ClassPost }) => {
    const postComments = comments[item.id] || [];
    const isLoading = loadingComments[item.id];

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Pressable
            style={styles.postDelete}
            onPress={() => handleDeletePost(item.id)}>
            <Text style={styles.postDeleteText}>Xóa</Text>
          </Pressable>
        </View>
        <Text style={styles.postBody}>{item.text}</Text>
        <Text style={styles.postMeta}>
          {item.created_at
            ? new Date(item.created_at).toLocaleString('vi-VN')
            : ''}
        </Text>
        <Pressable
          style={styles.commentToggle}
          onPress={() => loadCommentsForPost(item.id)}>
          <Text style={styles.commentToggleText}>Xem bình luận</Text>
        </Pressable>
        {isLoading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : (
          postComments.map(comment => (
            <View key={comment.id} style={styles.commentRow}>
              <Text style={styles.commentAuthor}>
                {comment.author?.fullName || 'Người dùng'}
              </Text>
              <Text style={styles.commentBody}>{comment.text}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderExam = ({ item }: { item: ExamSummary }) => (
    <View style={styles.examCard}>
      <Text style={styles.examTitle}>{item.title}</Text>
      {!!item.description && (
        <Text style={styles.examDescription}>{item.description}</Text>
      )}
      <View style={styles.examMetaRow}>
        {item.minutes ? (
          <Text style={styles.examMeta}>Thời gian: {item.minutes} phút</Text>
        ) : null}
        {item.total_questions ? (
          <Text style={styles.examMeta}>
            Số câu hỏi: {item.total_questions}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.centerText}>Đang tải dữ liệu lớp...</Text>
      </View>
    );
  }

  if (error || !detail?.classInfo) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorText}>{error || 'Không có dữ liệu.'}</Text>
        <Pressable style={styles.primaryButton} onPress={loadDetail}>
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{detail.classInfo.className}</Text>
            <Text style={styles.subtitle}>
              Mã lớp: {detail.classInfo.classCode}
            </Text>
          </View>
          <Pressable style={styles.copyBadge} onPress={handleCopyCode}>
            <Text style={styles.copyBadgeText}>Copy mã</Text>
          </Pressable>
          <Pressable style={styles.dangerBadge} onPress={handleDeleteClass}>
            <Text style={styles.dangerBadgeText}>Xóa lớp</Text>
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          {TAB_ITEMS.map(tab => (
            <Pressable
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.key as typeof activeTab)}>
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.tabButtonTextActive,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'students' && (
          <View style={styles.sectionCard}>
            <TextInput
              placeholder="Tìm kiếm học sinh"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {filteredStudents.length === 0 ? (
              <Text style={styles.emptyText}>
                Chưa có học sinh hoặc không tìm thấy phù hợp.
              </Text>
            ) : (
              filteredStudents.map(student => (
                <View key={student.id} style={{ marginBottom: 12 }}>
                  {renderStudent({ item: student })}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'posts' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tạo bài đăng</Text>
            <TextInput
              placeholder="Tiêu đề"
              placeholderTextColor="#94a3b8"
              value={postTitle}
              onChangeText={setPostTitle}
              style={styles.textInput}
            />
            <TextInput
              placeholder="Nội dung"
              placeholderTextColor="#94a3b8"
              value={postBody}
              onChangeText={setPostBody}
              style={[styles.textInput, styles.textArea]}
              multiline
            />
            <Pressable
              style={[
                styles.primaryButton,
                posting && styles.disabledButton,
              ]}
              onPress={handleCreatePost}
              disabled={posting}>
              <Text style={styles.primaryButtonText}>
                {posting ? 'Đang đăng...' : 'Đăng bài'}
              </Text>
            </Pressable>

            {loadingPosts ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color="#4f46e5" />
              </View>
            ) : posts.length === 0 ? (
              <Text style={styles.emptyText}>
                Chưa có bài đăng nào trong lớp.
              </Text>
            ) : (
              posts.map(post => (
                <View key={post.id} style={{ marginBottom: 16 }}>
                  {renderPost({ item: post })}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'exams' && (
          <View style={styles.sectionCard}>
            {loadingExams ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color="#4f46e5" />
              </View>
            ) : exams.length === 0 ? (
              <Text style={styles.emptyText}>
                Chưa có đề thi nào trong lớp này.
              </Text>
            ) : (
              exams.map(exam => (
                <View key={exam.id} style={{ marginBottom: 12 }}>
                  {renderExam({ item: exam })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#475569',
  },
  copyBadge: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  copyBadgeText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  dangerBadge: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dangerBadgeText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  tabButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    color: '#0f172a',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    backgroundColor: '#fff',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  studentEmail: {
    color: '#475569',
  },
  studentMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  banButton: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'center',
  },
  ban: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
  },
  unban: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ecfdf5',
  },
  banText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  unbanText: {
    color: '#047857',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    backgroundColor: '#fdf4ff',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b21a8',
  },
  postDelete: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  postDeleteText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  postBody: {
    marginTop: 8,
    color: '#4c1d95',
  },
  postMeta: {
    marginTop: 6,
    color: '#a5b4fc',
    fontSize: 12,
  },
  commentToggle: {
    marginTop: 10,
  },
  commentToggleText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  commentRow: {
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#312e81',
  },
  commentBody: {
    color: '#4338ca',
  },
  examCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 14,
    backgroundColor: '#eff6ff',
  },
  examTitle: {
    fontWeight: '700',
    color: '#1d4ed8',
    fontSize: 16,
  },
  examDescription: {
    marginTop: 4,
    color: '#1e3a8a',
  },
  examMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 12,
  },
  examMeta: {
    color: '#1e40af',
    fontSize: 12,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  centerText: {
    color: '#475569',
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 12,
  },
});

export default ClassDetailScreen;



import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import StatCard from '../common/StatCard';
import { TeacherService } from '../../services/teacherDashboard';
import { TeacherClassService } from '../../services/teacherClass';
import {
  TeacherClassSummary,
  TeacherDashboardStats,
} from '../../types/teacher';
import { RootStackParamList } from '../../navigation/types';

type SectionId = 'overview' | 'exams' | 'classes' | 'notifications' | 'actions';

const TAB_ITEMS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'exams', label: 'Kỳ thi' },
  { id: 'classes', label: 'Lớp học' },
  { id: 'notifications', label: 'Thông báo' },
  { id: 'actions', label: 'Thao tác' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherDashboard'>;

const TeacherDashboardScreen = ({ navigation }: Props) => {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [teacherName, setTeacherName] = useState('Giáo viên');
  const [activeTab, setActiveTab] = useState<SectionId>('overview');
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [copiedClassId, setCopiedClassId] = useState<string | number | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('user_full_name').then(cached => {
      if (cached) {
        setTeacherName(cached);
      }
    });
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setError('');
      const response = await TeacherService.getDashboardStats();
      setStats(response);
    } catch (err) {
      console.error('[TeacherDashboard] loadStats error', err);
      setError('Không thể tải dữ liệu, thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadClasses = useCallback(async () => {
    try {
      setClassesLoading(true);
      setClassesError('');
      const list = await TeacherClassService.getClasses();
      setClasses(list);
    } catch (err) {
      console.error('[TeacherDashboard] loadClasses error', err);
      setClassesError('Không thể tải danh sách lớp học.');
    } finally {
      setClassesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const summary = stats?.summary ?? {};
  const recentExams = stats?.recent?.exams ?? [];
  const notificationItems = stats?.recent?.notifications ?? [];

  const filteredClasses = useMemo(() => {
    const keyword = classSearch.trim().toLowerCase();
    if (!keyword) {
      return classes;
    }
    return classes.filter(item =>
      item.className.toLowerCase().includes(keyword) ||
      item.classCode.toLowerCase().includes(keyword),
    );
  }, [classes, classSearch]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, item) => sum + (item.studentCount ?? 0), 0),
    [classes],
  );

  const quickActions = useMemo(
    () => [
      { label: '+ Tạo kỳ thi mới', onPress: () => console.log('Create Exam') },
      {
        label: '+ Tạo lớp học mới',
        onPress: () => navigation.navigate('TeacherCreateClass'),
      },
      {
        label: 'Danh sách lớp học',
        onPress: () => navigation.navigate('TeacherClasses'),
      },
      { label: 'Quản lý ngân sách', onPress: () => console.log('Manage budget') },
    ],
    [navigation],
  );

  const handleCopyClassCode = useCallback(async (classItem: TeacherClassSummary) => {
    if (!classItem.classCode) {
      return;
    }
    try {
      await Clipboard.setString(classItem.classCode);
      setCopiedClassId(classItem.id);
      setTimeout(() => setCopiedClassId(null), 2000);
    } catch (err) {
      console.error('[TeacherDashboard] copy class code error', err);
    }
  }, []);

  const performDeleteClass = useCallback(
    async (classItem: TeacherClassSummary) => {
      try {
        setDeletingClassId(classItem.id);
        await TeacherClassService.deleteClass(classItem.id);
        setClasses(prev => prev.filter(item => item.id !== classItem.id));
      } catch (err) {
        console.error('[TeacherDashboard] delete class error', err);
        Alert.alert('Lỗi', 'Xóa lớp thất bại, vui lòng thử lại.');
      } finally {
        setDeletingClassId(null);
      }
    },
    [],
  );

  const confirmDeleteClass = useCallback(
    (classItem: TeacherClassSummary) => {
      Alert.alert(
        'Xóa lớp học',
        `Bạn chắc chắn muốn xóa lớp "${classItem.className}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: () => performDeleteClass(classItem),
          },
        ],
      );
    },
    [performDeleteClass],
  );

  const formatCurrency = (value?: number) =>
    Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value ?? 0);

  const renderOverview = () => (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Chào mừng trở lại, {teacherName}!</Text>
        <Text style={styles.heroSubtitle}>
          Theo dõi trạng thái lớp học, kỳ thi và doanh thu ngay trên ứng dụng.
        </Text>
      </View>
      {!!error && (
        <Pressable style={styles.errorBox} onPress={loadStats}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Chạm để thử lại</Text>
        </Pressable>
      )}
      <View style={styles.statGrid}>
        <StatCard
          label="Tổng kỳ thi"
          value={summary.totalExams ?? 0}
          subtitle={`${summary.examsByStatus?.ongoing ?? 0} đang diễn ra`}
          accentColor="#4f46e5"
        />
        <StatCard
          label="Lớp học"
          value={summary.totalClasses ?? 0}
          subtitle={`${summary.totalStudents ?? 0} học sinh`}
          accentColor="#10b981"
        />
        <StatCard
          label="Yêu cầu chấm bài"
          value={summary.pendingFeedback ?? 0}
          subtitle="Cần phản hồi"
          accentColor="#f59e0b"
        />
        <StatCard
          label="Phiên thi hoạt động"
          value={summary.activeSessions ?? 0}
          accentColor="#0ea5e9"
        />
      </View>
      <View style={styles.revenueRow}>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Doanh thu tháng này</Text>
          <Text style={styles.revenueValue}>
            {formatCurrency(summary.revenueThisMonth)}
          </Text>
          <Text style={styles.revenueTrend}>
            {summary.examRevenueTrend ?? 12}% so với tháng trước
          </Text>
        </View>
        <View style={styles.revenueCardSecondary}>
          <Text style={styles.revenueLabel}>Sắp diễn ra</Text>
          <Text style={styles.revenueValue}>
            {summary.examsByStatus?.upcoming ?? 0}
          </Text>
          <Text style={styles.revenueTrend}>Kỳ thi cần chuẩn bị</Text>
        </View>
      </View>
    </>
  );

  const renderExams = () => (
    <View style={styles.section}>
      <SectionHeader
        title="Kỳ thi"
        actionLabel="Quản lý kỳ thi"
        onAction={() => console.log('Navigate to exams')}
      />
      {recentExams.length > 0 ? (
        recentExams.map(exam => (
          <ItemRow
            key={exam.id}
            title={exam.title}
            subtitle={new Date(exam.created_at).toLocaleDateString('vi-VN')}
            onPress={() => console.log('Open exam', exam.id)}
          />
        ))
      ) : (
        <EmptyState message="Chưa có kỳ thi nào" />
      )}
      <View style={styles.inlineButtons}>
        <Pressable style={styles.inlinePrimary} onPress={() => console.log('Create exam')}>
          <Text style={styles.inlinePrimaryText}>+ Kỳ thi mới</Text>
        </Pressable>
        <Pressable style={styles.inlineSecondary} onPress={() => console.log('View templates')}>
          <Text style={styles.inlineSecondaryText}>Mẫu đề thi</Text>
        </Pressable>
      </View>
    </View>
  );

  const handleNavigateClassDetail = (classSummary: TeacherClassSummary) => {
    navigation.navigate('TeacherClassDetail', {
      classCode: classSummary.classCode,
      classId: classSummary.id,
    });
  };

  const renderClasses = () => (
    <View style={styles.section}>
      <SectionHeader
        title="Lớp học"
        actionLabel="Danh sách"
        onAction={() => navigation.navigate('TeacherClasses')}
      />
      <View style={styles.classStatsRow}>
        <View style={styles.classStatCard}>
          <Text style={styles.classStatLabel}>Tổng số lớp</Text>
          <Text style={styles.classStatValue}>{classes.length}</Text>
          <Text style={styles.classStatHint}>Bạn đang quản lý</Text>
        </View>
        <View style={styles.classStatCard}>
          <Text style={styles.classStatLabel}>Học viên</Text>
          <Text style={styles.classStatValue}>{totalStudents}</Text>
          <Text style={styles.classStatHint}>Đã tham gia lớp</Text>
        </View>
        <View style={styles.classStatCard}>
          <Text style={styles.classStatLabel}>Sau lọc</Text>
          <Text style={styles.classStatValue}>{filteredClasses.length}</Text>
          <Text style={styles.classStatHint}>Phù hợp từ khóa</Text>
        </View>
      </View>

      <View style={styles.classSearchRow}>
        <View style={styles.classSearchInput}>
          <TextInput
            placeholder="Tìm kiếm lớp theo tên hoặc mã"
            placeholderTextColor="#94a3b8"
            value={classSearch}
            onChangeText={setClassSearch}
            style={styles.searchTextField}
          />
        </View>
        <Pressable style={styles.filterButton} onPress={() => console.log('Filter classes')}>
          <Text style={styles.filterButtonText}>Bộ lọc</Text>
        </Pressable>
      </View>

      {classesLoading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color="#4f46e5" />
          <Text style={styles.loaderText}>Đang tải lớp học...</Text>
        </View>
      ) : classesError ? (
        <Pressable style={styles.errorBox} onPress={loadClasses}>
          <Text style={styles.errorText}>{classesError}</Text>
          <Text style={styles.retryText}>Chạm để thử lại</Text>
        </Pressable>
      ) : filteredClasses.length === 0 ? (
        <EmptyState message="Chưa có lớp nào hoặc không trùng từ khóa." />
      ) : (
        <View style={styles.classList}>
          {filteredClasses.map(item => (
            <ClassCard
              key={item.id}
              data={item}
              onCopy={() => handleCopyClassCode(item)}
              onDelete={() => confirmDeleteClass(item)}
              deleting={deletingClassId === item.id}
              copied={copiedClassId === item.id}
              onPress={() => handleNavigateClassDetail(item)}
            />
          ))}
        </View>
      )}

      <View style={styles.inlineButtons}>
        <Pressable style={styles.inlinePrimary} onPress={() => console.log('Create class')}>
          <Text style={styles.inlinePrimaryText}>+ Lớp mới</Text>
        </Pressable>
        <Pressable
          style={styles.inlineSecondary}
          onPress={() => console.log('Invite students')}>
          <Text style={styles.inlineSecondaryText}>Mời học viên</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.section}>
      <SectionHeader
        title="Thông báo & cập nhật"
        actionLabel="Xem lịch sử"
        onAction={() => console.log('Navigate to notifications')}
      />
      {notificationItems.length > 0 ? (
        notificationItems.map(item => (
          <NotificationCard
            key={item.id}
            title={item.title}
            description={
              item.description ?? 'Trạng thái mới của hệ thống hoặc lớp học.'
            }
            timestamp={new Date(item.created_at).toLocaleString('vi-VN')}
          />
        ))
      ) : (
        <EmptyState message="Hiện chưa có thông báo mới" />
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <Text style={styles.sectionSubtitle}>
        Thực hiện các hành động phổ biến chỉ với một chạm.
      </Text>
      <View style={styles.actionWrap}>
        {quickActions.map(action => (
          <Pressable
            key={action.label}
            style={styles.actionButton}
            onPress={action.onPress}>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'exams':
        return renderExams();
      case 'classes':
        return renderClasses();
      case 'notifications':
        return renderNotifications();
      case 'actions':
        return renderActions();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadClasses()]);
    setRefreshing(false);
  }, [loadClasses, loadStats]);

  if (loading && !refreshing && !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brandText}>PTIT Quiz</Text>
            <Text style={styles.brandSubtitle}>Không gian giáo viên</Text>
          </View>
          <View style={styles.userBadge}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {teacherName?.charAt(0)?.toUpperCase() || 'T'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{teacherName}</Text>
              <Text style={styles.userRole}>Teacher</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}>
          {TAB_ITEMS.map(tab => (
            <Pressable
              key={tab.id}
              style={[
                styles.tabChip,
                activeTab === tab.id && styles.tabChipActive,
              ]}
              onPress={() => setActiveTab(tab.id)}>
              <Text
                style={[
                  styles.tabChipText,
                  activeTab === tab.id && styles.tabChipTextActive,
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {renderTabContent()}
      </ScrollView>

      <View style={styles.bottomNav}>
        {TAB_ITEMS.map(tab => (
          <Pressable
            key={tab.id}
            style={[
              styles.bottomNavItem,
              activeTab === tab.id && styles.bottomNavItemActive,
            ]}
            onPress={() => setActiveTab(tab.id)}>
            <Text
              style={[
                styles.bottomNavText,
                activeTab === tab.id && styles.bottomNavTextActive,
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const SectionHeader = ({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Pressable onPress={onAction}>
      <Text style={styles.sectionAction}>{actionLabel}</Text>
    </Pressable>
  </View>
);

const ItemRow = ({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <Pressable style={styles.itemRow} onPress={onPress}>
    <Text style={styles.itemTitle}>{title}</Text>
    <Text style={styles.itemSubtitle}>{subtitle}</Text>
  </Pressable>
);

const EmptyState = ({ message }: { message: string }) => (
  <View style={styles.emptyBox}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const ClassCard = ({
  data,
  onCopy,
  copied,
  onDelete,
  deleting,
  onPress,
}: {
  data: TeacherClassSummary;
  onCopy: () => void;
  copied: boolean;
  onDelete: () => void;
  deleting: boolean;
  onPress?: () => void;
}) => (
  <Pressable style={styles.classCard} onPress={onPress}>
    <View style={styles.classCardHeader}>
      <View>
        <Text style={styles.classCode}>{data.classCode}</Text>
        <Text style={styles.className}>{data.className}</Text>
      </View>
      <View style={styles.classStudentBadge}>
        <Text style={styles.classStudentText}>{data.studentCount} HV</Text>
      </View>
    </View>
    <View style={styles.classMetaRow}>
      <Text style={styles.classMetaLabel}>Ngày tạo</Text>
      <Text style={styles.classMetaValue}>
        {data.createdAt
          ? new Date(data.createdAt).toLocaleDateString('vi-VN')
          : 'Chưa cập nhật'}
      </Text>
    </View>
    <View style={styles.classActionsRow}>
      <Pressable style={styles.classGhostButton} onPress={onCopy}>
        <Text style={styles.classGhostText}>{copied ? 'Đã copy' : 'Copy mã'}</Text>
      </Pressable>
      <Pressable
        style={[styles.classGhostButton, styles.classDeleteButton]}
        onPress={onDelete}
        disabled={deleting}>
        <Text style={styles.classDeleteText}>
          {deleting ? 'Đang xóa...' : 'Xóa'}
        </Text>
      </Pressable>
    </View>
  </Pressable>
);

const NotificationCard = ({
  title,
  description,
  timestamp,
}: {
  title: string;
  description: string;
  timestamp: string;
}) => (
  <View style={styles.notificationCard}>
    <View style={styles.notificationDot} />
    <View style={{ flex: 1 }}>
      <Text style={styles.notificationTitle}>{title}</Text>
      <Text style={styles.notificationDescription}>{description}</Text>
      <Text style={styles.notificationTime}>{timestamp}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#475569',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 12,
    color: '#64748b',
  },
  tabBar: {
    paddingVertical: 6,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  tabChipText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 13,
  },
  tabChipTextActive: {
    color: '#fff',
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  heroSubtitle: {
    marginTop: 8,
    color: '#475569',
    fontSize: 15,
    lineHeight: 20,
  },
  errorBox: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  retryText: {
    marginTop: 6,
    color: '#b91c1c',
    fontSize: 13,
  },
  statGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  revenueRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  revenueCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#312e81',
  },
  revenueCardSecondary: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  revenueLabel: {
    fontSize: 13,
    color: '#cbd5f5',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  revenueValue: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 10,
    color: '#fff',
  },
  revenueTrend: {
    marginTop: 6,
    fontSize: 13,
    color: '#c7d2fe',
  },
  section: {
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  inlineButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  inlinePrimary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#4f46e5',
  },
  inlinePrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  inlineSecondary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  inlineSecondaryText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  itemRow: {
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  actionWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eef2ff',
  },
  actionText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 18,
    padding: 12,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomNavItem: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bottomNavItemActive: {
    backgroundColor: '#4f46e5',
  },
  bottomNavText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  bottomNavTextActive: {
    color: '#fff',
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#f97316',
    marginTop: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  notificationDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
  notificationTime: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
  classStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  classStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  classStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  classStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  classStatHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  classSearchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  classSearchInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  searchTextField: {
    fontSize: 14,
    color: '#0f172a',
  },
  filterButton: {
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  filterButtonText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  loaderBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loaderText: {
    color: '#475569',
  },
  classList: {
    gap: 12,
  },
  classCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classCode: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#4338ca',
    fontWeight: '700',
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  classStudentBadge: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  classStudentText: {
    color: '#15803d',
    fontWeight: '700',
  },
  classMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  classMetaLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  classMetaValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  classActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  classGhostButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  classGhostText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  classDeleteButton: {
    borderColor: '#fecaca',
  },
  classDeleteText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

export default TeacherDashboardScreen;



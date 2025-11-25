import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import StatCard from '../common/StatCard';
import {
  TeacherDashboardStats,
  TeacherService,
} from '../../services/api';
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

const TeacherDashboardScreen = (_props: Props) => {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [teacherName, setTeacherName] = useState('Giáo viên');
  const [activeTab, setActiveTab] = useState<SectionId>('overview');

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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const summary = stats?.summary ?? {};
  const recentExams = stats?.recent?.exams ?? [];
  const recentClasses = stats?.recent?.classes ?? [];
  const notificationItems = stats?.recent?.notifications ?? [];

  const quickActions = useMemo(
    () => [
      { label: '+ Tạo kỳ thi mới', onPress: () => console.log('Create Exam') },
      { label: '+ Tạo lớp học mới', onPress: () => console.log('Create Class') },
      { label: 'Xem danh sách kỳ thi', onPress: () => console.log('View Exams') },
      { label: 'Quản lý ngân sách', onPress: () => console.log('Manage budget') },
    ],
    [],
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

  const renderClasses = () => (
    <View style={styles.section}>
      <SectionHeader
        title="Lớp học"
        actionLabel="Quản lý lớp"
        onAction={() => console.log('Navigate to classes')}
      />
      {recentClasses.length > 0 ? (
        recentClasses.map(cls => (
          <ItemRow
            key={cls.id}
            title={cls.className}
            subtitle={`Mã: ${cls.classCode ?? '—'} • ${new Date(
              cls.created_at,
            ).toLocaleDateString('vi-VN')}`}
            onPress={() => console.log('Open class', cls.id)}
          />
        ))
      ) : (
        <EmptyState message="Chưa có lớp học nào" />
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
            onRefresh={() => {
              setRefreshing(true);
              loadStats();
            }}
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
});

export default TeacherDashboardScreen;



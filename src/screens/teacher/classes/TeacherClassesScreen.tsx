import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TeacherClassService } from '../../../services/teacherClass';
import { TeacherClassSummary } from '../../../types/teacher';
import { RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherClasses'>;

const TeacherClassesScreen = ({ navigation }: Props) => {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadClasses = useCallback(async () => {
    try {
      setError('');
      const list = await TeacherClassService.getClasses();
      setClasses(list);
    } catch (err) {
      console.error('[TeacherClasses] loadClasses error', err);
      setError('Không thể tải danh sách lớp.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    if (!search.trim()) {
      return classes;
    }
    const keyword = search.trim().toLowerCase();
    return classes.filter(
      item =>
        item.className.toLowerCase().includes(keyword) ||
        item.classCode.toLowerCase().includes(keyword),
    );
  }, [classes, search]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, item) => sum + (item.studentCount ?? 0), 0),
    [classes],
  );

  const handleCopy = useCallback(async (code: string) => {
    try {
      await Clipboard.setString(code);
      Alert.alert('Đã copy', 'Mã lớp đã được sao chép.');
    } catch (err) {
      console.error('[TeacherClasses] copy error', err);
      Alert.alert('Lỗi', 'Không thể copy mã lớp.');
    }
  }, []);

  const renderItem = ({ item }: { item: TeacherClassSummary }) => (
    <Pressable
      style={styles.classCard}
      onPress={() =>
        navigation.navigate('TeacherClassDetail', {
          classCode: item.classCode,
          classId: item.id,
        })
      }>
      <View style={styles.classCardHeader}>
        <View>
          <Text style={styles.classCode}>{item.classCode}</Text>
          <Text style={styles.className}>{item.className}</Text>
        </View>
        <View style={styles.classStudentBadge}>
          <Text style={styles.classStudentText}>{item.studentCount} HV</Text>
        </View>
      </View>
      <View style={styles.classMetaRow}>
        <Text style={styles.classMetaLabel}>Ngày tạo</Text>
        <Text style={styles.classMetaValue}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('vi-VN')
            : 'Chưa cập nhật'}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={styles.outlinedButton}
          onPress={() => handleCopy(item.classCode)}>
          <Text style={styles.outlinedButtonText}>Copy mã lớp</Text>
        </Pressable>
        <Pressable
          style={styles.primaryGhost}
          onPress={() =>
            navigation.navigate('TeacherClassDetail', {
              classCode: item.classCode,
              classId: item.id,
            })
          }>
          <Text style={styles.primaryGhostText}>Quản lý</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lớp học của bạn</Text>
          <Text style={styles.subtitle}>
            Quản lý danh sách lớp, học viên và nội dung ngay tại đây.
          </Text>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('TeacherCreateClass')}>
          <Text style={styles.primaryButtonText}>+ Tạo lớp mới</Text>
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng số lớp</Text>
          <Text style={styles.statValue}>{classes.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Học viên</Text>
          <Text style={styles.statValue}>{totalStudents}</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="Tìm theo tên hoặc mã lớp"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        <Pressable
          style={styles.refreshButton}
          onPress={loadClasses}
          disabled={loading}>
          <Text style={styles.refreshText}>Làm mới</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#4f46e5" />
          <Text style={styles.centerText}>Đang tải danh sách lớp...</Text>
        </View>
      ) : error ? (
        <Pressable style={styles.errorBox} onPress={loadClasses}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retryText}>Chạm để thử lại</Text>
        </Pressable>
      ) : (
        <FlatList
          data={filteredClasses}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadClasses();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.centerText}>
                Chưa có lớp nào. Hãy tạo lớp đầu tiên!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  searchRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    color: '#0f172a',
  },
  refreshButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  refreshText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  centerBox: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  centerText: {
    color: '#475569',
  },
  errorBox: {
    marginTop: 24,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  retryText: {
    marginTop: 4,
    color: '#b91c1c',
  },
  listContent: {
    paddingVertical: 20,
    gap: 16,
  },
  classCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  classStudentText: {
    color: '#15803d',
    fontWeight: '700',
  },
  classMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  classMetaLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  classMetaValue: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  outlinedButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlinedButtonText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  primaryGhost: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    paddingVertical: 10,
  },
  primaryGhostText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TeacherClassesScreen;



import Clipboard from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TeacherClassService } from '../../../services/teacherClass';
import { TeacherClassSummary } from '../../../types/teacher';
import { RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateClass'>;

const CreateClassScreen = ({ navigation }: Props) => {
  const [className, setClassName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdClass, setCreatedClass] = useState<TeacherClassSummary | null>(
    null,
  );

  const handleSubmit = async () => {
    if (!className.trim()) {
      setError('Tên lớp là bắt buộc.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const result = await TeacherClassService.createClass(className.trim());
      setCreatedClass(result);
    } catch (err) {
      console.error('[CreateClass] submit error', err);
      setError('Không thể tạo lớp. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdClass?.classCode) {
      return;
    }
    try {
      await Clipboard.setString(createdClass.classCode);
      Alert.alert('Đã copy', 'Mã lớp đã được sao chép.');
    } catch (err) {
      console.error('[CreateClass] copy error', err);
      Alert.alert('Lỗi', 'Không thể copy mã lớp.');
    }
  };

  const resetForm = () => {
    setClassName('');
    setCreatedClass(null);
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tạo lớp học mới</Text>
        <Text style={styles.subtitle}>
          Đặt tên lớp để hệ thống sinh mã tự động và chia sẻ với học viên.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Thông tin lớp học</Text>
          <Text style={styles.sectionHint}>
            Điền tên lớp để khởi tạo không gian quản lý học viên, bài đăng và đề
            thi.
          </Text>

          <Text style={styles.inputLabel}>Tên lớp *</Text>
          <TextInput
            placeholder="Ví dụ: Lớp Toán 10A"
            placeholderTextColor="#94a3b8"
            value={className}
            onChangeText={setClassName}
            style={styles.textInput}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.primaryButton, submitting && styles.disabled]}
              onPress={handleSubmit}
              disabled={submitting}>
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Đang tạo...' : 'Tạo lớp'}
              </Text>
            </Pressable>
            {createdClass && (
              <Pressable style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Tạo lớp khác</Text>
              </Pressable>
            )}
          </View>
        </View>

        {createdClass && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Tạo lớp thành công!</Text>
            <Text style={styles.successHint}>
              Chia sẻ mã lớp bên dưới với học viên hoặc quản lý ngay.
            </Text>
            <View style={styles.successGrid}>
              <View style={styles.successField}>
                <Text style={styles.successLabel}>Tên lớp</Text>
                <Text style={styles.successValue}>
                  {createdClass.className}
                </Text>
              </View>
              <View style={styles.successField}>
                <Text style={styles.successLabel}>Mã lớp</Text>
                <Text style={styles.successValue}>
                  {createdClass.classCode}
                </Text>
                <Pressable style={styles.copyButton} onPress={handleCopyCode}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </Pressable>
              </View>
              <View style={styles.successField}>
                <Text style={styles.successLabel}>ID</Text>
                <Text style={styles.successValue}>{createdClass.id}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.primaryButton}
                onPress={() =>
              navigation.replace('TeacherClassDetail', {
                classCode: createdClass.classCode,
                classId: createdClass.id,
              })
                }>
                <Text style={styles.primaryButtonText}>Quản lý lớp</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('TeacherClasses')}>
                <Text style={styles.secondaryButtonText}>
                  Trở về danh sách
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#475569',
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionHint: {
    color: '#64748b',
  },
  inputLabel: {
    marginTop: 6,
    color: '#0f172a',
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0f172a',
  },
  errorText: {
    color: '#b91c1c',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#4338ca',
    fontWeight: '600',
  },
  successCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ecfdf5',
    padding: 18,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#065f46',
  },
  successHint: {
    color: '#047857',
  },
  successGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  successField: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  successLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  successValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  copyButton: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: 6,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#4338ca',
    fontWeight: '600',
  },
});

export default CreateClassScreen;



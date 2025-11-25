import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AuthTextInput from '../components/AuthTextInput';
import { AuthService } from '../services/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ các trường bắt buộc.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu', 'Xác nhận mật khẩu không khớp.');
      return;
    }
    try {
      setLoading(true);
      console.log('[RegisterScreen] Attempting register', { fullName, email, role });
      await AuthService.register(
        fullName.trim(),
        email.trim(),
        password,
        role,
        confirmPassword,
      );
      Alert.alert('Thành công', 'Tạo tài khoản thành công!\nVui lòng đăng nhập.');
      console.log('[RegisterScreen] Register success');
      navigation.replace('Login');
    } catch (error: any) {
      console.log('[RegisterScreen] Register error', error?.response || error);
      Alert.alert(
        'Đăng ký thất bại',
        error?.response?.data?.message || 'Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <View style={styles.form}>
        <AuthTextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Họ và tên"
        />
        <AuthTextInput
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onChangeText={setEmail}
          placeholder="Email"
        />
        <AuthTextInput
          value={password}
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          onChangeText={setPassword}
          placeholder="Mật khẩu"
        />
        <AuthTextInput
          value={confirmPassword}
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          onChangeText={setConfirmPassword}
          placeholder="Xác nhận mật khẩu"
        />
        <Text style={styles.sectionLabel}>Vai trò</Text>
        <View style={styles.roleRow}>
          {(['student', 'teacher'] as const).map(option => (
            <Pressable
              key={option}
              style={[
                styles.roleChip,
                role === option && styles.roleChipActive,
              ]}
              onPress={() => setRole(option)}>
              <Text
                style={[
                  styles.roleChipText,
                  role === option && styles.roleChipTextActive,
                ]}>
                {option === 'student' ? 'Học viên' : 'Giáo viên'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          disabled={loading}
          onPress={handleRegister}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Đăng ký</Text>
          )}
        </Pressable>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập ←</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f9',
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
  },
  form: {
    marginTop: 30,
  },
  primaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 15,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  roleChipTextActive: {
    color: '#1d4ed8',
  },
});

export default RegisterScreen;


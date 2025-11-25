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
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      console.log('[LoginScreen] Attempting login', { email });
      await AuthService.login(email.trim(), password);
      console.log('[LoginScreen] Login success');
      navigation.replace('TeacherDashboard');
    } catch (error: any) {
      console.log('[LoginScreen] Login error', error?.response || error);
      Alert.alert(
        'Đăng nhập thất bại',
        error?.response?.data?.message || 'Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>
          Sử dụng tài khoản đã đăng ký trên hệ thống
        </Text>
      </View>
      <View style={styles.form}>
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
        <Pressable
          disabled={loading}
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          )}
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Chưa có tài khoản? Đăng ký ngay →
          </Text>
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
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 16,
    color: '#5a5a5f',
    marginTop: 8,
  },
  form: {
    marginTop: 40,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
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
});

export default LoginScreen;


import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/api';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [userName, setUserName] = useState<string>('Người dùng');

  useEffect(() => {
    const loadUser = async () => {
      const cached = await AsyncStorage.getItem('user_full_name');
      if (cached) {
        setUserName(cached);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xin chào, {userName}</Text>
      <Text style={styles.subtitle}>Bạn đã đăng nhập thành công.</Text>
      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5a5a5f',
    marginBottom: 24,
  },
  logoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: '#ef4444',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;


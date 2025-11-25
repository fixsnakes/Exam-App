import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherClassesScreen from '../screens/teacher/classes/TeacherClassesScreen';
import CreateClassScreen from '../screens/teacher/classes/CreateClassScreen';
import ClassDetailScreen from '../screens/teacher/classes/ClassDetailScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="TeacherDashboard"
          component={TeacherDashboardScreen}
        />
        <Stack.Screen name="TeacherClasses" component={TeacherClassesScreen} />
        <Stack.Screen
          name="TeacherCreateClass"
          component={CreateClassScreen}
        />
        <Stack.Screen
          name="TeacherClassDetail"
          component={ClassDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;


import { forwardRef } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from 'react-native';

interface AuthTextInputProps extends TextInputProps {
  containerStyle?: StyleProp<TextStyle>;
}

const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(
  ({ containerStyle, ...props }, ref) => {
    return (
      <View style={[styles.container, containerStyle]}>
        <TextInput
          ref={ref}
          placeholderTextColor="#7a7a7a"
          style={styles.input}
          {...props}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});

export default AuthTextInput;


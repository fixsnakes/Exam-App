import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  style?: ViewStyle;
  icon?: ReactNode;
};

const StatCard = ({
  label,
  value,
  subtitle,
  accentColor = '#6366f1',
  style,
  icon,
}: StatCardProps) => {
  return (
    <View style={[styles.card, style, { borderColor: accentColor + '33' }]}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '22' }]}>
          {icon ?? <Text style={[styles.fallbackIcon, { color: accentColor }]}>★</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default StatCard;



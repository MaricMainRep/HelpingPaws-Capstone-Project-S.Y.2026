import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { config } from '../../lib/config';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'primary':
        return config.colors.primary;
      case 'secondary':
        return config.colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return config.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666';
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#fff';
      case 'outline':
      case 'ghost':
        return config.colors.primary;
      default:
        return '#fff';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: config.colors.primary,
  },
  ghost: {
    paddingVertical: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
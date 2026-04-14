import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

const RoadPulseTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF8C00', // Neon Orange
    background: '#0D0D0D', // Darker background
    card: '#1A1A1A',
    text: '#FFFFFF',
    border: '#333333',
    notification: '#FF4500',
  },
};

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const inAuthGroup = segments[0] === '(auth)' as string;

        if (!token && !inAuthGroup) {
          // Redirect to login if not authenticated and not in auth screens
          router.replace('/(auth)/login' as any);
        } else if (token && inAuthGroup) {
          // Redirect to home if authenticated and trying to access auth screens
          router.replace('/(tabs)' as any);
        }
      } catch (e) {
        console.error('Auth check error', e);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [segments]);

  if (!isReady) return null;

  return (
    <ThemeProvider value={RoadPulseTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Road Block' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

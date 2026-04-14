import "../global.css";
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="register" />
            <Stack.Screen name="home" />
            <Stack.Screen name="citizen_dashboard" />
            <Stack.Screen name="officer_dashboard" />
            <Stack.Screen name="assigned_tasks" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="notifications" />
        </Stack>
    );
}

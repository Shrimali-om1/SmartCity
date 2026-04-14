import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ShieldCheck, Phone, User as UserIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import API from '../services/api';

export default function OfficerCompleteProfile() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCompleteProfile = async () => {
        if (!phone.trim() || phone.length < 10) {
            Alert.alert('Validation Error', 'Please enter a valid phone number (min 10 digits).');
            return;
        }

        setLoading(true);
        try {
            await API.put('/auth/complete-profile', {
                phone,
                profilePhoto: '' // Placeholder for future photo upload
            });

            Alert.alert('Success', 'Profile setup complete! Welcome to the Command Center.');
            router.replace('/officer_dashboard');
        } catch (error) {
            console.error('Error completing profile:', error);
            Alert.alert('Submission Failed', 'Could not save your profile details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 justify-center">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-6"
            >
                <View className="items-center mb-10">
                    <View className="bg-blue-100 p-5 rounded-full mb-6 relative">
                        <ShieldCheck color="#1e3a8a" size={56} strokeWidth={1.5} />
                        <View className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-50" />
                    </View>
                    <Text className="text-3xl font-black text-slate-900 text-center mb-2">Welcome, Officer!</Text>
                    <Text className="text-slate-500 text-center text-base px-4">
                        Your account has been pre-configured by the City Admin. Please provide a contact number to activate your dashboard.
                    </Text>
                </View>

                <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
                    <Text className="text-slate-700 font-bold mb-2">Official Contact Number <Text className="text-red-500">*</Text></Text>
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-2">
                        <Phone color="#94a3b8" size={20} className="mr-3" />
                        <TextInput
                            className="flex-1 text-slate-800 text-base"
                            placeholder="e.g. +91 9876543210"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>
                    <Text className="text-xs text-slate-400 mb-6">Required for citizen updates and emergency contractor dispatches.</Text>

                    <TouchableOpacity
                        className={`py-4 rounded-xl items-center shadow-sm ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                        onPress={handleCompleteProfile}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Activate Dispatch Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="items-center">
                    <Text className="text-slate-400 text-xs">Department & Zone assigned internally.</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

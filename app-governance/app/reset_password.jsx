import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { ArrowLeft, RefreshCw, Eye, EyeOff, CheckCircle2, ShieldCheck, Info } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import API from '../services/api';

export default function ResetPasswordScreen() {
    const { email } = useLocalSearchParams();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!token || !newPassword) {
            Alert.alert('Validation Error', 'Please enter both the reset code and a new password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/reset-password', { email, token, newPassword });
            Alert.alert('Success', 'Your password has been reset successfully. You can now login.', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error('Reset password error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Invalid or expired token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Password validation logic for visual cues
    const hasLength = newPassword.length >= 8;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
                {/* Header Navbar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
                        <ArrowLeft color="#1e3a8a" size={24} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e3a8a' }}>CityGuard</Text>
                </View>

                {/* Title & Icon Header */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{ backgroundColor: '#e2e8f0', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        <RefreshCw color="#1e3a8a" size={28} />
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 12 }}>Auth: Confirm Reset</Text>
                    <Text style={{ color: '#475569', textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                        Verify your identity and secure your digital sovereign account with a new password.
                    </Text>
                </View>

                {/* Big Auth Form Card */}
                <View style={{ borderWidth: 2, borderColor: '#0f172a', borderRadius: 32, padding: 24, backgroundColor: '#ffffff', marginBottom: 32 }}>
                    
                    {/* Verification Code Box (pseudo 6-OTP) */}
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 }}>Verification Code</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, position: 'relative' }}>
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <View key={idx} style={{ width: 44, height: 56, borderWidth: 2, borderColor: '#0f172a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
                                    {token[idx] ? token[idx] : '•'}
                                </Text>
                            </View>
                        ))}
                        {/* Hidden input to securely capture the OTP */}
                        <TextInput
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
                            value={token}
                            onChangeText={(t) => setToken(t.replace(/[^0-9]/g, '').slice(0, 6))}
                            keyboardType="numeric"
                            caretHidden={true}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500' }}>Code expires in 04:59</Text>
                        <TouchableOpacity><Text style={{ color: '#1e3a8a', fontSize: 12, fontWeight: '800' }}>Resend Code</Text></TouchableOpacity>
                    </View>

                    {/* New Password Input */}
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 }}>New Password</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 12, borderWidth: 2, borderColor: '#0f172a', paddingHorizontal: 16, height: 56, marginBottom: 20 }}>
                        <TextInput
                            style={{ flex: 1, color: '#0f172a', fontSize: 20, fontWeight: '900', letterSpacing: showPassword ? 0 : 5 }}
                            placeholder="••••••••••••"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff color="#475569" size={24} /> : <Eye color="#475569" size={24} />}
                        </TouchableOpacity>
                    </View>

                    {/* Rules Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
                        <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}>
                            {hasLength ? <CheckCircle2 color="#f97316" size={16} style={{ marginRight: 8 }}/> : <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#cbd5e1', marginRight: 8 }}/>}
                            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>8+ Characters</Text>
                        </View>
                        <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}>
                            {hasSymbol ? <CheckCircle2 color="#f97316" size={16} style={{ marginRight: 8 }}/> : <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#cbd5e1', marginRight: 8 }}/>}
                            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>Special Symbol</Text>
                        </View>
                        <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}>
                            {hasNumber ? <CheckCircle2 color="#f97316" size={16} style={{ marginRight: 8 }}/> : <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#cbd5e1', marginRight: 8 }}/>}
                            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>One Number</Text>
                        </View>
                        <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}>
                            {hasUpperLower ? <CheckCircle2 color="#f97316" size={16} style={{ marginRight: 8 }}/> : <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#cbd5e1', marginRight: 8 }}/>}
                            <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>Upper & Lower</Text>
                        </View>
                    </View>

                    {/* Confirm Password Input */}
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 }}>Confirm New Password</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 12, borderWidth: 2, borderColor: '#0f172a', paddingHorizontal: 16, height: 56, marginBottom: 32 }}>
                        <TextInput
                            style={{ flex: 1, color: '#0f172a', fontSize: 20, fontWeight: '900', letterSpacing: showPassword ? 0 : 5 }}
                            placeholder="••••••••••••"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={{ backgroundColor: '#3b4b9e', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
                        onPress={handleResetPassword}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginRight: 8 }}>Update Password</Text>
                                <ShieldCheck color="white" size={20} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer Info Box */}
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Info color="#f97316" size={24} style={{ marginRight: 16, marginTop: 2 }} fill="#fed7aa" />
                    <Text style={{ flex: 1, color: '#475569', fontSize: 12, lineHeight: 18, fontWeight: '500' }}>
                        CityGuard uses 256-bit encryption for all identity transactions. Your new password must not have been used in the last 6 months.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

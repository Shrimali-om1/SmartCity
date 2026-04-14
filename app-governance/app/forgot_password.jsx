import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import API from '../services/api';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Validation Error', 'Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/forgot-password', { email });
            Alert.alert('Reset Code Sent', 'If an account with that email exists, we have sent a 6-digit reset code to it.');
            router.push(`/reset_password?email=${encodeURIComponent(email)}`);
        } catch (error) {
            console.error('Forgot password error:', error);
            Alert.alert('Error', 'Could not send reset code. Please try again or check if you registered with this email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f4f5f9' }}>
            {/* Top Background Gradient Replacement */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: '#2d3b8e' }} />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
                    {/* Header */}
                    <TouchableOpacity 
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff20', justifyContent: 'center', alignItems: 'center', marginBottom: 40 }} 
                        onPress={() => router.back()}
                    >
                        <ArrowLeft color="#ffffff" size={24} />
                    </TouchableOpacity>

                    {/* Title Area */}
                    <View style={{ marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', marginRight: 8 }} />
                            <Text style={{ color: '#fcd34d', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Secure Identity</Text>
                        </View>
                        <Text style={{ fontSize: 36, fontWeight: '900', color: '#ffffff', marginBottom: 12 }}>Reset Password</Text>
                        <Text style={{ color: '#bfdbfe', fontSize: 16, lineHeight: 24, fontWeight: '400', paddingRight: 20 }}>
                            Please enter your registered email to receive verification instructions.
                        </Text>
                    </View>

                    {/* Main Interaction Card */}
                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginBottom: 30 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 }}>Email Address</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, height: 60, marginBottom: 8 }}>
                            <Mail color="#64748b" size={20} style={{ marginRight: 12 }} />
                            <TextInput
                                style={{ flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' }}
                                placeholder="name@cityguard.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                        <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 32 }}>We'll never share your email with anyone else.</Text>

                        <TouchableOpacity
                            style={{ backgroundColor: '#2d3b8e', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32, shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
                            onPress={handleResetPassword}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginRight: 8 }}>Send Reset Code</Text>
                                    <ArrowRight color="white" size={20} />
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={{ textAlign: 'center', color: '#475569', fontSize: 14, marginBottom: 24 }}>
                            Having trouble? <Text style={{ color: '#1e3a8a', fontWeight: '800' }}>Contact Support</Text>
                        </Text>

                        {/* Divider */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9' }} />
                            <Text style={{ marginHorizontal: 12, color: '#94a3b8', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>DIGITAL SOVEREIGN</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9' }} />
                        </View>
                    </View>

                    {/* Bottom System Graphic Mock */}
                    <View style={{ backgroundColor: '#e2e8f0', height: 200, borderRadius: 32, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        {/* Concentric circles to mock the image */}
                        <View style={{ width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: '#cbd5e1', position: 'absolute', opacity: 0.5 }} />
                        <View style={{ width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: '#cbd5e1', position: 'absolute', opacity: 0.7 }} />
                        <View style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#cad5e2', position: 'absolute', opacity: 0.9 }} />
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#cbd5e1', position: 'absolute', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }} />
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', position: 'absolute' }} />
                        
                        {/* Status Pill */}
                        <View style={{ backgroundColor: '#cbd5e190', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, position: 'absolute', bottom: 40 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', marginRight: 8 }} />
                            <Text style={{ color: '#1e293b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>SYSTEM STATUS: ACTIVE</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

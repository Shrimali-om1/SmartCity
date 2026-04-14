import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { Shield, Lock, Eye, EyeOff, ArrowRight, HelpCircle, ShieldCheck, User } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Validation Error', 'Please enter your Official ID/Email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await API.post('/auth/login', { email, password });

            const { token } = response.data;
            if (token) {
                await AsyncStorage.setItem('token', token);

                // Fetch profile to check role
                const profileResponse = await API.get('/auth/profile');
                const userRole = profileResponse.data.role;

                if (userRole === 'citizen') {
                    router.replace('/citizen_dashboard');
                } else if (userRole === 'officer') {
                    if (profileResponse.data.isProfileComplete) {
                        router.replace('/officer_dashboard');
                    } else {
                        router.replace('/officer_complete_profile');
                    }
                } else if (userRole === 'contractor') {
                    // department can be a String OR Array depending on seed
                    const rawDept = profileResponse.data.department;
                    const dept = (Array.isArray(rawDept)
                        ? rawDept[0]
                        : rawDept || 'Water'
                    ).toLowerCase().trim();
                    // Persist so resource_form & other screens can route back correctly
                    await AsyncStorage.setItem('contractor_dept', dept);
                    if (dept === 'waste') router.replace('/contractor_waste');
                    else if (dept === 'road' || dept === 'roads') router.replace('/contractor_road');
                    else if (dept === 'electricity') router.replace('/contractor_electricity');
                    else router.replace('/contractor_dashboard'); // Water (default)
                } else if (userRole === 'commissioner') {
                    router.replace('/commissioner_dashboard');
                } else {
                    router.replace('/home'); // Fallback to generic dashboard
                }
            } else {
                Alert.alert('Error', 'Invalid login response');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', 'Incorrect ID/Email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f4f8' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
                    
                    {/* Header Details */}
                    <View style={{ alignItems: 'center', marginBottom: 32 }}>
                        <View style={{ backgroundColor: '#2d3b8e', width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}>
                            <Shield color="white" size={40} strokeWidth={2.5} />
                        </View>
                        <Text style={{ fontSize: 32, fontWeight: '800', color: '#091557' }}>CityGuard</Text>
                        <Text style={{ color: '#475569', marginTop: 6, textAlign: 'center', fontSize: 16, fontWeight: '500' }}>
                            Ahmedabad Digital Sovereign Portal
                        </Text>
                    </View>

                    {/* Main Card */}
                    <View style={{ backgroundColor: 'white', borderRadius: 32, padding: 24, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}>
                        
                        <View style={{ gap: 24 }}>
                            {/* Email / ID Input */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 10 }}>Official ID or Phone</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                                    <User color="#64748b" size={20} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' }}
                                        placeholder="Enter Official ID or Email"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>Secure Password</Text>
                                    <TouchableOpacity onPress={() => router.push('/forgot_password')}>
                                        <Text style={{ color: '#2d3b8e', fontWeight: '800', fontSize: 13 }}>Forgot?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 12, paddingHorizontal: 16, height: 56 }}>
                                    <Lock color="#64748b" size={20} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' }}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                        {showPassword ? <EyeOff color="#64748b" size={20} /> : <Eye color="#64748b" size={20} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={{ backgroundColor: '#2d3b8e', height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginRight: 8 }}>
                                            Access Portal
                                        </Text>
                                        <ArrowRight color="white" size={20} />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Guest View Button */}
                            <TouchableOpacity
                                style={{ backgroundColor: '#ffffff', height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#2d3b8e' }}
                                onPress={() => router.push('/public_view')}
                                activeOpacity={0.8}
                            >
                                <Text style={{ color: '#2d3b8e', fontWeight: 'bold', fontSize: 18, marginRight: 8 }}>
                                    Continue as Guest
                                </Text>
                                <User color="#2d3b8e" size={20} />
                            </TouchableOpacity>

                            {/* Security Verification Active Footer */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 24 }}>
                                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#fed7aa', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316' }} />
                                </View>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 1 }}>LIVE SECURITY VERIFICATION ACTIVE</Text>
                            </View>
                        </View>
                    </View>

                    {/* Create Account Link */}
                    <TouchableOpacity 
                        style={{ marginTop: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}
                        onPress={() => router.push('/register')}
                        activeOpacity={0.7}
                    >
                        <Text style={{ color: '#475569', fontSize: 15 }}>New to the CityGuard? </Text>
                        <Text style={{ color: '#2d3b8e', fontWeight: '800', fontSize: 15 }}>Create Citizen Account</Text>
                    </TouchableOpacity>

                    {/* Bottom Footer */}
                    <View style={{ marginTop: 48, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <HelpCircle color="#64748b" size={16} style={{ marginRight: 6 }} />
                                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '700' }}>Technical Support</Text>
                            </TouchableOpacity>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' }} />
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ShieldCheck color="#64748b" size={16} style={{ marginRight: 6 }} />
                                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '700' }}>Data Privacy</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            Official Government of Gujarat Digital Initiative
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Shield, Mail, Lock, User, Eye, EyeOff, Info, Globe } from 'lucide-react-native';
import { router } from 'expo-router';
import API from '../services/api';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Validation Error', 'Please fill in all fields.');
            return;
        }

        if (!agreed) {
            Alert.alert('Required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/register', {
                name,
                email,
                password,
                role: 'citizen',
                appType: 'governance'
            });

            Alert.alert('Success', 'Registration successful! You can now log in.', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24 }}>
                    
                    {/* Main White Canvas */}
                    <View style={{ backgroundColor: 'white', borderRadius: 40, paddingHorizontal: 24, paddingVertical: 48, shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 5, flex: 1 }}>
                        
                        {/* Header Details */}
                        <View style={{ alignItems: 'center', marginBottom: 40 }}>
                            <View style={{ backgroundColor: '#e0e7ff', width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                                <Shield color="#091557" size={32} strokeWidth={2.5} />
                            </View>
                            <Text style={{ fontSize: 30, fontWeight: '800', color: '#091557' }}>Join CityGuard</Text>
                            <Text style={{ color: '#475569', marginTop: 8, textAlign: 'center', fontSize: 16, fontWeight: '500' }}>
                                Create an account for the official portal.
                            </Text>
                        </View>

                        <View style={{ gap: 24 }}>
                            {/* Name Input */}
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Full Name</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 16, paddingHorizontal: 16, height: 56 }}>
                                    <User color="#64748b" size={20} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' }}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#9ca3af"
                                        autoCapitalize="words"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Email Address</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 16, paddingHorizontal: 16, height: 56 }}>
                                    <Mail color="#64748b" size={20} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' }}
                                        placeholder="Enter your email address"
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
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Password</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f9', borderRadius: 16, paddingHorizontal: 16, height: 56 }}>
                                    <Lock color="#64748b" size={20} style={{ marginRight: 12 }} />
                                    <TextInput
                                        style={{ flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' }}
                                        placeholder="Create a password"
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

                            {/* Terms Checkbox */}
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingRight: 20 }} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
                                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: agreed ? '#2d3b8e' : '#cbd5e1', backgroundColor: agreed ? '#2d3b8e' : 'transparent', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                                    {agreed && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'white' }} />}
                                </View>
                                <Text style={{ color: '#475569', fontSize: 14, flex: 1, lineHeight: 20 }}>
                                    I agree to the <Text style={{ color: '#091557', fontWeight: '700' }}>Terms of Service</Text> and <Text style={{ color: '#091557', fontWeight: '700' }}>Privacy Policy</Text>.
                                </Text>
                            </TouchableOpacity>

                            {/* Register Button */}
                            <TouchableOpacity
                                style={{ backgroundColor: '#2d3b8e', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                                        Create Account
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <TouchableOpacity 
                                style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}
                                onPress={() => router.replace('/')}
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: '#475569', fontSize: 15 }}>Already have an account? </Text>
                                <Text style={{ color: '#091557', fontWeight: '800', fontSize: 15 }}>Login</Text>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />

                            {/* Admin Contact Info */}
                            <View style={{ backgroundColor: '#fff7ed', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ backgroundColor: '#fdba74', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Info color="white" size={14} strokeWidth={3} />
                                </View>
                                <Text style={{ color: '#431407', fontSize: 13, flex: 1, lineHeight: 20, fontWeight: '500' }}>
                                    Officer/Contractor? Contact System Admin for credentials. Registration is for Citizens only.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Bottom Footer Area (Outside the White Card) */}
                    <View style={{ marginTop: 32, alignItems: 'center', paddingBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 }}>
                            <TouchableOpacity><Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>Help Center</Text></TouchableOpacity>
                            <TouchableOpacity><Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>Sitemap</Text></TouchableOpacity>
                            <TouchableOpacity><Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>Accessibility</Text></TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Globe color="#64748b" size={14} style={{ marginRight: 6 }} />
                                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>English</Text>
                            </View>
                            <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>© 2024 City of Ahmedabad</Text>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

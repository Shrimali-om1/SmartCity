import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Alert,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, CheckCircle, Package, Clock, Send } from 'lucide-react-native';
import { Image } from 'expo-image';
import API from '../services/api';

export default function ResourceFormScreen() {
    const { reportId, afterImage } = useLocalSearchParams();
    const [materialsUsed, setMaterialsUsed] = useState('');
    const [laborHours, setLaborHours]       = useState('');
    const [submitting, setSubmitting]       = useState(false);

    const handleSubmit = async () => {
        if (!materialsUsed.trim() || !laborHours.trim()) {
            Alert.alert('Required Fields', 'Please fill in both materials used and labor hours.');
            return;
        }
        if (isNaN(laborHours) || Number(laborHours) <= 0) {
            Alert.alert('Invalid Input', 'Labor hours must be a valid positive number.');
            return;
        }

        setSubmitting(true);
        try {
            await API.post(`/reports/complete/${reportId}`, {
                materialsUsed,
                laborHours: Number(laborHours),
                afterImage,
            });
            const goBack = async () => {
                try {
                    const rawDept = await AsyncStorage.getItem('contractor_dept');
                    const dept = (rawDept || 'water').toLowerCase().trim();
                    if (dept === 'waste') router.replace('/contractor_waste');
                    else if (dept === 'road' || dept === 'roads') router.replace('/contractor_road');
                    else if (dept === 'electricity') router.replace('/contractor_electricity');
                    else router.replace('/contractor_dashboard');
                } catch {
                    router.replace('/contractor_dashboard');
                }
            };
            Alert.alert(
                '✅ Task Submitted',
                'Your work has been submitted for Officer review. Great job!',
                [{ text: 'Back to Dashboard', onPress: goBack }]
            );
        } catch (error) {
            console.error('Submit Error:', error);
            Alert.alert('Submission Failed', error.response?.data?.message || 'Failed to submit. Please try again.');
            setSubmitting(false);
        }
    };

    const isReady = materialsUsed.trim() && laborHours.trim() && !submitting;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#f8fafc' }}
        >
            <StatusBar barStyle="light-content" backgroundColor="#1e2d6b" />

            {/* ── Header ─────────────────────────────────────────── */}
            <View style={{
                backgroundColor: '#1e2d6b',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 56,
                paddingBottom: 24,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10, marginRight: 14 }}
                >
                    <ArrowLeft color="white" size={20} />
                </TouchableOpacity>
                <View>
                    <Text style={{ color: '#93c5fd', fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                        Step 2 of 2
                    </Text>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>Resource Tracking</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Photo verification badge ──────────────────── */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#f0fdf4', borderRadius: 20,
                    padding: 16, marginBottom: 20,
                    borderWidth: 1, borderColor: '#bbf7d0',
                    gap: 12,
                }}>
                    <View style={{ backgroundColor: '#dcfce7', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                        <CheckCircle size={22} color="#16a34a" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#15803d', fontSize: 13, fontWeight: '900' }}>Photo Verified ✓</Text>
                        <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '500', marginTop: 1 }}>
                            AI validation passed. Fill in resource details below.
                        </Text>
                    </View>
                    {afterImage && (
                        <Image
                            source={{ uri: afterImage }}
                            style={{ width: 48, height: 48, borderRadius: 12 }}
                            contentFit="cover"
                        />
                    )}
                </View>

                {/* ── Info text ──────────────────────────────────── */}
                <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', lineHeight: 20, marginBottom: 24 }}>
                    Document the resources used to complete this task. This data is used for municipal records and contractor payment processing.
                </Text>

                {/* ── Materials Input ────────────────────────────── */}
                <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                        <Package color="#2d3b8e" size={15} />
                        <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '800' }}>Materials Used</Text>
                    </View>
                    <TextInput
                        value={materialsUsed}
                        onChangeText={setMaterialsUsed}
                        placeholder="e.g., 2 bags of cement, 1 pipe joint kit, sealant tape..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: materialsUsed ? '#2d3b8e' : '#e2e8f0',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            color: '#0f172a',
                            fontSize: 14,
                            fontWeight: '500',
                            textAlignVertical: 'top',
                            minHeight: 100,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            elevation: 1,
                        }}
                    />
                </View>

                {/* ── Labor Hours Input ─────────────────────────── */}
                <View style={{ marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                        <Clock color="#2d3b8e" size={15} />
                        <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '800' }}>Total Labor Hours</Text>
                    </View>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: 'white', borderRadius: 18,
                        borderWidth: 1, borderColor: laborHours ? '#2d3b8e' : '#e2e8f0',
                        paddingHorizontal: 16, paddingVertical: 14,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
                    }}>
                        <TextInput
                            value={laborHours}
                            onChangeText={setLaborHours}
                            placeholder="e.g., 3.5"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            style={{ flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '500' }}
                        />
                        <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700' }}>hrs</Text>
                    </View>
                </View>

                {/* ── Submit Button ─────────────────────────────── */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!isReady}
                    style={{
                        backgroundColor: isReady ? '#2d3b8e' : '#cbd5e1',
                        borderRadius: 999,
                        paddingVertical: 18,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 10,
                        shadowColor: '#2d3b8e',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: isReady ? 0.3 : 0,
                        shadowRadius: 12,
                        elevation: isReady ? 6 : 0,
                    }}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Submit for Review</Text>
                            <Send color="white" size={18} />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

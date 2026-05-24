import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, StatusBar, TextInput } from 'react-native';
import { LogOut, Award, Settings, ChevronRight, Lock, Camera, User as NameIcon } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import API from '../services/api';

const DEPT_COLORS = {
    water:       { accent: '#2d3b8e', light: '#dbeafe', bg: '#f0f4ff' },
    waste:       { accent: '#14532d', light: '#d1fae5', bg: '#f0fdf4' },
    road:        { accent: '#78350f', light: '#fef3c7', bg: '#fffbeb' },
    electricity: { accent: '#1e3a5f', light: '#dbeafe', bg: '#eff6ff' },
};

export default function ContractorProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dept, setDept] = useState('water');
    const [showSettings, setShowSettings] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = async () => {
        try {
            const [profileRes, storedDept] = await Promise.all([
                API.get('/auth/profile'),
                AsyncStorage.getItem('contractor_dept'),
            ]);
            setProfile(profileRes.data);
            setDept((storedDept || 'water').toLowerCase());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/');
    };

    const handleBack = () => {
        // Navigate back to the correct contractor dashboard
        if (dept === 'waste') router.replace('/contractor_waste');
        else if (dept === 'road' || dept === 'roads') router.replace('/contractor_road');
        else if (dept === 'electricity') router.replace('/contractor_electricity');
        else router.replace('/contractor_dashboard');
    };

    const handleEditProfilePic = async () => {
        try {
            const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!granted) { Alert.alert('Permission Error', 'Gallery access is required!'); return; }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true, aspect: [1, 1], quality: 0.5,
            });

            if (!result.canceled) {
                setIsUpdating(true);
                const localUri = result.assets[0].uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image';
                const formData = new FormData();
                formData.append('image', { uri: localUri, name: filename, type });
                const uploadRes = await API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                await API.put('/auth/complete-profile', { profilePhoto: uploadRes.data.secure_url });
                await fetchData();
                Alert.alert('Success', 'Profile picture updated!');
            }
        } catch (e) { Alert.alert('Error', 'Failed to update profile picture.'); }
        finally { setIsUpdating(false); }
    };

    const handleNameChange = async () => {
        if (!newName.trim()) return;
        try {
            setIsUpdating(true);
            await API.put('/auth/complete-profile', { name: newName });
            setNewName('');
            await fetchData();
            Alert.alert('Success', 'Name updated!');
        } catch (e) { Alert.alert('Error', 'Failed to update name.'); }
        finally { setIsUpdating(false); }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword) { Alert.alert('Error', 'Please fill in both password fields.'); return; }
        try {
            setIsUpdating(true);
            await API.put('/auth/update-password', { currentPassword, newPassword });
            setCurrentPassword(''); setNewPassword('');
            Alert.alert('Success', 'Password updated!');
        } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not update password.'); }
        finally { setIsUpdating(false); }
    };

    const colors = DEPT_COLORS[dept] || DEPT_COLORS.water;
    const avatarUrl = profile?.profilePhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Contractor')}&background=2d3b8e&color=fff`;

    if (loading) return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
            <ActivityIndicator size="large" color={colors.accent} />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar barStyle="light-content" backgroundColor={colors.accent} />

            {/* Header */}
            <View style={{
                backgroundColor: colors.accent,
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 56,
                paddingBottom: 60, paddingHorizontal: 24,
                borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={handleBack}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' }}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>My Profile</Text>
                    <TouchableOpacity onPress={handleLogout}>
                        <LogOut color="rgba(255,255,255,0.7)" size={20} />
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleEditProfilePic} activeOpacity={0.85}>
                        <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                            <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        </View>
                        <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fbbf24', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.accent }}>
                            <Camera color="white" size={13} />
                        </View>
                    </TouchableOpacity>

                    <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', marginTop: 12 }}>{profile?.name || 'Contractor'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500', marginTop: 2 }}>{profile?.email}</Text>

                    <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                        <Award color="#fbbf24" size={14} style={{ marginRight: 6 }} />
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            {dept.toUpperCase()} DEPARTMENT
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 20 }}>

                {/* Stats Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <Text style={{ color: colors.accent, fontSize: 26, fontWeight: '900' }}>—</Text>
                        <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' }}>TASKS{'\n'}ASSIGNED</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <Text style={{ color: colors.accent, fontSize: 26, fontWeight: '900' }}>—</Text>
                        <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' }}>TASKS{'\n'}COMPLETED</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                        <Text style={{ color: '#f97316', fontSize: 26, fontWeight: '900' }}>9.2★</Text>
                        <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' }}>RATINGS</Text>
                    </View>
                </View>

                {/* Account Settings */}
                <TouchableOpacity
                    style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: showSettings ? 0 : 16 }}
                    onPress={() => setShowSettings(!showSettings)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Settings color="#475569" size={20} style={{ marginRight: 12 }} />
                        <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 15 }}>Account Settings</Text>
                    </View>
                    <ChevronRight color="#475569" size={20} style={{ transform: [{ rotate: showSettings ? '90deg' : '0deg' }] }} />
                </TouchableOpacity>

                {showSettings && (
                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 16, marginTop: 4 }}>

                        {/* Profile picture */}
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingVertical: 14, marginBottom: 20 }}
                            onPress={handleEditProfilePic}
                            disabled={isUpdating}
                        >
                            <Camera color={colors.accent} size={18} style={{ marginRight: 8 }} />
                            <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 13 }}>Change Profile Picture</Text>
                        </TouchableOpacity>

                        {/* Name */}
                        <Text style={{ color: '#0f172a', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Display Name</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 }}>
                            <NameIcon color="#94a3b8" size={18} style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '500' }}
                                placeholder={profile?.name || 'Enter new name'}
                                placeholderTextColor="#94a3b8"
                                value={newName}
                                onChangeText={setNewName}
                            />
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: colors.light, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 20 }}
                            onPress={handleNameChange}
                            disabled={isUpdating || !newName.trim()}
                        >
                            <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 13 }}>Update Name</Text>
                        </TouchableOpacity>

                        <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 20 }} />

                        {/* Password */}
                        <Text style={{ color: '#0f172a', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Change Password</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 }}>
                            <Lock color="#94a3b8" size={18} style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '500' }}
                                placeholder="Current password"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }}>
                            <Lock color="#94a3b8" size={18} style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '500' }}
                                placeholder="New password"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: isUpdating ? '#94a3b8' : colors.accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                            onPress={handlePasswordChange}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Update Password</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Logout */}
                <TouchableOpacity
                    style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' }}
                    onPress={handleLogout}
                >
                    <LogOut color="#dc2626" size={20} style={{ marginRight: 12 }} />
                    <Text style={{ color: '#dc2626', fontWeight: '900', fontSize: 15 }}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

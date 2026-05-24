import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Alert } from 'react-native';
import { User, LogOut, Shield, ShieldAlert, Award, Camera, MapPin, Bell, AlertTriangle, ChevronRight, LayoutGrid, ClipboardList, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import API from '../services/api';

export default function OfficerProfile() {
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Toggles
    const [locationTracking, setLocationTracking] = useState(true);
    const [highPriorityAlerts, setHighPriorityAlerts] = useState(true);
    const [bodyCamSync, setBodyCamSync] = useState(false);
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const fetchStats = async () => {
        try {
            const [statsRes, profileRes] = await Promise.all([
                API.get('/reports/officer-stats'),
                API.get('/auth/profile')
            ]);
            setStats(statsRes.data);
            setProfile(profileRes.data);
        } catch (error) {
            console.error('Error fetching officer details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/');
    };

    const handleEmergencyAlert = () => {
        Alert.alert(
            "Emergency Active", 
            "Emergency protocols activated. Connecting to precinct dispatch...",
            [{ text: "OK", style: "default" }]
        );
    };

    const handleProtocolGuide = () => {
        Alert.alert(
            "Level 1 Protocol Guide",
            "1. Assess the situation and ensure personal safety.\n2. Dispatch immediate backup if weapons are involved.\n3. Secure the perimeter.\n4. Log all actions in the incident report.",
            [{ text: "Understood", style: "default" }]
        );
    };

    const handleEditProfile = async () => {
        try {
            // Ask for permission first
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                alert("Permission to access gallery is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setUpdatingProfile(true);
                const localUri = result.assets[0].uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                const formData = new FormData();
                formData.append('image', {
                    uri: localUri,
                    name: filename,
                    type,
                });

                // Upload Image
                const uploadRes = await API.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                const imageUrl = uploadRes.data.secure_url;

                // Update Profile
                await API.put('/auth/complete-profile', {
                    phone: profile?.phone || '',
                    profilePhoto: imageUrl
                });

                // Refresh Data
                await fetchStats();
                setUpdatingProfile(false);
                alert("Profile picture updated successfully!");
            }
        } catch (error) {
            console.error("Error updating profile picture", error);
            alert("Failed to update profile picture.");
            setUpdatingProfile(false);
        }
    };

    const avatarUrl = profile?.profilePhoto || 'https://ui-avatars.com/api/?name=Officer+Vance&background=1e3a8a&color=fff';

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{ backgroundColor: '#f8fafc', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                {/* Header */}
                <View className="flex-row justify-between items-center px-5 py-4">
                    <View className="flex-row items-center">
                        <Image source={{ uri: avatarUrl }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }} contentFit="cover" />
                        <Text className="text-[#0f172a] text-xl font-[900]">CityGuard</Text>
                    </View>
                    <View className="flex-row gap-4 items-center">
                        <Bell color="#091557" size={20} />
                        <TouchableOpacity onPress={handleLogout}>
                            <LogOut color="#ef4444" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
                
                {/* Profile Hero Card */}
                <View className="bg-[#2d3b8e] w-full rounded-[40px] items-center p-6 shadow-xl shadow-[#2d3b8e]/30 mt-4 mb-6">
                    <View className="w-24 h-24 rounded-full border-4 border-[#3b4b9e] shadow-lg mb-4 bg-slate-200 justify-center items-center overflow-hidden">
                        {profile?.profilePhoto ? (
                            <Image source={{ uri: profile.profilePhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                            <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Marcus Vance')}&background=fff&color=2d3b8e&size=256` }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        )}
                    </View>
                    
                    <View className="flex-row gap-2 mb-4">
                        <View className="bg-[#4c5cd4] px-4 py-1.5 rounded-full border border-[#5c6dec]">
                            <Text className="text-white text-[9px] font-[900] tracking-widest uppercase">ZONE OFFICER</Text>
                        </View>
                        <View className="bg-[#ffedd5] px-4 py-1.5 rounded-full flex-row items-center">
                            <Award color="#b45309" size={12} className="mr-1" />
                            <Text className="text-[#b45309] text-[9px] font-[900] tracking-widest uppercase">TOP PERFORMER</Text>
                        </View>
                    </View>

                    <Text className="text-white text-3xl font-[900] mb-2 text-center leading-tight tracking-tight">
                        Officer {profile?.name || 'Marcus Vance'}
                    </Text>
                    
                    <Text className="text-blue-200 text-sm font-medium mb-6 text-center leading-relaxed">
                        Precinct {profile?.zone || '07'} • Central{'\n'}Ahmedabad District
                    </Text>

                    <TouchableOpacity 
                        className={`border rounded-full px-8 py-2.5 ${updatingProfile ? 'bg-white/40 border-white/40' : 'bg-white/20 border-white/20'}`}
                        onPress={handleEditProfile}
                        disabled={updatingProfile}
                    >
                        {updatingProfile ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text className="text-white font-[900] text-[11px] tracking-widest uppercase">Edit Profile</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2d3b8e" className="my-8" />
                ) : (
                    <>
                        {/* KPI Cards */}
                        <View className="mb-6">
                            {/* Efficiency */}
                            <View className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-100 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-[10px] font-[900] text-slate-500 uppercase tracking-widest mb-2">Efficiency</Text>
                                    <Text className="text-[#091557] text-4xl font-[900]">{stats?.efficiencyRating || 98}%</Text>
                                </View>
                                <View className="items-end gap-3 py-1">
                                    <View className="bg-[#ffedd5] px-2 py-1 rounded-md">
                                        <Text className="text-[#ea580c] text-[10px] font-bold">+2.4%</Text>
                                    </View>
                                    <View className="bg-[#e0e7ff] w-12 h-12 rounded-full justify-center items-center">
                                        <View className="bg-[#091557] w-4 h-4 rounded-full flex-row items-center justify-center">
                                            <View className="w-1.5 h-1.5 bg-white rounded-sm rotate-45" />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Tasks Completed */}
                            <View className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-100 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-[10px] font-[900] text-slate-500 uppercase tracking-widest mb-2">Tasks Completed</Text>
                                    <Text className="text-[#091557] text-4xl font-[900]">{stats?.totalResolved || 142}</Text>
                                </View>
                                <View className="items-end gap-3 py-1">
                                    <View className="flex-row">
                                        <View className="w-6 h-6 bg-slate-200 rounded-full border-2 border-white -mr-2" />
                                        <View className="w-6 h-6 bg-slate-300 rounded-full border-2 border-white" />
                                    </View>
                                    <View className="bg-[#f3e8ff] w-12 h-12 rounded-full justify-center items-center">
                                        <CheckCircle color="#7e22ce" size={20} />
                                    </View>
                                </View>
                            </View>

                            {/* Active Tasks */}
                            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-[10px] font-[900] text-slate-500 uppercase tracking-widest mb-2">Active Tasks</Text>
                                    <Text className="text-[#091557] text-4xl font-[900]">{stats?.currentlyAssigned || 5}</Text>
                                </View>
                                <View className="items-end gap-3 py-1">
                                    <View className="w-2 h-2 bg-[#450a0a] rounded-full mr-2" />
                                    <View className="bg-[#ffedd5] w-12 h-12 rounded-full justify-center items-center">
                                        <ClipboardList color="#ea580c" size={20} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Service Availability Settings */}
                <View className="flex-row items-center mb-6 px-2">
                    <Text className="text-[#0f172a] text-lg font-[900] mr-4">Service Availability</Text>
                    <View className="flex-1 h-[1px] bg-[#e2e8f0]" />
                </View>

                <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-8">
                    {/* Toggle 1 */}
                    <View className="flex-row justify-between items-center py-3 border-b border-slate-50 mb-1">
                        <View className="flex-row items-center flex-1 pr-4">
                            <MapPin color="#64748b" size={16} className="mr-3" />
                            <View className="flex-1">
                                <Text className="text-[#0f172a] text-[13px] font-[900] mb-1">Real-time Location Tracking</Text>
                                <Text className="text-[#64748b] text-[10px] font-medium leading-tight">Allow control center to see your current beat</Text>
                            </View>
                        </View>
                        <Switch value={locationTracking} onValueChange={setLocationTracking} trackColor={{ false: '#e2e8f0', true: '#091557' }} thumbColor={'#ffffff'} />
                    </View>

                    {/* Toggle 2 */}
                    <View className="flex-row justify-between items-center py-3 border-b border-slate-50 mb-1">
                        <View className="flex-row items-center flex-1 pr-4">
                            <Bell color="#64748b" size={16} className="mr-3" />
                            <View className="flex-1">
                                <Text className="text-[#0f172a] text-[13px] font-[900] mb-1">High-Priority Alerts</Text>
                                <Text className="text-[#64748b] text-[10px] font-medium leading-tight">Bypass silent mode for Level 1 incidents</Text>
                            </View>
                        </View>
                        <Switch value={highPriorityAlerts} onValueChange={setHighPriorityAlerts} trackColor={{ false: '#e2e8f0', true: '#091557' }} thumbColor={'#ffffff'} />
                    </View>

                    {/* Toggle 3 */}
                    <View className="flex-row justify-between items-center py-3">
                        <View className="flex-row items-center flex-1 pr-4">
                            <Camera color="#64748b" size={16} className="mr-3" />
                            <View className="flex-1">
                                <Text className="text-[#0f172a] text-[13px] font-[900] mb-1">Body-Cam Auto-Sync</Text>
                                <Text className="text-[#64748b] text-[10px] font-medium leading-tight">Upload footage directly to secure server</Text>
                            </View>
                        </View>
                        <Switch value={bodyCamSync} onValueChange={setBodyCamSync} trackColor={{ false: '#e2e8f0', true: '#091557' }} thumbColor={'#ffffff'} />
                    </View>
                </View>

                {/* Emergency Hub */}
                <View className="bg-[#fff7ed] w-full rounded-[40px] p-6 mb-6 border border-[#ffedd5]">
                    <View className="flex-row items-center mb-4 mt-2">
                        <View className="w-8 h-8 rounded-full bg-[#f97316] items-center justify-center mr-3 shadow-sm">
                            <AlertTriangle color="white" size={16} />
                        </View>
                        <Text className="text-[#431407] text-xl font-[900]">Emergency Hub</Text>
                    </View>
                    
                    <Text className="text-[#7c2d12] text-[13px] leading-relaxed mb-6 font-medium pr-4">
                        Immediate connection to precinct dispatch and backup units. Use only for life-threatening situations.
                    </Text>

                    <TouchableOpacity 
                        className="bg-[#f97316] rounded-full py-4 flex-row items-center justify-center shadow-md shadow-orange-500/30 mb-3"
                        onPress={handleEmergencyAlert}
                    >
                        <ShieldAlert color="white" size={16} className="mr-2" />
                        <Text className="text-white font-[900] text-[12px] tracking-widest uppercase">Emergency Contact</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        className="bg-white rounded-full py-4 justify-center items-center shadow-sm border border-[#ffedd5]"
                        onPress={handleProtocolGuide}
                    >
                        <Text className="text-[#431407] font-[900] text-[11px] tracking-widest uppercase">Protocol Guide</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Nav Tab */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/officer_dashboard')}>
                    <LayoutGrid color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>DASHBOARD</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/assigned_tasks')}>
                    <ClipboardList color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>TASKS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/review_tasks')}>
                    <CheckCircle color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>REVIEW</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#3730a3', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
                    <User color="white" size={20} />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>PROFILE</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

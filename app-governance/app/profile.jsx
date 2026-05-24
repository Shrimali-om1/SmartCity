import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, StatusBar, TextInput } from 'react-native';
import { Menu, Bell, LogOut, Award, LayoutGrid, FileText, User as UserIcon, Settings, ChevronRight, Rocket, Lightbulb, Trash2, Lock, Camera, User as NameIcon } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import API from '../services/api';

export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [newName, setNewName] = useState('');

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please enter both current and new passwords.');
            return;
        }

        try {
            setIsUpdating(true);
            await API.put('/auth/update-password', {
                currentPassword,
                newPassword
            });
            Alert.alert('Success', 'Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setShowSettings(false);
        } catch (error) {
            console.error('Error updating password:', error);
            Alert.alert('Error', error.response?.data?.message || 'Could not update password.');
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const [profileRes, historyRes] = await Promise.all([
                API.get('/auth/profile'),
                API.get('/reports/my-history')
            ]);
            setUserData(profileRes.data);
            setHistory(historyRes.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not fetch profile data.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/');
    };

    const handleEditProfilePic = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Error", "Gallery access is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setIsUpdating(true);
                const localUri = result.assets[0].uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                const formData = new FormData();
                formData.append('image', { uri: localUri, name: filename, type });

                const uploadRes = await API.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                await API.put('/auth/complete-profile', { profilePhoto: uploadRes.data.secure_url });
                await fetchProfile();
                Alert.alert("Success", "Profile picture updated!");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update profile picture.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleNameChange = async () => {
        if (!newName.trim()) return;
        try {
            setIsUpdating(true);
            await API.put('/auth/complete-profile', { name: newName });
            Alert.alert("Success", "Name updated successfully!");
            setNewName('');
            await fetchProfile();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update name.");
        } finally {
            setIsUpdating(false);
        }
    };

    const points = userData?.points || 2450;
    const role = userData?.role || 'user';
    const isHero = points >= 1000 || history.length > 5;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#f8fafc] justify-center items-center">
                <ActivityIndicator size="large" color="#1e3a8a" />
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Dark Blue Header Section */}
                <View className="bg-[#2d3b8e] pb-16 px-6 items-center w-full relative" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60 }}>
                    
                    <View style={{ position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 }}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Menu color="white" size={24} />
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>CityGuard</Text>
                        <TouchableOpacity>
                            <Bell color="white" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View className="relative mt-8">
                        <View className="w-24 h-24 bg-white rounded-full items-center justify-center border-4 border-white/20 shadow-2xl overflow-hidden">
                            <Image 
                                source={{ uri: userData?.profilePhoto || `https://ui-avatars.com/api/?name=${userData?.name || 'Arjun+Mehta'}&background=fcd34d` }} 
                                style={{ width: '100%', height: '100%' }} 
                            />
                        </View>
                        <View className="absolute bottom-0 right-0 bg-[#fbbf24] w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                             <Text className="text-white text-[10px] font-bold">✓</Text>
                        </View>
                    </View>

                    <Text className="text-white text-2xl font-[900] mt-4">{userData?.name || 'Arjun Mehta'}</Text>
                    <Text className="text-blue-200 font-medium text-sm mt-1">{userData?.email || 'Ahmedabad, Gujarat'}</Text>

                    <View className="bg-white/20 border border-white/30 rounded-full px-5 py-2 mt-4 flex-row items-center">
                        <Award color="#fcd34d" size={16} className="mr-2" />
                        <Text className="font-bold text-white uppercase tracking-wider text-[10px]">
                            {isHero ? 'GOLD CITIZEN' : 'VERIFIED CITIZEN'}
                        </Text>
                    </View>
                </View>

                {/* Overlapping Stats */}
                <View className="flex-row justify-between px-6 -mt-10 mb-4 gap-4">
                    <View className="flex-1 bg-white rounded-[32px] py-6 px-4 shadow-sm border border-slate-100 items-center">
                        <Text className="text-[#ea580c] text-3xl font-[900]">{points.toLocaleString()}</Text>
                        <Text className="text-[9px] text-[#0f172a] font-bold uppercase tracking-widest mt-1">CITIZEN POINTS</Text>
                    </View>
                    <View className="flex-1 bg-white rounded-[32px] py-6 px-4 shadow-sm border border-slate-100 items-center">
                        <Text className="text-[#091557] text-3xl font-[900]">{history.length || 48}</Text>
                        <Text className="text-[9px] text-[#0f172a] font-bold uppercase tracking-widest mt-1">TOTAL REPORTS</Text>
                    </View>
                </View>

                {/* Helpfulness Score */}
                <View className="mx-6 bg-white rounded-[32px] px-6 py-5 shadow-sm border border-slate-100 mb-8">
                     <Text className="text-[#091557] text-4xl font-[900] mb-1">9.4 <Text className="text-[#ea580c] text-2xl">★</Text></Text>
                     <Text className="text-[9px] text-[#0f172a] font-bold uppercase tracking-widest">HELPFULNESS SCORE</Text>
                </View>

                <View className="px-6 mb-6 flex-row justify-between items-center">
                     <View>
                         <Text className="text-[#0f172a] text-xl font-[900] mb-1">Recent Activity</Text>
                         <Text className="text-[#475569] text-xs font-medium">Tracking your civic contributions</Text>
                     </View>
                     <TouchableOpacity>
                         <Text className="text-[#091557] font-[900] text-sm">View All</Text>
                     </TouchableOpacity>
                </View>

                {/* Recent Reports History */}
                <View className="px-6 mb-8">
                     {history.length === 0 ? (
                         <View className="bg-white rounded-[32px] p-6 items-center border border-slate-100 shadow-sm">
                             <Text className="text-slate-500 font-medium">No active or past reports found.</Text>
                         </View>
                     ) : (
                         history.map(item => {
                              let bg = 'bg-[#f1f5f9]'; let text = 'text-[#64748b]'; 
                              const stat = item.status?.toLowerCase();
                              if(stat === 'resolved' || stat === 'closed') { bg = 'bg-[#d1fae5]'; text = 'text-[#059669]'; }
                              else if (stat === 'in_progress' || stat === 'assigned_to_contractor' || stat === 'assigned') { bg = 'bg-[#ffedd5]'; text = 'text-[#b45309]'; }

                              let IconComp = Rocket;
                              let iconBg = 'bg-[#e0e7ff]'; let iconCol = '#3730a3';
                              if(item.category?.toLowerCase() === 'waste' || item.category?.toLowerCase() === 'garbage') { IconComp = Trash2; iconBg='bg-[#e2e8f0]'; iconCol='#475569'; }
                              if(item.category?.toLowerCase() === 'electricity' || item.category?.toLowerCase() === 'lighting') { IconComp = Lightbulb; iconBg='bg-[#e0e7ff]'; iconCol='#3730a3'; }

                              return (
                                  <View key={item._id} className="bg-white rounded-[32px] p-4 mb-4 shadow-sm border border-slate-100 flex-row items-center">
                                       <View className={`${iconBg} w-12 h-12 rounded-full items-center justify-center mr-4`}>
                                            <IconComp color={iconCol} size={20} />
                                       </View>
                                       <View className="flex-1 pr-2">
                                            <Text className="text-[#0f172a] font-[900] text-sm mb-1">{item.title}</Text>
                                            <Text className="text-[#64748b] text-[10px] font-medium">Submitted on {new Date(item.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}</Text>
                                       </View>
                                       <View className={`${bg} px-3 py-1.5 rounded-full`}>
                                            <Text className={`${text} text-[8px] font-[900] uppercase tracking-wider`}>{item.status?.replace(/_/g, ' ')}</Text>
                                       </View>
                                  </View>
                              )
                         })
                     )}
                </View>

                {/* Account Settings */}
                <View className="px-6 mb-4">
                     <TouchableOpacity 
                         className="bg-[#f8fafc] rounded-[24px] p-5 flex-row justify-between items-center border border-slate-200"
                         onPress={() => setShowSettings(!showSettings)}
                     >
                          <View className="flex-row items-center">
                               <Settings color="#475569" size={20} className="mr-3" />
                               <Text className="text-[#0f172a] font-[900] text-base">Account Settings</Text>
                          </View>
                          <ChevronRight color="#475569" size={20} style={{ transform: [{ rotate: showSettings ? '90deg' : '0deg' }] }} />
                     </TouchableOpacity>

                     {showSettings && (
                         <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-3">
                             {/* Profile Picture Change */}
                             <TouchableOpacity
                                 className="flex-row items-center justify-center bg-[#f8fafc] border border-slate-200 rounded-[20px] px-4 py-4 mb-6"
                                 onPress={handleEditProfilePic}
                                 disabled={isUpdating}
                             >
                                 <Camera color="#091557" size={20} className="mr-3" />
                                 <Text className="text-[#091557] font-[900] text-sm">Change Profile Picture</Text>
                             </TouchableOpacity>

                             {/* Name Change */}
                             <View className="mb-6">
                                 <Text className="text-[#0f172a] text-xs font-[900] uppercase tracking-wider mb-2">Display Name</Text>
                                 <View className="flex-row items-center bg-[#f8fafc] border border-slate-200 rounded-[20px] px-4 py-3 mb-3">
                                     <NameIcon color="#94a3b8" size={20} className="mr-3" />
                                     <TextInput
                                         className="flex-1 text-[#0f172a] font-medium text-sm"
                                         placeholder={userData?.name || "Enter new name"}
                                         placeholderTextColor="#94a3b8"
                                         value={newName}
                                         onChangeText={setNewName}
                                     />
                                 </View>
                                 <TouchableOpacity
                                     className={`py-3 rounded-[16px] items-center shadow-sm ${isUpdating ? 'bg-[#94a3b8]' : 'bg-[#e0e7ff]'}`}
                                     onPress={handleNameChange}
                                     disabled={isUpdating || !newName.trim()}
                                 >
                                     <Text className="text-[#091557] font-[900] text-sm">Update Name</Text>
                                 </TouchableOpacity>
                             </View>

                             <View className="h-[1px] bg-slate-100 mb-6" />

                             {/* Password Change */}
                             <View className="mb-4">
                                 <Text className="text-[#0f172a] text-xs font-[900] uppercase tracking-wider mb-2">Current Password</Text>
                                 <View className="flex-row items-center bg-[#f8fafc] border border-slate-200 rounded-[20px] px-4 py-3">
                                     <Lock color="#94a3b8" size={20} className="mr-3" />
                                     <TextInput
                                         className="flex-1 text-[#0f172a] font-medium text-sm"
                                         placeholder="Enter current password"
                                         placeholderTextColor="#94a3b8"
                                         secureTextEntry
                                         value={currentPassword}
                                         onChangeText={setCurrentPassword}
                                     />
                                 </View>
                             </View>

                             <View className="mb-6">
                                 <Text className="text-[#0f172a] text-xs font-[900] uppercase tracking-wider mb-2">New Password</Text>
                                 <View className="flex-row items-center bg-[#f8fafc] border border-slate-200 rounded-[20px] px-4 py-3">
                                     <Lock color="#94a3b8" size={20} className="mr-3" />
                                     <TextInput
                                         className="flex-1 text-[#0f172a] font-medium text-sm"
                                         placeholder="Enter new password"
                                         placeholderTextColor="#94a3b8"
                                         secureTextEntry
                                         value={newPassword}
                                         onChangeText={setNewPassword}
                                     />
                                 </View>
                             </View>

                             <TouchableOpacity
                                 className={`py-4 rounded-[20px] items-center shadow-sm ${isUpdating ? 'bg-[#94a3b8]' : 'bg-[#091557]'}`}
                                 onPress={handlePasswordChange}
                                 disabled={isUpdating}
                             >
                                 {isUpdating ? (
                                     <ActivityIndicator color="white" />
                                 ) : (
                                     <Text className="text-white font-[900] text-base">Update Password</Text>
                                 )}
                             </TouchableOpacity>
                         </View>
                     )}
                </View>

                {/* Logout */}
                <View className="px-6 mb-8">
                     <TouchableOpacity 
                          className="bg-[#f8fafc] rounded-[24px] p-5 flex-row items-center border border-slate-200"
                          onPress={handleLogout}
                     >
                          <LogOut color="#dc2626" size={20} className="mr-3" />
                          <Text className="text-[#dc2626] font-[900] text-base">Logout</Text>
                     </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/citizen_dashboard')}>
                    <LayoutGrid color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => {}}>
                    <FileText color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/notifications')}>
                    <Bell color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Alerts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#fed7aa', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                    <UserIcon color="#ea580c" size={20} />
                    <Text style={{ color: '#ea580c', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Menu, Bell, CheckCircle, Info, AlertTriangle, ArrowDown, Award, LayoutGrid, FileText, User as UserIcon } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            // Guard: don't attempt if there's no token stored
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                router.replace('/');
                return;
            }

            setLoading(true);
            const response = await API.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            // 401 is already handled by the API interceptor (clears token + redirects)
            // Just stop loading to avoid a stuck spinner
            if (error.response?.status !== 401) {
                console.error('Error fetching notifications:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();

            const markAsRead = async () => {
                const hasUnread = notifications.some(n => !n.isRead);
                if (hasUnread) {
                    try {
                        await API.put('/notifications/mark-all-read');
                    } catch (err) {
                        if (err.response?.status !== 401) {
                            console.error('Failed to mark all as read', err);
                        }
                    }
                }
            };

            if (notifications.length > 0) {
                markAsRead();
            }
        }, [notifications.length])
    );

    useEffect(() => {
        intervalRef.current = setInterval(async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                // Stop polling if user is no longer authenticated
                clearInterval(intervalRef.current);
                return;
            }
            fetchNotifications();
        }, 10000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const parseNotification = (notif) => {
        let title = 'System Update';
        let borderColor = 'border-l-[#3b82f6]';
        let iconBg = 'bg-[#e0e7ff]';
        let icon = <Info color="#3730a3" size={20} />;

        const msgLower = notif.message.toLowerCase();

        if (msgLower.includes('resolved') || msgLower.includes('fixed') || msgLower.includes('closed')) {
            title = 'Report Resolved';
            borderColor = 'border-l-[#10b981]';
            iconBg = 'bg-[#d1fae5]';
            icon = <CheckCircle color="#059669" size={20} />;
        } else if (msgLower.includes('assigned') || msgLower.includes('claimed') || msgLower.includes('review')) {
            title = 'Report Under Review';
            borderColor = 'border-l-[#3b82f6]';
            iconBg = 'bg-[#e0e7ff]';
            icon = <Info color="#3730a3" size={20} />;
        } else if (msgLower.includes('alert') || msgLower.includes('emergency') || msgLower.includes('water') || msgLower.includes('traffic')) {
            title = msgLower.includes('traffic') ? 'Traffic Alert' : msgLower.includes('water') ? 'Water Supply Update' : 'Emergency Alert';
            borderColor = 'border-l-[#f59e0b]';
            iconBg = 'bg-[#ffedd5]';
            icon = <AlertTriangle color="#ea580c" size={20} />;
        } else if (msgLower.includes('point') || msgLower.includes('earn') || msgLower.includes('hero')) {
            title = 'New Achievement';
            borderColor = 'border-l-[#10b981]';
            iconBg = 'bg-[#d1fae5]';
            icon = <Award color="#059669" size={20} />;
        }

        return { title, borderColor, iconBg, icon };
    };

    const timeAgo = (dateStr) => {
        const diff = new Date() - new Date(dateStr);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return 'Yesterday';
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{ backgroundColor: '#2d3b8e', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Menu color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Notifications</Text>
                    <TouchableOpacity>
                        <Bell color="white" size={24} />
                        <View style={{ position: 'absolute', top: 0, right: 2, backgroundColor: '#ef4444', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#2d3b8e' }} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                
                <View className="mb-6">
                    <Text className="text-3xl font-[900] text-[#0f172a] mb-2">Recent Activity</Text>
                    <Text className="text-[#475569] text-sm font-medium">Stay updated with your community contributions and alerts.</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#2d3b8e" className="mt-10" />
                ) : notifications.length === 0 ? (
                    <View className="items-center justify-center mt-10 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                        <View className="bg-slate-100 p-6 rounded-full mb-4">
                            <Bell color="#94a3b8" size={48} />
                        </View>
                        <Text className="text-xl font-[900] text-[#0f172a] mb-2">You're all caught up!</Text>
                        <Text className="text-[#475569] text-center font-medium">No new notifications right now. Check back later.</Text>
                    </View>
                ) : (
                    notifications.map((notif) => {
                        const details = parseNotification(notif);
                        return (
                            <View key={notif._id} className={`bg-white rounded-[24px] p-5 mb-4 shadow-sm border-l-[6px] ${details.borderColor}`}>
                                <View className="flex-row items-start">
                                    <View className={`${details.iconBg} w-12 h-12 rounded-full items-center justify-center mr-4`}>
                                        {details.icon}
                                    </View>
                                    <View className="flex-1 justify-center">
                                        <View className="flex-row justify-between items-start mb-1">
                                            <Text className="font-[900] text-[#0f172a] text-base" numberOfLines={1}>{details.title}</Text>
                                            <Text className="text-[9px] text-[#64748b] font-bold tracking-wider pt-1">{timeAgo(notif.createdAt)}</Text>
                                        </View>
                                        <Text className="text-[#475569] text-xs font-medium leading-relaxed mt-1 pr-2">{notif.message}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}

                {!loading && notifications.length > 0 && (
                     <View className="items-center justify-center mt-8 mb-4">
                          <View className="bg-[#94a3b8] rounded-xl p-3 mb-3 shadow-sm">
                               <ArrowDown color="white" size={28} />
                          </View>
                          <Text className="text-[#94a3b8] font-bold text-base">Older notifications are archived</Text>
                     </View>
                )}
            </ScrollView>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/citizen_dashboard')}>
                    <LayoutGrid color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
                    <FileText color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#fed7aa', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                    <Bell color="#ea580c" size={20} />
                    <Text style={{ color: '#ea580c', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Alerts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/profile')}>
                    <UserIcon color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { ArrowLeft, Bell, AlertTriangle, CheckCircle, Info, Mail, LayoutGrid, ClipboardList, CheckCircle as CheckCircleNav, User } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import API from '../services/api';

export default function OfficerNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await API.get('/notifications');
            // Sort to ensure descending order just in case
            const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(sorted);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();

            const markAsRead = async () => {
                try {
                    await API.put('/notifications/mark-all-read');
                } catch (err) {
                    console.error('Failed to mark all as read', err);
                }
            };
            markAsRead();
        }, [])
    );

    const getIconConfig = (type, message) => {
        const msgLower = message.toLowerCase();
        
        if (type === 'system_alert' || msgLower.includes('emergency') || msgLower.includes('breach') || msgLower.includes('anomaly') || msgLower.includes('surge')) {
            return {
                icon: <AlertTriangle color="#b91c1c" size={16} />,
                bg: 'bg-red-100',
                title: 'Priority Alert',
            };
        } else if (msgLower.includes('resolved') || msgLower.includes('completed') || msgLower.includes('success')) {
            return {
                icon: <CheckCircle color="#047857" size={16} />,
                bg: 'bg-emerald-100',
                title: 'Task Completed',
            };
        } else if (msgLower.includes('update') || msgLower.includes('deployed')) {
            return {
                icon: <Info color="#1d4ed8" size={16} />,
                bg: 'bg-blue-100',
                title: 'System Update',
            };
        } else {
            return {
                icon: <Mail color="#1d4ed8" size={16} />,
                bg: 'bg-blue-100',
                title: 'Dispatch Briefing',
            };
        }
    };

    // Helper functions for date grouping
    const isToday = (someDate) => {
        const today = new Date();
        return someDate.getDate() == today.getDate() &&
            someDate.getMonth() == today.getMonth() &&
            someDate.getFullYear() == today.getFullYear();
    };

    const isYesterday = (someDate) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return someDate.getDate() == yesterday.getDate() &&
            someDate.getMonth() == yesterday.getMonth() &&
            someDate.getFullYear() == yesterday.getFullYear();
    };

    const groupedNotifications = () => {
        const today = [];
        const yesterday = [];
        const older = [];

        notifications.forEach(notif => {
            const date = new Date(notif.createdAt);
            if (isToday(date)) today.push(notif);
            else if (isYesterday(date)) yesterday.push(notif);
            else older.push(notif);
        });

        return { today, yesterday, older };
    };

    const { today, yesterday, older } = groupedNotifications();

    const renderTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderNotificationGroup = (groupLabel, groupItems) => {
        if (groupItems.length === 0) return null;

        return (
            <View className="mb-6">
                <View className="flex-row items-center mb-6 pl-4 pr-6">
                    <Text className="text-[#94a3b8] text-xs font-[900] tracking-widest uppercase mr-4">{groupLabel}</Text>
                    <View className="flex-1 h-[1px] bg-[#f1f5f9]" />
                </View>

                {groupItems.map((notif, index) => {
                    const isLast = index === groupItems.length - 1;
                    const { icon, bg, title } = getIconConfig(notif.type, notif.message);
                    
                    return (
                        <View key={notif._id} className="flex-row px-4">
                            {/* Timeline Column */}
                            <View className="items-center mr-4 w-12">
                                <View className={`w-10 h-10 rounded-full items-center justify-center z-10 ${bg}`}>
                                    {icon}
                                </View>
                                {/* Vertical line connecting items */}
                                {!isLast && (
                                    <View className="w-[1px] flex-1 bg-[#f1f5f9] -my-1 z-0 absolute top-10 bottom-[-24px]" />
                                )}
                            </View>

                            {/* Content Column */}
                            <View className="flex-1 pb-8">
                                <View className="flex-row justify-between items-start mb-1.5">
                                    <Text className="text-[#0f172a] text-[15px] font-[900] flex-1 pr-2 leading-tight">
                                        {title}
                                    </Text>
                                    <Text className="text-[#64748b] text-[10px] font-bold mt-0.5">{renderTime(notif.createdAt)}</Text>
                                </View>
                                <Text className="text-[#475569] text-[13px] leading-relaxed mb-2 font-medium">
                                    {notif.message}
                                </Text>
                                
                                {/* Example of a custom link/action based on alert type */}
                                {notif.type === 'system_alert' && notif.message.toLowerCase().includes('breach') && (
                                    <TouchableOpacity>
                                        <Text className="text-[#091557] text-[11px] font-[900] tracking-wide">
                                            View Security Feed →
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{ backgroundColor: '#f8fafc', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                {/* Header */}
                <View className="flex-row justify-between items-center px-5 py-4">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3">
                            <ArrowLeft color="#0f172a" size={24} />
                        </TouchableOpacity>
                        <Text className="text-[#0f172a] text-xl font-[900]">CityGuard</Text>
                    </View>
                    <View>
                        <Bell color="#091557" size={20} />
                        {notifications.some(n => !n.isRead) && (
                            <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f8fafc]" />
                        )}
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-5 pt-2 pb-8">
                    <Text className="text-[#091557] text-3xl font-[900] mb-2 tracking-tight">Activity Feed</Text>
                    <Text className="text-[#475569] font-medium text-sm border-b border-[#f1f5f9] pb-6 mb-2">Real-time updates from your jurisdiction</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#091557" className="mt-8" />
                ) : notifications.length === 0 ? (
                    <View className="bg-white p-8 rounded-[32px] border border-slate-100 mx-5 items-center justify-center shadow-sm">
                        <Bell size={48} color="#cbd5e1" className="mb-4" />
                        <Text className="text-[#0f172a] text-lg font-[900]">No Activity Yet</Text>
                        <Text className="text-[#64748b] text-sm font-medium mt-1 text-center font-medium">Your sector is running smoothly.</Text>
                    </View>
                ) : (
                    <View className="bg-white mx-4 rounded-[40px] pt-6 pb-2 shadow-sm border border-[#f1f5f9]">
                        {renderNotificationGroup('Today', today)}
                        {renderNotificationGroup('Yesterday', yesterday)}
                        {renderNotificationGroup('Older', older)}
                    </View>
                )}
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
                    <CheckCircleNav color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>REVIEW</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/officer_profile')}>
                    <User color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>PROFILE</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

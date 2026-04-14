import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { Menu, Bell, Camera, Star, CheckCircle, MapPin, Clock, LayoutGrid, FileText, User as UserIcon, AlertTriangle, Image as ImageIcon, ArrowRight } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import ReportDetailModal from '../components/ReportDetailModal';

export default function CitizenDashboard() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({});
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);
    const [globalAlert, setGlobalAlert] = useState(null);
    const lastNotifId = useRef(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reportsRes, profileRes] = await Promise.all([
                API.get('/reports/my-reports'),
                API.get('/auth/profile')
            ]);
            setReports(reportsRes.data);
            setProfile(profileRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await API.get('/notifications');
            const unread = response.data.filter(n => !n.isRead);
            setUnreadCount(unread.length);

            const alertMsg = unread.find(n => n.type === 'system_alert' && n.message.includes('EMERGENCY ALERT'));
            setGlobalAlert(alertMsg ? alertMsg.message.replace('⚠️ EMERGENCY ALERT: ', '') : null);

            if (unread.length > 0) {
                const latest = unread[0];
                if (lastNotifId.current !== null && latest._id !== lastNotifId.current) {
                    Alert.alert('New Notification', latest.message);
                }
                lastNotifId.current = latest._id;
            } else {
                lastNotifId.current = null;
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }, [])
    );

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === 'resolved') return { text: '#059669', bg: '#d1fae5', dot: null };
        if (s === 'pending') return { text: '#d97706', bg: '#ffedd5', dot: '#d97706' };
        if (s === 'in-progress' || s === 'assigned') return { text: '#1e3a8a', bg: '#e0e7ff', dot: null };
        return { text: '#64748b', bg: '#f1f5f9', dot: null };
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <SafeAreaView style={{ backgroundColor: '#2d3b8e', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                {/* Global Alert */}
                {globalAlert && (
                    <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle color="white" size={20} style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, flex: 1 }} numberOfLines={2}>
                            EMERGENCY: {globalAlert}
                        </Text>
                    </View>
                )}
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
                    <TouchableOpacity>
                        <Menu color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>CityGuard</Text>
                    <TouchableOpacity onPress={() => router.push('/notifications')} style={{ padding: 4 }}>
                        <Bell color="white" size={24} />
                        {unreadCount > 0 && (
                            <View style={{ position: 'absolute', top: 0, right: 4, backgroundColor: '#ef4444', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#2d3b8e' }} />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Welcome Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                        <Text style={{ fontSize: 26, fontWeight: '900', color: '#091557', marginBottom: 4 }}>Good Afternoon, {profile.name?.split(' ')[0] || 'User'}</Text>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' }}>Amdavad is looking better today thanks to you.</Text>
                    </View>
                    <Image 
                        source={{ uri: profile.profilePhoto || 'https://ui-avatars.com/api/?name=' + (profile.name || 'User') + '&background=f59e0b&color=fff' }} 
                        style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fcd34d' }} 
                        contentFit="cover"
                    />
                </View>

                {/* Report Banner */}
                <View style={{ backgroundColor: '#3f4ea3', borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' }}>
                    <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginBottom: 8, width: '70%', lineHeight: 28 }}>Found something broken?</Text>
                    <Text style={{ color: '#c7d2fe', fontSize: 14, marginBottom: 20, width: '80%', lineHeight: 20 }}>Your reports help the municipal corporation fix issues faster.</Text>
                    
                    <TouchableOpacity 
                        style={{ backgroundColor: '#f59e0b', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                        onPress={() => router.push('/create_report')}
                    >
                        <Camera color="white" size={18} style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Report Issue</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Pills */}
                <View style={{ gap: 16, marginBottom: 32 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 }}>
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 1.5, marginBottom: 4 }}>YOUR POINTS</Text>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#091557' }}>{profile.points?.toLocaleString() || '0'}</Text>
                        </View>
                        <View style={{ backgroundColor: '#fed7aa', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
                            <Star color="#ea580c" size={20} fill="#ea580c" />
                        </View>
                    </View>

                    <View style={{ backgroundColor: 'white', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 }}>
                        <View>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 1.5, marginBottom: 4 }}>RESOLVED</Text>
                            <Text style={{ fontSize: 24, fontWeight: '900', color: '#091557' }}>{reports.filter(r => r.status?.toLowerCase() === 'resolved').length}</Text>
                        </View>
                        <View style={{ backgroundColor: '#e0e7ff', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}>
                            <CheckCircle color="#4f46e5" size={20} />
                        </View>
                    </View>
                </View>

                {/* Recent Reports Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a' }}>Recent Reports</Text>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => {}}>
                        <Text style={{ color: '#2d3b8e', fontSize: 13, fontWeight: '800', marginRight: 4 }}>View All</Text>
                        <ArrowRight color="#2d3b8e" size={14} />
                    </TouchableOpacity>
                </View>

                {/* Report List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#2d3b8e" style={{ marginTop: 20 }} />
                ) : reports.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No reports found.</Text>
                ) : (
                    reports.slice(0, 5).map(report => {
                        const style = getStatusStyle(report.status);
                        return (
                            <TouchableOpacity
                                key={report._id}
                                style={{ backgroundColor: 'white', borderRadius: 24, padding: 16, flexDirection: 'row', marginBottom: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 }}
                                onPress={() => {
                                    setSelectedReport(report);
                                    setModalVisible(true);
                                }}
                                activeOpacity={0.7}
                            >
                                {report.imageUrl ? (
                                    <Image source={{ uri: report.imageUrl }} style={{ width: 80, height: 80, borderRadius: 16 }} contentFit="cover" />
                                ) : (
                                    <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                                        <ImageIcon color="#94a3b8" size={24} />
                                    </View>
                                )}

                                <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                            <Text style={{ color: '#3730a3', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>{report.category || 'OTHER'}</Text>
                                        </View>
                                        <View style={{ backgroundColor: style.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                                            {style.dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: style.dot, marginRight: 4 }} />}
                                            <Text style={{ color: style.text, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' }}>{report.status}</Text>
                                        </View>
                                    </View>
                                    
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8, lineHeight: 20 }} numberOfLines={2}>
                                        {report.title}
                                    </Text>
                                    
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <MapPin color="#475569" size={12} style={{ marginRight: 4 }} />
                                            <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500' }} numberOfLines={2}>
                                                {report.location?.locality || 'Ahmedabad, GJ'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Clock color="#475569" size={12} style={{ marginRight: 4 }} />
                                            <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500' }}>
                                                {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <ReportDetailModal visible={modalVisible} onClose={() => setModalVisible(false)} report={selectedReport} />

            {/* Bottom Floating/Fixed Navbar */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#fed7aa', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                    <LayoutGrid color="#ea580c" size={20} />
                    <Text style={{ color: '#ea580c', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/citizen_reports')}>
                    <FileText color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/notifications')}>
                    <Bell color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Alerts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/profile')}>
                    <UserIcon color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

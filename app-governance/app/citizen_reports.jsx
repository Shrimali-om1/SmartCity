import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Bell, MapPin, Clock, LayoutGrid, FileText, User as UserIcon, Image as ImageIcon } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import API from '../services/api';
import ReportDetailModal from '../components/ReportDetailModal';

export default function CitizenReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const reportsRes = await API.get('/reports/my-reports');
            setReports(reportsRes.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === 'resolved' || s === 'closed') return { text: '#ffffff', bg: '#10b981', dot: null }; // Solid Green match
        if (s === 'pending') return { text: '#ea580c', bg: '#ffedd5', dot: '#ea580c' }; // Orange
        if (s === 'in-progress' || s === 'assigned') return { text: '#1e3a8a', bg: '#e0e7ff', dot: null }; // Light blue
        return { text: '#64748b', bg: '#f1f5f9', dot: null };
    };

    const getCategoryStyle = (category) => {
        return { text: '#3730a3', bg: '#e0e7ff' }; // Base purple/blue
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
        if (diff < 3600) return `${Math.floor(diff/60) || 1} mins ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)} hours ago`;
        return `${Math.floor(diff/86400)} days ago`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <SafeAreaView style={{ backgroundColor: '#f9fafb', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                {/* Header (optional if standard headers are disabled, the screenshot shows just cards on gray bg) */}
                <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                    <Text style={{ color: '#0f172a', fontSize: 24, fontWeight: '900' }}>My Reports</Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                ) : reports.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>You haven't submitted any reports yet.</Text>
                ) : (
                    reports.map(report => {
                        const sStyle = getStatusStyle(report.status);
                        const cStyle = getCategoryStyle(report.category);
                        return (
                            <TouchableOpacity
                                key={report._id}
                                style={{ backgroundColor: 'white', borderRadius: 24, padding: 16, flexDirection: 'row', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}
                                onPress={() => {
                                    setSelectedReport(report);
                                    setModalVisible(true);
                                }}
                                activeOpacity={0.8}
                            >
                                {/* Left Side Image Box */}
                                {report.imageUrl ? (
                                    <Image source={{ uri: report.imageUrl }} style={{ width: 100, height: 100, borderRadius: 16 }} contentFit="cover" />
                                ) : (
                                    <View style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                                        <ImageIcon color="#94a3b8" size={32} />
                                    </View>
                                )}

                                {/* Right Side Content */}
                                <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
                                    
                                    {/* Top Tags */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                        <View style={{ backgroundColor: cStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                            <Text style={{ color: cStyle.text, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{report.category || 'OTHER'}</Text>
                                        </View>
                                        <View style={{ backgroundColor: sStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                                            {sStyle.dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sStyle.dot, marginRight: 6 }} />}
                                            <Text style={{ color: sStyle.text, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' }}>{report.status}</Text>
                                        </View>
                                    </View>
                                    
                                    {/* Title */}
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16, lineHeight: 22 }} numberOfLines={3}>
                                        {report.title}
                                    </Text>
                                    
                                    {/* Footer Details */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <MapPin color="#475569" size={12} fill="#64748b" style={{ marginRight: 6 }} />
                                            <Text style={{ color: '#334155', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                                                {report.location?.locality || 'Ahmedabad, GJ'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                            <Clock color="#475569" size={12} fill="#64748b" style={{ marginRight: 6 }} />
                                            <Text style={{ color: '#334155', fontSize: 11, fontWeight: '600' }}>
                                                {formatTimeAgo(report.createdAt)}
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

            {/* Bottom Nav (Reports Tab Active) */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/citizen_dashboard')}>
                    <LayoutGrid color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Dashboard</Text>
                </TouchableOpacity>

                {/* Active Tab */}
                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#e0e7ff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 24 }}>
                    <FileText color="#3730a3" size={20} />
                    <Text style={{ color: '#3730a3', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/notifications')}>
                    <Bell color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Alerts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }} onPress={() => router.push('/profile')}>
                    <UserIcon color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

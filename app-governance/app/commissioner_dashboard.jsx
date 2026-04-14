import React, { useState, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, TextInput, StyleSheet } from 'react-native';
import { User, LogOut, Download, Map as MapIcon, BarChart3, TrendingUp, ShieldCheck, AlertTriangle, Bell, Send, CheckCircle2, ChevronRight, Activity, Zap, Play, Navigation, AlertCircle, Plus, Minus, LayoutGrid, CheckSquare, Settings } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import { PieChart, BarChart } from 'react-native-chart-kit';
import API from '../services/api';
import { generateAuditPDF } from '../utils/pdfGenerator';

const { width: screenWidth } = Dimensions.get("window");

export default function CommissionerDashboard() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [reports, setReports] = useState([]);
    const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);
    const mapRef = useRef(null);

    const activeTab = 'Dashboard';

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [profileRes, historyRes] = await Promise.all([
                API.get('/auth/profile'),
                API.get('/reports/all')
            ]);
            setProfile(profileRes.data);
            setReports(historyRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/');
    };

    const handleGenerateAudit = async () => {
        if (isGeneratingAudit) return;
        setIsGeneratingAudit(true);
        try {
            await generateAuditPDF(reports, 'All Zones');
        } catch (error) {
            console.error('Failed PDF:', error);
            alert('Failed to generate the Monthly Report.');
        } finally {
            setIsGeneratingAudit(false);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        setBroadcasting(true);
        try {
            await API.post('/notifications/broadcast', { message: broadcastMessage });
            alert("Emergency Push Notification sent!");
            setBroadcastMessage('');
        } catch (error) {
            console.error('Broadcast err:', error);
            alert("Failed to send broadcast.");
        } finally {
            setBroadcasting(false);
        }
    };

    const handleZoomIn = () => {
        if (mapRef.current) mapRef.current.animateToRegion({ latitude: 23.0225, longitude: 72.5714, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
    };
    const handleZoomOut = () => {
        if (mapRef.current) mapRef.current.animateToRegion({ latitude: 23.0225, longitude: 72.5714, latitudeDelta: 0.25, longitudeDelta: 0.25 }, 500);
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f5f9', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2d3b8e" />
            </SafeAreaView>
        );
    }

    const totalInput = reports.length || 20; // fallback matching design
    const resolvedCount = reports.filter(r => r.status === 'resolved' || r.status === 'closed').length || 9;

    const pieData = [
        { name: 'Road', count: 8, color: '#f87171', legendFontColor: '#475569', legendFontSize: 11 },
        { name: 'Electricity', count: 4, color: '#60a5fa', legendFontColor: '#475569', legendFontSize: 11 },
        { name: 'Waste', count: 5, color: '#fbbf24', legendFontColor: '#475569', legendFontSize: 11 },
        { name: 'Water', count: 2, color: '#34d399', legendFontColor: '#475569', legendFontSize: 11 },
        { name: 'Other', count: 1, color: '#c084fc', legendFontColor: '#475569', legendFontSize: 11 }
    ];

    const barData = {
        labels: ['North', 'South', 'East', 'West', 'Central', 'NW', 'SW'],
        datasets: [{ data: [12, 24, 18, 14, 30, 8, 22] }]
    };

    const heatmapPoints = reports.length > 0 ? reports.map(r => ({
        latitude: r.location?.latitude || 23.0225,
        longitude: r.location?.longitude || 72.5714,
        weight: (r.status === 'pending' || r.status === 'urgent') ? 100 : 10
    })) : [{ latitude: 23.0225, longitude: 72.5714, weight: 100 }];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={{ backgroundColor: '#2d3b8e', borderBottomLeftRadius: 36, borderBottomRightRadius: 36, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{ color: '#93c5fd', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Command Center</Text>
                        <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>Commissioner View</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#3b4b9e', padding: 12, borderRadius: 16, borderCurve: 'continuous' }}>
                        <LogOut color="#ffffff" size={20} />
                    </TouchableOpacity>
                </View>

                {/* Main Content Area */}
                <View style={{ paddingHorizontal: 24, marginTop: -20 }}>
                    {/* Top Stats Cards */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                        <View style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <View style={{ backgroundColor: '#eff6ff', width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                                    <BarChart3 color="#1e3a8a" size={20} />
                                </View>
                                <View style={{ backgroundColor: '#dcfce3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                                    <Text style={{ color: '#166534', fontSize: 10, fontWeight: '800' }}>+12%</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Total Input</Text>
                            <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '900' }}>{totalInput}</Text>
                        </View>

                        <View style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <View style={{ backgroundColor: '#f0fdf4', width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                                    <CheckCircle2 color="#16a34a" size={20} />
                                </View>
                                <View style={{ backgroundColor: '#dcfce3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                                    <Text style={{ color: '#166534', fontSize: 10, fontWeight: '800' }}>+5%</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Resolved</Text>
                            <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '900' }}>{resolvedCount}</Text>
                        </View>
                    </View>

                    {/* Download Report Button */}
                    <TouchableOpacity 
                        style={{ backgroundColor: '#3b4382', height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}
                        onPress={handleGenerateAudit}
                        disabled={isGeneratingAudit}
                    >
                        {isGeneratingAudit ? <ActivityIndicator color="white" /> : (
                            <>
                                <Download color="white" size={18} style={{ marginRight: 10 }} />
                                <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Download Monthly Report</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Emergency Hub */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <AlertTriangle color="#dc2626" size={20} fill="transparent" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '800' }}>Emergency Hub</Text>
                    </View>
                    <View style={{ backgroundColor: '#fff5f0', borderRadius: 24, padding: 20, marginBottom: 32 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <View style={{ backgroundColor: '#ef4444', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Bell color="white" size={18} />
                            </View>
                            <Text style={{ color: '#dc2626', fontSize: 15, fontWeight: '800', width: '60%' }}>Push Notification to Citizens</Text>
                        </View>
                        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, minHeight: 120 }}>
                            <TextInput
                                style={{ color: '#334155', fontSize: 14, minHeight: 80, textAlignVertical: 'top' }}
                                placeholder="Type disaster/emergency alert here..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                value={broadcastMessage}
                                onChangeText={setBroadcastMessage}
                            />
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: '#3b4382', height: 50, borderRadius: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                            onPress={handleBroadcast}
                            disabled={broadcasting}
                        >
                            {broadcasting ? <ActivityIndicator color="white" /> : (
                                <>
                                    <Send color="white" size={16} style={{ marginRight: 8 }} />
                                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Send Alert Now</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Zonal Heatmap */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <MapIcon color="#475569" size={20} style={{ marginRight: 8 }} />
                        <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '800' }}>Zonal Heatmap</Text>
                    </View>
                    <View style={{ height: 280, borderRadius: 24, overflow: 'hidden', marginBottom: 32, backgroundColor: '#e2e8f0' }}>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            initialRegion={{ latitude: 23.0225, longitude: 72.5714, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
                        >
                            <Heatmap points={heatmapPoints} radius={40} opacity={0.7} gradient={{ colors: ["#00000000", "#10b981", "#fbbf24", "#ef4444"], startPoints: [0, 0.25, 0.5, 1], colorMapSize: 256 }} />
                        </MapView>
                        {/* Overlay Pill */}
                        <View style={{ position: 'absolute', top: 16, left: 16, backgroundColor: '#ef444490', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#991b1b', marginRight: 6 }} />
                            <Text style={{ color: '#7f1d1d', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>HIGH SEVERITY HOTSPOTS</Text>
                        </View>
                        {/* Zoom Controls */}
                        <View style={{ position: 'absolute', bottom: 16, right: 16, gap: 8 }}>
                            <TouchableOpacity onPress={handleZoomIn} style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                                <Plus color="#334155" size={20} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleZoomOut} style={{ width: 40, height: 40, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                                <Minus color="#334155" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Analytics & Trends */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <Activity color="#475569" size={20} style={{ marginRight: 8 }} />
                        <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '800' }}>Analytics & Trends</Text>
                    </View>

                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                        <Text style={{ color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginBottom: 20 }}>COMPLAINTS BY CATEGORY</Text>
                        
                        {/* Custom Donut Chart Appearance */}
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <PieChart
                                data={pieData}
                                width={screenWidth - 80}
                                height={200}
                                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                                accessor={"count"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[0, 0]}
                                absolute
                                hasLegend={false}
                            />
                            {/* Inner Circle to simulate Donut */}
                            <View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 28, fontWeight: '900', color: '#0f172a' }}>{totalInput}</Text>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 1 }}>TOTAL</Text>
                            </View>
                        </View>

                        {/* Legend */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 24 }}>
                            {pieData.map((item, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', width: '40%' }}>
                                    <View style={{ backgroundColor: item.color, width: 8, height: 8, borderRadius: 4, marginRight: 8 }} />
                                    <Text style={{ color: '#475569', fontSize: 11, fontWeight: '600' }}>{item.count} {item.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                        <Text style={{ color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginBottom: 20 }}>AVG RESOLUTION TIME (HRS)</Text>
                        <BarChart
                            data={barData}
                            width={screenWidth - 80}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            fromZero
                            withInnerLines={true}
                            segments={3}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(148, 163, 184, ${opacity * 0.2})`, // very faint grid
                                labelColor: (opacity = 1) => `#475569`,
                                barPercentage: 0.5,
                                fillShadowGradientFrom: '#93c5fd',
                                fillShadowGradientTo: '#3b82f6',
                                fillShadowGradientFromOpacity: 1,
                                fillShadowGradientToOpacity: 1,
                            }}
                            showBarTops={false}
                            style={{
                                borderRadius: 16
                            }}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Simulated Bottom Navigation */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 24 }}>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#2d3b8e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <LayoutGrid color="white" size={20} style={{ marginBottom: 4 }} />
                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '800' }}>DASHBOARD</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}>
                    <Bell color="#94a3b8" size={24} style={{ marginBottom: 4 }} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700' }}>ALERTS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}>
                    <CheckSquare color="#94a3b8" size={24} style={{ marginBottom: 4 }} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700' }}>REVIEW</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, alignItems: 'center' }}>
                    <User color="#94a3b8" size={24} style={{ marginBottom: 4 }} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700' }}>PROFILE</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

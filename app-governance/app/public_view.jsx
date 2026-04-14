import React, { useState, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { ChevronRight, MapPin, Bell, CheckCircle2, User, ShieldCheck, Zap, Trash2, Wrench, Plus, Minus, Navigation, ArrowRight } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import API from '../services/api';

const { width } = Dimensions.get('window');

export default function PublicView() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const mapRef = useRef(null);

    const fetchPublicData = async () => {
        try {
            setLoading(true);
            const historyRes = await API.get('/reports/public/all-history');
            setReports(historyRes.data);
        } catch (error) {
            console.error('Error fetching public data:', error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPublicData();
        }, [])
    );

    const timeAgo = (dateString) => {
        if (!dateString) return 'recently';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 3600) {
            const m = Math.max(1, Math.floor(diffInSeconds / 60));
            return `${m} minute${m !== 1 ? 's' : ''} ago`;
        }
        if (diffInSeconds < 86400) {
            const h = Math.floor(diffInSeconds / 3600);
            return `${h} hour${h !== 1 ? 's' : ''} ago`;
        }
        return `Yesterday`;
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1e3a8a" />
            </SafeAreaView>
        );
    }

    const visibleReports = reports.filter(r => r.status === 'closed' || r.status === 'resolved');

    const getCategoryStyles = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('waste') || cat.includes('sanitation')) {
            return {
                bg: '#dcfce3', text: '#15803d', icon: <Trash2 size={12} color="#ffffff" />, markerBg: '#22c55e', label: 'SANITATION'
            };
        }
        if (cat.includes('electric') || cat.includes('light')) {
            return {
                bg: '#ffedd5', text: '#c2410c', icon: <Zap size={12} color="#ffffff" />, markerBg: '#f97316', label: 'UTILITIES'
            };
        }
        return {
            bg: '#e0e7ff', text: '#4f46e5', icon: <Wrench size={12} color="#ffffff" />, markerBg: '#3b82f6', label: 'INFRASTRUCTURE'
        };
    };

    const handleZoomIn = () => {
        if(mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: 23.0305,
                longitude: 72.5614,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 500);
        }
    };
    const handleZoomOut = () => {
        if(mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: 23.0305,
                longitude: 72.5614,
                latitudeDelta: 0.25,
                longitudeDelta: 0.25,
            }, 500);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <ChevronRight color="#0f172a" size={28} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>
                    <View style={{ backgroundColor: '#2d3b8e', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                        <ShieldCheck color="#ffffff" size={20} />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#091557' }}>CityGuard</Text>
                </View>
                <TouchableOpacity>
                    <Bell color="#475569" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 }}>
                    {/* Live Map Badge */}
                    <View style={{ backgroundColor: '#fed7aa', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 }}>
                        <Text style={{ color: '#c2410c', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>Live Map</Text>
                    </View>

                    {/* Typography */}
                    <Text style={{ fontSize: 36, fontWeight: '800', color: '#1e3a8a', lineHeight: 42 }}>Transparency in</Text>
                    <Text style={{ fontSize: 36, fontWeight: '800', color: '#f97316', lineHeight: 42, marginBottom: 12 }}>Action.</Text>
                    
                    <Text style={{ fontSize: 15, color: '#475569', lineHeight: 22, fontWeight: '500', marginBottom: 24 }}>
                        Monitor real-time civic resolutions across Ahmedabad. Every pin represents a voice heard and an issue solved.
                    </Text>

                    {/* Filters */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                        <TouchableOpacity style={{ backgroundColor: '#091557', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}>
                            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>All Issues</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                            <Text style={{ color: '#475569', fontSize: 13, fontWeight: '700' }}>Roads</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                            <Text style={{ color: '#475569', fontSize: 13, fontWeight: '700' }}>Waste</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Map Implementation */}
                <View style={{ marginHorizontal: 24, height: 350, borderRadius: 24, overflow: 'hidden', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5, marginBottom: 32 }}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: 23.0305,
                            longitude: 72.5614,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                        }}
                    >
                        {visibleReports.map((report) => {
                            if (!report.location || !report.location.latitude) return null;
                            const styles = getCategoryStyles(report.category);
                            return (
                                <Marker
                                    key={report._id}
                                    coordinate={{
                                        latitude: report.location.latitude,
                                        longitude: report.location.longitude
                                    }}
                                >
                                    <View style={{ backgroundColor: '#ffffff', padding: 3, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
                                        <View style={{ backgroundColor: styles.markerBg, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                                            {styles.icon}
                                        </View>
                                    </View>
                                </Marker>
                            );
                        })}
                    </MapView>
                    
                    {/* Floating Map Controls */}
                    <View style={{ position: 'absolute', bottom: 16, right: 16, gap: 8 }}>
                        <TouchableOpacity onPress={handleZoomIn} style={{ width: 44, height: 44, backgroundColor: '#ffffff', borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}>
                            <Plus color="#334155" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleZoomOut} style={{ width: 44, height: 44, backgroundColor: '#ffffff', borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}>
                            <Minus color="#334155" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ width: 44, height: 44, backgroundColor: '#091557', borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                            <Navigation color="#ffffff" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recently Resolved List */}
                <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1e3a8a', width: '50%' }}>Recently Resolved</Text>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fed7aa', justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f97316' }} />
                            </View>
                            <Text style={{ color: '#4f46e5', fontWeight: '800', fontSize: 13 }}>View Archive</Text>
                            <ArrowRight color="#4f46e5" size={14} />
                        </TouchableOpacity>
                    </View>

                    {visibleReports.length === 0 ? (
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
                            <Text style={{ color: '#94a3b8', fontWeight: '600' }}>No public data available currently.</Text>
                        </View>
                    ) : (
                        visibleReports.slice(0, 5).map((report) => {
                            const styles = getCategoryStyles(report.category);
                            return (
                                <View key={report._id} style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
                                    
                                    {/* Top Row: Case ID and Status */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                            CASE #CG-{report._id.slice(-4).toUpperCase()}
                                        </Text>
                                        <View style={{ backgroundColor: '#dcfce3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle2 color="#166534" size={12} strokeWidth={3} />
                                            <Text style={{ color: '#166534', fontSize: 10, fontWeight: '800' }}>Resolved</Text>
                                        </View>
                                    </View>

                                    {/* Tag */}
                                    <View style={{ backgroundColor: styles.bg, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 12 }}>
                                        <Text style={{ color: styles.text, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{styles.label}</Text>
                                    </View>

                                    {/* Title */}
                                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 12, lineHeight: 24 }}>
                                        {report.title}
                                    </Text>

                                    {/* Location */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                        <MapPin color="#475569" size={16} style={{ marginRight: 6 }} />
                                        <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>
                                            {report.location?.locality || report.location?.zone || 'Ahmedabad District'}
                                        </Text>
                                    </View>

                                    {/* Separator */}
                                    <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 }} />

                                    {/* Footer */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ backgroundColor: '#f1f5f9', padding: 6, borderRadius: 12 }}>
                                                <User color="#64748b" size={14} />
                                            </View>
                                            <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>Anonymous Citizen</Text>
                                        </View>
                                        <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic', fontWeight: '500' }}>
                                            {timeAgo(report.updatedAt || report.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

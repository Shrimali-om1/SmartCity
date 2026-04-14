import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
    Platform, StatusBar, RefreshControl, Alert
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrafficCone, Bell, LayoutGrid, ClipboardList, MapPin, User, AlertTriangle, Construction } from 'lucide-react-native';
import { Image } from 'expo-image';
import API from '../services/api';
import ContractorTaskCard from '../components/ContractorTaskCard';

export default function ContractorRoad() {
    const [profile, setProfile]       = useState(null);
    const [tasks, setTasks]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [profileRes, tasksRes] = await Promise.all([
                API.get('/auth/profile'),
                API.get('/reports/contractor'),
            ]);
            setProfile(profileRes.data);
            setTasks(tasksRes.data);
        } catch (e) {
            console.error('Road contractor fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };
    const handleLogout = async () => { await AsyncStorage.removeItem('token'); router.replace('/'); };

    const avatarUrl = profile?.profilePhoto
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'R')}&background=78350f&color=fff`;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffbeb' }}>
                <ActivityIndicator size="large" color="#b45309" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fffbeb' }}>
            <StatusBar barStyle="light-content" backgroundColor="#78350f" />

            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={{
                backgroundColor: '#78350f',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 56,
                paddingBottom: 28, paddingHorizontal: 24,
                borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }} contentFit="cover" />
                        <View>
                            <Text style={{ color: '#fde68a', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Hello, Road Contractor</Text>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>{profile?.name || 'The Digital Sovereign'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: 10, borderRadius: 14 }}>
                        <Bell color="white" size={20} />
                    </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <AlertTriangle color="#fbbf24" size={10} style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fbbf24', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Road Works Active</Text>
                    </View>
                    <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', marginBottom: 4 }}>Active Tasks</Text>
                    <Text style={{ color: '#fde68a', fontSize: 13, fontWeight: '500', marginBottom: 16 }}>
                        Manage road repair, resurfacing, pothole fixes, and pavement maintenance requests.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[
                            { val: String(tasks.length).padStart(2,'0'), label: 'Assigned' },
                            { val: String(Math.floor(tasks.length * 1.4 + 6)).padStart(2,'0'), label: 'Completed' },
                        ].map((s, i) => (
                            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>{s.val}</Text>
                                <Text style={{ color: '#fde68a', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</Text>
                            </View>
                        ))}
                        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <TrafficCone color="#fde68a" size={26} />
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#b45309']} />}>
                {/* Road Condition Metric */}
                <View style={{ backgroundColor: '#92400e', borderRadius: 28, padding: 20, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, marginRight: 12 }}>
                            <TrafficCone color="white" size={20} />
                        </View>
                        <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>Road Condition Index</Text>
                    </View>
                    <Text style={{ color: '#fde68a', fontSize: 13, fontWeight: '500', marginBottom: 14 }}>Zone 3 overall surface quality</Text>
                    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6 }}>
                        <View style={{ width: '62%', height: 6, backgroundColor: '#fbbf24', borderRadius: 3 }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#fde68a', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Target: 85%</Text>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>62%</Text>
                    </View>
                </View>

                {/* Assigned Tasks Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900' }}>Assigned Tasks</Text>
                    <TouchableOpacity><Text style={{ color: '#b45309', fontSize: 12, fontWeight: '800' }}>View Schedule →</Text></TouchableOpacity>
                </View>

                {tasks.length === 0 ? (
                    <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#fde68a', elevation: 2, marginBottom: 20 }}>
                        <View style={{ backgroundColor: '#fffbeb', width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                            <TrafficCone color="#fbbf24" size={32} />
                        </View>
                        <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '900', marginBottom: 6 }}>No Active Tasks</Text>
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>You have no road tasks assigned. Pull down to refresh.</Text>
                    </View>
                ) : (
                    tasks.map(task => <ContractorTaskCard key={task._id} task={task} onRefresh={onRefresh} accentColor="#b45309" />)
                )}

                {/* SLA Stats */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Avg Repair Time', val: '3.2h', sub: 'Per Task' },
                        { label: 'SLA Compliance', val: '87%', sub: 'This Week' },
                    ].map((s, i) => (
                        <View key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: 22, padding: 18, elevation: 2, borderWidth: 1, borderColor: '#fef3c7' }}>
                            <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>{s.label}</Text>
                            <Text style={{ color: '#0f172a', fontSize: 26, fontWeight: '900' }}>{s.val}</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{s.sub}</Text>
                        </View>
                    ))}
                </View>

                {/* Zone Coverage */}
                <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#fef3c7', elevation: 2 }}>
                    <Text style={{ color: '#b45309', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Coverage Zone</Text>
                    <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 14 }}>Zone 3 — East Sector</Text>
                    <View style={{ height: 1, backgroundColor: '#fef3c7', marginBottom: 14 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Active Road Closures</Text>
                            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900' }}>2 Ongoing</Text>
                        </View>
                        <View style={{ backgroundColor: '#fef3c7', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                            <AlertTriangle color="#d97706" size={22} />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Nav */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#78350f', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
                    <LayoutGrid color="white" size={20} />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>DASHBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => Alert.alert('Tasks', 'All assigned tasks are actively listed on your dashboard.')}>
                    <ClipboardList color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>TASKS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => Alert.alert('Map View', 'Real-time infrastructure map feature is launching soon.')}>
                    <MapPin color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>MAP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/contractor_profile')}>
                    <User color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>PROFILE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

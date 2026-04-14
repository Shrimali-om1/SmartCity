import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
    Platform, StatusBar, RefreshControl, Alert
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Zap, Bell, LayoutGrid, ClipboardList, MapPin, User, AlertCircle, Activity } from 'lucide-react-native';
import { Image } from 'expo-image';
import API from '../services/api';
import ContractorTaskCard from '../components/ContractorTaskCard';

export default function ContractorElectricity() {
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
            console.error('Electricity contractor fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };
    const handleLogout = async () => { await AsyncStorage.removeItem('token'); router.replace('/'); };

    const avatarUrl = profile?.profilePhoto
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'E')}&background=1e1b4b&color=fff`;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f3ff' }}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f3ff' }}>
            <StatusBar barStyle="light-content" backgroundColor="#1e1b4b" />

            {/* ── Header ──────────────────────────────────────────────── */}
            <View style={{
                backgroundColor: '#1e1b4b',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 56,
                paddingBottom: 28, paddingHorizontal: 24,
                borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }} contentFit="cover" />
                        <View>
                            <Text style={{ color: '#c4b5fd', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Hello, Electricity Contractor</Text>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>{profile?.name || 'The Digital Sovereign'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.12)', padding: 10, borderRadius: 14 }}>
                        <Bell color="white" size={20} />
                    </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#a78bfa', marginRight: 8 }} />
                        <Text style={{ color: '#a78bfa', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Grid Status: Operational</Text>
                    </View>
                    <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', marginBottom: 4 }}>Active Tasks</Text>
                    <Text style={{ color: '#c4b5fd', fontSize: 13, fontWeight: '500', marginBottom: 16 }}>
                        Manage street lighting, power outages, transformer faults, and electrical infrastructure.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[
                            { val: String(tasks.length).padStart(2,'0'), label: 'Assigned' },
                            { val: String(Math.floor(tasks.length * 1.4 + 10)).padStart(2,'0'), label: 'Completed' },
                        ].map((s, i) => (
                            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>{s.val}</Text>
                                <Text style={{ color: '#c4b5fd', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</Text>
                            </View>
                        ))}
                        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <Zap color="#a78bfa" size={26} />
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />}>
                {/* Grid Health Metric */}
                <View style={{ backgroundColor: '#312e81', borderRadius: 28, padding: 20, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, marginRight: 12 }}>
                            <Zap color="white" size={20} />
                        </View>
                        <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>Grid Health</Text>
                    </View>
                    <Text style={{ color: '#c4b5fd', fontSize: 13, fontWeight: '500', marginBottom: 14 }}>Zone 2 power distribution load</Text>
                    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6 }}>
                        <View style={{ width: '82%', height: 6, backgroundColor: '#a78bfa', borderRadius: 3 }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#c4b5fd', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Safe Load</Text>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>82%</Text>
                    </View>
                </View>

                {/* Assigned Tasks Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900' }}>Assigned Tasks</Text>
                    <TouchableOpacity><Text style={{ color: '#7c3aed', fontSize: 12, fontWeight: '800' }}>View Schedule →</Text></TouchableOpacity>
                </View>

                {tasks.length === 0 ? (
                    <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#ede9fe', elevation: 2, marginBottom: 20 }}>
                        <View style={{ backgroundColor: '#f5f3ff', width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                            <Zap color="#c4b5fd" size={32} />
                        </View>
                        <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '900', marginBottom: 6 }}>No Active Tasks</Text>
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>You have no electrical tasks assigned. Pull down to refresh.</Text>
                    </View>
                ) : (
                    tasks.map(task => <ContractorTaskCard key={task._id} task={task} onRefresh={onRefresh} accentColor="#7c3aed" />)
                )}

                {/* Grid Stats Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    {[
                        { icon: <Activity color="#7c3aed" size={16} />, label: 'Response Time', val: '18m', sub: 'Avg This Week' },
                        { icon: <AlertCircle color="#7c3aed" size={16} />, label: 'Outages Fixed', val: '31', sub: 'This Month' },
                    ].map((s, i) => (
                        <View key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: 22, padding: 18, elevation: 2, borderWidth: 1, borderColor: '#ede9fe' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                                {s.icon}
                                <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700' }}>{s.label}</Text>
                            </View>
                            <Text style={{ color: '#0f172a', fontSize: 26, fontWeight: '900' }}>{s.val}</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{s.sub}</Text>
                        </View>
                    ))}
                </View>

                {/* Power Grid Coverage */}
                <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#ede9fe', elevation: 2 }}>
                    <Text style={{ color: '#7c3aed', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Power Grid</Text>
                    <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 14 }}>Zone 2 — West Sector</Text>
                    <View style={{ height: 1, backgroundColor: '#ede9fe', marginBottom: 14 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Grid Stability</Text>
                            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900' }}>Stable 96.1%</Text>
                        </View>
                        <View style={{ backgroundColor: '#ede9fe', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}>
                            <Zap color="#7c3aed" size={22} />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Nav */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#1e1b4b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
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

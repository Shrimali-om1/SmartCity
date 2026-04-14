import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
    Platform, StatusBar, RefreshControl, Alert
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recycle, Bell, LayoutGrid, ClipboardList, MapPin, User, Leaf, TrendingUp, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import API from '../services/api';
import ContractorTaskCard from '../components/ContractorTaskCard';

export default function ContractorWaste() {
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
            console.error('Waste contractor fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchData(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchData(); };
    const handleLogout = async () => { await AsyncStorage.removeItem('token'); router.replace('/'); };

    const avatarUrl = profile?.profilePhoto
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'W')}&background=14532d&color=fff`;

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
            <StatusBar barStyle="light-content" backgroundColor="#14532d" />

            {/* ── Header ──────────────────────────────────────── */}
            <View style={{
                backgroundColor: '#14532d',
                paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 56,
                paddingBottom: 28, paddingHorizontal: 24,
                borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
            }}>
                {/* Top Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View>
                        <Text style={{ color: '#6ee7b7', fontSize: 12, fontWeight: '600' }}>
                            {profile?.name || 'The Digital Sovereign'}
                        </Text>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: '900' }}>Hello, Waste Contractor</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 10 }}>
                            <Bell color="white" size={20} />
                        </TouchableOpacity>
                        <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }} contentFit="cover" />
                    </View>
                </View>

                {/* Hero Banner */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 8 }} />
                        <Text style={{ color: '#4ade80', fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Eco Status: High</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ color: 'white', fontSize: 40, fontWeight: '900', marginRight: 12 }}>
                            {String(tasks.length).padStart(2, '0')}
                        </Text>
                        <Text style={{ color: '#86efac', fontSize: 13, fontWeight: '500' }}>items pending</Text>
                        <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 12 }}>
                            <Recycle color="#86efac" size={28} />
                        </View>
                    </View>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>ACTIVE TASKS</Text>
                    <Text style={{ color: '#86efac', fontSize: 13, fontWeight: '500', lineHeight: 19 }}>
                        Manage municipal solid waste collection, disposal routes, and eco-compliance alerts.
                    </Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 22 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />}
            >
                {/* Collection Rate Card */}
                <View style={{ backgroundColor: '#166534', borderRadius: 28, padding: 20, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, marginRight: 12 }}>
                            <Recycle color="white" size={20} />
                        </View>
                        <Text style={{ color: 'white', fontSize: 17, fontWeight: '900' }}>Collection Rate</Text>
                    </View>
                    <Text style={{ color: '#86efac', fontSize: 13, fontWeight: '500', marginBottom: 14 }}>Daily quota completion</Text>
                    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 6 }}>
                        <View style={{ width: '88%', height: 6, backgroundColor: '#4ade80', borderRadius: 3 }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#86efac', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Daily Target</Text>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '900' }}>88%</Text>
                    </View>
                </View>

                {/* Assigned Tasks Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900' }}>Assigned Tasks</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Leaf color="#16a34a" size={13} />
                        <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '800' }}>Eco-Status: High</Text>
                    </View>
                </View>

                {/* Task Cards */}
                {tasks.length === 0 ? (
                    <View style={{ backgroundColor: 'white', borderRadius: 28, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7', elevation: 2, marginBottom: 20 }}>
                        <View style={{ backgroundColor: '#f0fdf4', width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                            <Recycle color="#86efac" size={32} />
                        </View>
                        <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '900', marginBottom: 6 }}>No Active Tasks</Text>
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>You have no tasks assigned. Pull down to refresh.</Text>
                    </View>
                ) : (
                    tasks.map(task => <ContractorTaskCard key={task._id} task={task} onRefresh={onRefresh} accentColor="#16a34a" />)
                )}

                {/* Eco Stats Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    {[
                        { icon: <TrendingUp color="#16a34a" size={16} />, label: 'Efficiency', val: '94%', sub: 'This Month' },
                        { icon: <Leaf color="#16a34a" size={16} />, label: 'Impact', val: '1.2t', sub: 'CO₂ Saved' },
                    ].map((s, i) => (
                        <View key={i} style={{ flex: 1, backgroundColor: 'white', borderRadius: 22, padding: 18, elevation: 2, borderWidth: 1, borderColor: '#f0fdf4' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                                {s.icon}
                                <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700' }}>{s.label}</Text>
                            </View>
                            <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '900' }}>{s.val}</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>{s.sub}</Text>
                        </View>
                    ))}
                </View>

                {/* Route Overview Card */}
                <View style={{ height: 160, borderRadius: 28, overflow: 'hidden', marginBottom: 20, backgroundColor: '#0d4a3a', justifyContent: 'flex-end' }}>
                    {[0.25, 0.5, 0.75].map((v, i) => (
                        <View key={i} style={{ position: 'absolute', top: `${v * 100}%`, left: 0, right: 0, height: 1, backgroundColor: 'rgba(52,211,153,0.15)' }} />
                    ))}
                    {[0.2, 0.4, 0.6, 0.8].map((v, i) => (
                        <View key={i} style={{ position: 'absolute', left: `${v * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(52,211,153,0.15)' }} />
                    ))}
                    <View style={{ position: 'absolute', top: '35%', left: '55%', width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ade80' }} />
                    <View style={{ position: 'absolute', top: '55%', left: '35%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#86efac', opacity: 0.6 }} />
                    <View style={{ position: 'absolute', top: '25%', left: '75%', width: 6, height: 6, borderRadius: 3, backgroundColor: '#6ee7b7', opacity: 0.5 }} />
                    <View style={{ padding: 18 }}>
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>Route Overview</Text>
                        <Text style={{ color: '#6ee7b7', fontSize: 12, fontWeight: '500', marginTop: 2 }}>3 tasks within 2km radius</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={{ position: 'absolute', bottom: 90, right: 20, backgroundColor: '#16a34a', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}>
                <Plus color="white" size={26} />
            </TouchableOpacity>

            {/* Bottom Nav */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#14532d', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
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

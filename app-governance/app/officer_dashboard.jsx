import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Switch, Platform, StatusBar } from 'react-native';
import { LogOut, ClipboardList, Briefcase, Clock, FileWarning, CheckCircle, AlertCircle, Bell, User, Search, AlertTriangle, Shield, Clipboard, Check, MapPin, Target, LayoutGrid, FileText } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import OfficerReportModal from '../components/OfficerReportModal';

export default function OfficerDashboard() {
    const [pendingTasks, setPendingTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // active, pending, archived

    const [unreadCount, setUnreadCount] = useState(0);
    const [globalAlert, setGlobalAlert] = useState(null);
    const lastNotifId = useRef(null);

    const [userData, setUserData] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, notifRes, profileRes] = await Promise.all([
                API.get('/reports/all-pending'),
                API.get('/notifications'),
                API.get('/auth/profile').catch(() => null)
            ]);
            
            setPendingTasks(tasksRes.data);
            if(profileRes) setUserData(profileRes.data);

            const unread = notifRes.data.filter(n => !n.isRead);
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
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
            const interval = setInterval(fetchData, 15000); 
            return () => clearInterval(interval);
        }, [])
    );

    const handleClaimTask = async (taskId) => {
        try {
            await API.put(`/reports/claim/${taskId}`);
            Alert.alert('Success', 'Task claimed successfully!');
            setModalVisible(false);
            fetchData(); 
        } catch (error) {
            console.error('Error claiming task:', error);
            Alert.alert('Error', 'Could not claim task. It may have already been assigned.');
        }
    };

    const handleAssignContractor = async (taskId, contractorId) => {
        try {
            await API.put(`/reports/assign-contractor/${taskId}`, { contractorId });
            Alert.alert('Success', 'Contractor assigned successfully!');
            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error assigning contractor:', error);
            Alert.alert('Error', 'Could not assign contractor.');
        }
    };

    const handleResolveTask = async (taskId) => {
        try {
            await API.put(`/reports/resolve/${taskId}`);
            Alert.alert('Success', 'Task resolved successfully!');
            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error resolving task:', error);
            Alert.alert('Error', 'Could not resolve task.');
        }
    };

    const getTaskStyles = (task) => {
        const createdDate = new Date(task.createdAt);
        const diffInHours = (new Date() - createdDate) / (1000 * 60 * 60);
        
        let urgency = { bg: 'bg-blue-100', text: 'text-blue-700', label: `ROUTINE \u2022 ${Math.floor(24 - diffInHours)} HRS LEFT` };
        if (diffInHours > 24) {
             urgency = { bg: 'bg-red-100', text: 'text-red-700', label: 'URGENT \u2022 ESCALATED' };
        } else if (task.category === 'Water' || task.category === 'Road') {
             urgency = { bg: 'bg-orange-100', text: 'text-orange-700', label: `URGENT \u2022 ${Math.max(0, Math.floor((24 - diffInHours)*60))} MINS LEFT` };
        }

        let icon = { bg: 'bg-slate-200', comp: <Target color="#475569" size={20} /> };
        if (task.category?.toLowerCase() === 'waste') icon = { bg: 'bg-slate-200', comp: <FileWarning color="#475569" size={20} /> };
        if (task.category?.toLowerCase().includes('light')) icon = { bg: 'bg-red-100', comp: <AlertCircle color="#dc2626" size={20} /> };
        else if (urgency.bg.includes('red') || urgency.bg.includes('orange')) icon = { bg: 'bg-red-100', comp: <AlertCircle color="#dc2626" size={20} /> };

        return { urgency, icon };
    };

    const filteredTasks = useMemo(() => {
        return pendingTasks.filter(task => {
            const idMatch = task._id?.slice(-4).includes(searchQuery);
            const localityMatch = task.location?.locality?.toLowerCase().includes(searchQuery.toLowerCase());
            return searchQuery === '' || idMatch || localityMatch;
        });
    }, [pendingTasks, searchQuery]);

    const statAssigned = pendingTasks.length * 2 + 8; // mocked
    const statCompleted = Math.floor(statAssigned * 0.7); // mocked
    const OfficerAvatar = 'https://ui-avatars.com/api/?name=Officer+Sharma&background=091557&color=fff';

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{ backgroundColor: '#f8fafc', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={{ uri: userData?.profilePhoto || OfficerAvatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                        <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900' }}>CityGuard</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/officer_notifications')}>
                        <Bell color="#475569" size={24} />
                        {unreadCount > 0 && <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#ea580c', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#f8fafc' }} />}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
                
                {/* Hero Card */}
                <View className="bg-[#2d3b8e] w-full rounded-[40px] p-6 shadow-xl shadow-[#2d3b8e]/30 mt-4 mb-6">
                    <View className="flex-row items-center mb-3">
                         <View className="w-2 h-2 bg-[#fbbf24] rounded-full mr-2 shadow-sm" />
                         <Text className="text-blue-200 text-[10px] font-[900] tracking-widest uppercase">DUTY STATUS: ACTIVE</Text>
                    </View>
                    <Text className="text-white text-4xl font-[900] mb-3 leading-tight tracking-tight">Namaste,{'\n'}Officer {userData?.name?.split(' ')[0] || 'Sharma'}</Text>
                    <Text className="text-blue-100 text-sm font-medium mb-8 leading-relaxed">
                        Your patrol sector is currently stable. You have {pendingTasks.length} high-priority tasks pending review.
                    </Text>

                    <View className="flex-col gap-3">
                        <TouchableOpacity 
                            className="bg-white/20 border border-white/20 rounded-full py-3.5 flex-row items-center justify-center"
                            onPress={() => Alert.alert("Emergency Dispatch", "Emergency protocols activated. Precinct backup units have been alerted.")}
                        >
                             <Shield color="white" size={16} className="mr-2" />
                             <Text className="text-white font-[900] text-[11px] tracking-widest uppercase">EMERGENCY DISPATCH</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            className="bg-[#fbbf24] rounded-full py-3.5 flex-row items-center justify-center shadow-md"
                            onPress={() => router.push('/create_report')}
                        >
                             <Target color="#091557" size={16} className="mr-2" />
                             <Text className="text-[#091557] font-[900] text-[11px] tracking-widest uppercase">LOG INCIDENT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Vertical KPI Stats */}
                <View className="mb-6">
                    <View className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-100 flex-row justify-between items-center">
                         <View>
                              <Text className="text-[10px] font-[900] text-slate-500 uppercase tracking-widest mb-1">Tasks Assigned</Text>
                              <Text className="text-[#091557] text-4xl font-[900]">{statAssigned}</Text>
                         </View>
                         <View className="bg-[#e0e7ff] w-12 h-12 rounded-full justify-center items-center">
                              <ClipboardList color="#3730a3" size={20} />
                         </View>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-100 flex-row justify-between items-center">
                         <View>
                              <Text className="text-[10px] font-[900] text-slate-500 uppercase tracking-widest mb-1">Completed</Text>
                              <Text className="text-[#091557] text-4xl font-[900]">{statCompleted}</Text>
                         </View>
                         <View className="bg-[#e0e7ff] w-12 h-12 rounded-full justify-center items-center">
                              <CheckCircle color="#3730a3" size={20} />
                         </View>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex-row justify-between items-center">
                         <View>
                              <Text className="text-[10px] font-[900] text-slate-500 uppercase tracking-widest mb-1">SLA Compliance</Text>
                              <Text className="text-[#091557] text-4xl font-[900]">94%</Text>
                         </View>
                         <View className="bg-[#ffedd5] w-12 h-12 rounded-full justify-center items-center">
                              <Shield color="#b45309" size={20} />
                         </View>
                    </View>
                </View>

                {/* Queue Header & Tabs */}
                <Text className="text-[#0f172a] text-2xl font-[900] mb-4">Available Queue</Text>
                <View className="flex-row items-center mb-5">
                    <TouchableOpacity 
                        className={`${activeTab === 'active' ? 'bg-[#091557]' : 'bg-transparent'} px-5 py-2.5 rounded-full mr-2`}
                        onPress={() => setActiveTab('active')}
                    >
                         <Text className={`${activeTab === 'active' ? 'text-white' : 'text-[#64748b]'} text-[10px] font-[900] tracking-widest uppercase`}>Active Tasks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className={`${activeTab === 'pending' ? 'bg-[#091557]' : 'bg-transparent'} px-5 py-2.5 rounded-full mr-2`}
                        onPress={() => setActiveTab('pending')}
                    >
                         <Text className={`${activeTab === 'pending' ? 'text-white' : 'text-[#64748b]'} text-[10px] font-[900] tracking-widest uppercase`}>Pending Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className={`${activeTab === 'archived' ? 'bg-[#091557]' : 'bg-transparent'} px-5 py-2.5 rounded-full`}
                        onPress={() => setActiveTab('archived')}
                    >
                         <Text className={`${activeTab === 'archived' ? 'text-white' : 'text-[#64748b]'} text-[10px] font-[900] tracking-widest uppercase`}>Archived</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-[#f1f5f9] border border-slate-200 rounded-full px-5 py-3 mb-6 shadow-sm shadow-slate-100">
                    <Search color="#94a3b8" size={18} className="mr-3" />
                    <TextInput
                        className="flex-1 text-[#0f172a] text-sm font-medium"
                        placeholder="Search by incident ID, citizen name, or location..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Task List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#2d3b8e" className="mt-8" />
                ) : filteredTasks.length === 0 ? (
                    <View className="bg-white p-8 rounded-[32px] border border-slate-100 items-center justify-center mt-2">
                        <CheckCircle size={48} color="#94a3b8" className="mb-4" />
                        <Text className="text-[#0f172a] text-lg font-[900]">Queue is Empty</Text>
                    </View>
                ) : (
                    filteredTasks.map((task) => {
                        const { urgency, icon } = getTaskStyles(task);
                        
                        return (
                            <TouchableOpacity
                                key={task._id}
                                className="bg-white rounded-[32px] p-5 mb-4 border border-slate-100 shadow-sm"
                                activeOpacity={0.8}
                                onPress={() => {
                                    setSelectedTask(task);
                                    setModalVisible(true);
                                }}
                            >
                                 <View className="flex-row justify-between items-start mb-3">
                                      <View className={`px-3 py-1.5 rounded-full ${urgency.bg}`}>
                                           <Text className={`text-[8px] font-[900] tracking-widest uppercase ${urgency.text}`}>{urgency.label}</Text>
                                      </View>
                                      <View className={`${icon.bg} w-10 h-10 rounded-full justify-center items-center`}>
                                           {icon.comp}
                                      </View>
                                 </View>
                                 
                                 <Text className="text-[#0f172a] font-[900] text-xl leading-tight mb-3 pr-10">{task.title}</Text>
                                 
                                 <View className="flex-row items-center mb-5">
                                      <MapPin color="#64748b" size={14} className="mr-2" />
                                      <Text className="text-[#64748b] text-xs font-medium tracking-wide">{task.location?.locality || 'Unknown Area'}</Text>
                                 </View>

                                 <View className="flex-row justify-between items-center border-t border-slate-100 pt-4 mt-1">
                                      <View className="flex-row items-center">
                                           {task.imageUrl ? (
                                                <Image source={{ uri: task.imageUrl }} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                                           ) : (
                                                <View className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white items-center justify-center">
                                                    <User color="#94a3b8" size={14} />
                                                </View>
                                           )}
                                           <View className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white items-center justify-center -ml-3">
                                                <Text className="text-blue-700 text-[9px] font-[900]">+2</Text>
                                           </View>
                                      </View>
                                      <TouchableOpacity 
                                            className="px-3 py-2"
                                            onPress={() => {
                                                setSelectedTask(task);
                                                setModalVisible(true);
                                            }}
                                      >
                                           <Text className="text-[#091557] font-[900] text-[10px] tracking-widest uppercase">ACCEPT TASK  <Text className="text-lg leading-none">›</Text></Text>
                                      </TouchableOpacity>
                                 </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Bottom Nav Tab */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 }}>
                <TouchableOpacity style={{ alignItems: 'center', backgroundColor: '#3730a3', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
                    <LayoutGrid color="white" size={20} />
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>DASHBOARD</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/assigned_tasks')}>
                    <ClipboardList color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>TASKS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/review_tasks')}>
                    <CheckCircle color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>REVIEW</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/officer_profile')}>
                    <User color="#94a3b8" size={20} />
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 0.5 }}>PROFILE</Text>
                </TouchableOpacity>
            </View>

            <OfficerReportModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                report={selectedTask}
                onClaim={handleClaimTask}
                onAssignContractor={handleAssignContractor}
                onResolve={handleResolveTask}
            />
        </View>
    );
}

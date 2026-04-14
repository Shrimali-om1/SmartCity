import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import API from '../services/api';
import OfficerReportModal from '../components/OfficerReportModal';
import { Clock, AlertCircle } from 'lucide-react-native';

export default function AssignedTasks() {
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchMyTasks = async () => {
        try {
            setLoading(true);
            const response = await API.get('/reports/my-assigned');
            setAssignedTasks(response.data);
        } catch (error) {
            console.error('Error fetching assigned tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyTasks();
        }, [])
    );

    const handleResolveTask = async (taskId) => {
        try {
            await API.put(`/reports/resolve/${taskId}`);
            Alert.alert('Success', 'Task resolved successfully! 50 points awarded.');
            setModalVisible(false);
            fetchMyTasks(); // Refresh list
        } catch (error) {
            console.error('Error resolving task:', error);
            // Show backend error message if available
            const msg = error.response?.data?.message || 'Could not resolve task.';
            Alert.alert('Error', msg);
        }
    };

    const handleAssignContractor = async (taskId, contractorId) => {
        try {
            await API.put(`/reports/assign-contractor/${taskId}`, { contractorId });
            Alert.alert('Success', 'Contractor assigned successfully!');
            setModalVisible(false);
            fetchMyTasks();
        } catch (error) {
            console.error('Error assigning contractor:', error);
            Alert.alert('Error', 'Could not assign contractor.');
        }
    };

    const getResolutionSLA = (createdAt, category) => {
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffInHours = (now - createdDate) / (1000 * 60 * 60);

        let limit = 72; // Default
        const cat = category?.toLowerCase() || '';
        if (cat === 'waste') limit = 48;
        if (cat === 'water' || cat === 'electricity') limit = 24;

        const timeLeft = Math.max(0, limit - diffInHours);
        const isEscalated = diffInHours > limit;
        return { isEscalated, limit, timeLeft: Math.floor(timeLeft) };
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="bg-blue-700 pt-12 pb-6 px-4 flex-row items-center border-b border-blue-800 shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-xl font-bold">My Assigned Tasks</Text>
                    <Text className="text-blue-200 text-sm font-medium">Resolve issues to earn points for citizens</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#1d4ed8" className="mt-8" />
                ) : assignedTasks.length === 0 ? (
                    <View className="bg-white p-8 rounded-2xl border border-slate-200 items-center justify-center mt-6">
                        <ClipboardCheck size={48} color="#94a3b8" className="mb-4" />
                        <Text className="text-slate-500 text-center font-medium">You have no active tasks currently.</Text>
                    </View>
                ) : (
                    assignedTasks.map((task) => {
                        const { isEscalated, limit, timeLeft } = getResolutionSLA(task.createdAt, task.category);

                        return (
                            <TouchableOpacity
                                key={task._id}
                                className={`bg-white rounded-2xl mb-5 shadow-sm border ${isEscalated && task.status !== 'resolved' ? 'border-red-400' : 'border-slate-200'} overflow-hidden relative`}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setSelectedTask(task);
                                    setModalVisible(true);
                                }}
                            >
                                {task.status !== 'resolved' && (
                                    isEscalated ? (
                                        <View className="absolute top-0 right-0 z-10 bg-red-500 px-3 py-1 rounded-bl-xl items-center flex-row shadow-sm">
                                            <AlertCircle color="white" size={14} className="mr-1" />
                                            <Text className="text-white text-xs font-bold uppercase tracking-widest">🚨 SLA Overdue</Text>
                                        </View>
                                    ) : (
                                        <View className="absolute top-0 right-0 z-10 bg-amber-100 px-3 py-1 rounded-bl-xl items-center flex-row shadow-sm">
                                            <Clock color="#d97706" size={14} className="mr-1" />
                                            <Text className="text-amber-700 text-xs font-bold uppercase tracking-widest">{timeLeft}h / {limit}h SLA</Text>
                                        </View>
                                    )
                                )}

                                {task.imageUrl && (
                                    <Image
                                        source={{ uri: task.imageUrl }}
                                        className="w-full h-40 bg-slate-100"
                                        contentFit="cover"
                                    />
                                )}

                                <View className="p-5">
                                    <View className="flex-row justify-between items-start mb-2">
                                        <Text className={`text-xs font-bold uppercase tracking-wider ${isEscalated && task.status !== 'resolved' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {task.category}
                                        </Text>
                                        <Text className="text-xs text-slate-400">
                                            Assigned on {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>

                                    <Text className="text-lg font-bold text-slate-900 mb-2 leading-tight">{task.title}</Text>
                                    <Text className="text-sm text-slate-600 mb-2">{task.description}</Text>

                                    <View className="mt-2 flex-row items-center justify-between border-t border-slate-100 pt-3">
                                        <Text className="font-bold uppercase tracking-wider text-xs" style={{
                                            color: task.status === 'assigned_to_contractor' ? '#d97706' : '#2563eb'
                                        }}>
                                            {task.status === 'assigned_to_contractor' ? 'Assigned to Contractor' : 'Needs Contractor'}
                                        </Text>
                                        <Text className="text-blue-600 font-bold text-sm">View Details</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <OfficerReportModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                report={selectedTask}
                onClaim={() => { }} // Won't be used here since tasks are already claimed
                onAssignContractor={handleAssignContractor}
                onResolve={handleResolveTask}
            />
        </SafeAreaView>
    );
}

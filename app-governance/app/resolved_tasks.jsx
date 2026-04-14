import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import API from '../services/api';

export default function ResolvedTasks() {
    const [resolvedTasks, setResolvedTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchResolvedTasks = async () => {
        try {
            setLoading(true);
            const response = await API.get('/reports/my-resolved');
            setResolvedTasks(response.data);
        } catch (error) {
            console.error('Error fetching resolved tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchResolvedTasks();
        }, [])
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <View className="bg-green-700 pt-12 pb-6 px-4 flex-row items-center border-b border-green-800 shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-xl font-bold">Resolved Tasks</Text>
                    <Text className="text-green-200 text-sm font-medium">History of your completed assignments</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#16a34a" className="mt-8" />
                ) : resolvedTasks.length === 0 ? (
                    <View className="bg-white p-8 rounded-2xl border border-slate-200 items-center justify-center mt-6">
                        <CheckCircle size={48} color="#94a3b8" className="mb-4" />
                        <Text className="text-slate-500 text-center font-medium">You haven't resolved any tasks yet.</Text>
                    </View>
                ) : (
                    resolvedTasks.map((task) => (
                        <View key={task._id} className="bg-white rounded-2xl mb-5 shadow-sm border border-slate-200 overflow-hidden">
                            {task.imageUrl && (
                                <Image
                                    source={{ uri: task.imageUrl }}
                                    className="w-full h-40 bg-slate-100"
                                    contentFit="cover"
                                />
                            )}

                            <View className="p-5">
                                <View className="flex-row justify-between items-start mb-2">
                                    <Text className="text-xs font-bold text-green-600 uppercase tracking-wider">{task.category}</Text>
                                    <Text className="text-xs text-slate-400">
                                        Resolved on {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>

                                <Text className="text-lg font-bold text-slate-900 mb-2 leading-tight">{task.title}</Text>
                                <Text className="text-sm text-slate-600 mb-2">{task.description}</Text>
                                <View className="mt-2 flex-row items-center">
                                    <CheckCircle color="#16a34a" size={16} className="mr-1" />
                                    <Text className="text-green-600 font-bold text-xs uppercase tracking-wider">Status: Resolved</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

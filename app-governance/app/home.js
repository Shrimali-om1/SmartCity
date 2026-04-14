import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, LogOut } from 'lucide-react-native';
import API from '../services/api';
import "../global.css"

export default function HomeScreen() {
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    const recentIncidents = [
        { id: '1', title: 'Pothole on Main St', status: 'Pending', time: '2 hours ago' },
        { id: '2', title: 'Garbage not collected', status: 'Resolved', time: '5 hours ago' },
        { id: '3', title: 'Street light broken', status: 'Active', time: '1 day ago' },
        { id: '4', title: 'Water pipe leak', status: 'Active', time: '1 day ago' },
        { id: '5', title: 'Fallen tree branch', status: 'Pending', time: '2 days ago' },
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await API.get('/auth/profile');
                if (response.data && response.data.name) {
                    setUserName(response.data.name);
                } else {
                    setUserName('User');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Fallback name if API fails
                setUserName('Governance User');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/');
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header section */}
            <View className="bg-blue-900 pt-16 pb-6 px-6 rounded-b-3xl flex-row justify-between items-center shadow-lg">
                <View>
                    <Text className="text-blue-100 text-sm font-medium">Welcome back,</Text>
                    <Text className="text-white text-2xl font-bold mt-1">{userName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} className="bg-blue-800 p-3 rounded-full">
                    <LogOut color="white" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                {/* Stat Cards (Grid of 3) using Navy Blue Theme */}
                <View className="flex-row justify-between mb-8">
                    <View className="bg-white rounded-2xl p-4 flex-1 mx-1 shadow-sm border border-gray-100 items-center">
                        <Text className="text-blue-900 text-2xl font-bold">12</Text>
                        <Text className="text-gray-500 text-xs text-center mt-1 font-medium">Active{'\n'}Reports</Text>
                    </View>
                    <View className="bg-white rounded-2xl p-4 flex-1 mx-1 shadow-sm border border-gray-100 items-center">
                        <Text className="text-blue-900 text-2xl font-bold">5</Text>
                        <Text className="text-gray-500 text-xs text-center mt-1 font-medium">Pending{'\n'}SLAs</Text>
                    </View>
                    <View className="bg-white rounded-2xl p-4 flex-1 mx-1 shadow-sm border border-gray-100 items-center">
                        <Text className="text-blue-900 text-2xl font-bold">8</Text>
                        <Text className="text-gray-500 text-xs text-center mt-1 font-medium">Resolved{'\n'}Today</Text>
                    </View>
                </View>

                {/* Task List */}
                <Text className="text-lg font-bold text-gray-800 mb-4 px-2">Recent Incidents</Text>
                <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-24">
                    {recentIncidents.map((incident, index) => (
                        <View
                            key={incident.id}
                            className={`p-4 flex-row justify-between items-center ${index !== recentIncidents.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <View>
                                <Text className="text-gray-800 font-semibold">{incident.title}</Text>
                                <Text className="text-gray-400 text-xs mt-1">{incident.time}</Text>
                            </View>
                            <View className={`px-3 py-1 rounded-full ${incident.status === 'Resolved' ? 'bg-green-100' :
                                incident.status === 'Active' ? 'bg-blue-100' : 'bg-orange-100'
                                }`}>
                                <Text className={`text-xs font-bold ${incident.status === 'Resolved' ? 'text-green-700' :
                                    incident.status === 'Active' ? 'text-blue-700' : 'text-orange-700'
                                    }`}>
                                    {incident.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 bg-blue-900 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-blue-900/40"
                activeOpacity={0.8}
            >
                <Camera color="white" size={28} />
                {/* Adding a small plus icon to strictly meet "large + button with Camera icon" */}
                <View className="absolute bottom-3 right-3 bg-white w-4 h-4 rounded-full items-center justify-center">
                    <Text className="text-blue-900 text-[10px] font-bold mt-[-1px]">+</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

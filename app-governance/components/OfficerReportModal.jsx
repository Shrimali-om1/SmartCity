import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import API from '../services/api';

export default function OfficerReportModal({
    visible,
    onClose,
    report,
    onClaim,
    onAssignContractor,
    onResolve
}) {
    const [imageLoading, setImageLoading] = useState(true);
    const [selectedContractor, setSelectedContractor] = useState('');
    const [contractors, setContractors] = useState([]);

    useEffect(() => {
        if (visible) {
            setSelectedContractor('');
            if (report?.category) {
                fetchContractors(report.category);
            }
        }
    }, [visible, report?.category]);

    const fetchContractors = async (category) => {
        try {
            const res = await API.get(`/reports/contractors/${encodeURIComponent(category)}`);
            setContractors(res.data);
        } catch (error) {
            console.error('Error fetching contractors:', error);
        }
    };

    if (!report) return null;

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === 'resolved') return { text: '#28a745', bg: '#d4edda', border: '#c3e6cb' };
        if (s === 'pending') return { text: '#ffc107', bg: '#fff3cd', border: '#ffeeba' };
        if (s === 'urgent' || s === 'assigned' || s === 'assigned_to_contractor') return { text: '#dc3545', bg: '#f8d7da', border: '#f5c6cb' };
        return { text: '#6c757d', bg: '#f8f9fa', border: '#e9ecef' };
    };

    const statusStyle = getStatusStyle(report.status);

    let coordinate = null;
    if (report.location?.latitude && report.location?.longitude) {
        coordinate = {
            latitude: report.location.latitude,
            longitude: report.location.longitude,
        };
    } else if (report.location?.coordinates && report.location.coordinates.length === 2) {
        coordinate = {
            latitude: report.location.coordinates[1],
            longitude: report.location.coordinates[0],
        };
    }

    // SLA Calculation
    const getSLA = (createdAt) => {
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffInMs = now - createdDate;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

        const isBreached = diffInHours > 24;
        return {
            text: `Elapsed: ${diffInHours}h ${diffInMinutes}m`,
            isBreached
        };
    };

    const sla = getSLA(report.createdAt);

    // Dynamic Messages
    const getStatusMessage = (status) => {
        switch (status) {
            case 'pending': return 'Task is awaiting officer assignment.';
            case 'assigned': return 'Task is claimed and awaiting contractor assignment.';
            case 'assigned_to_contractor': return `Task assigned to Contractor. Awaiting resolution.`;
            case 'resolved': return 'Task has been successfully resolved.';
            default: return 'Status unknown.';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white h-[90%] overflow-hidden" style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 }}>

                    <View className="items-center pt-3 pb-1">
                        <View className="w-12 h-1.5 bg-slate-300 rounded-full" />
                    </View>

                    <View className="flex-row justify-between items-center px-5 pb-4 pt-2 border-b border-slate-100">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-900 mb-2">{report.title}</Text>
                            <View className="flex-row items-center gap-2">
                                <View
                                    className="px-3 py-1 rounded-full border"
                                    style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border }}
                                >
                                    <Text className="text-xs font-bold capitalize" style={{ color: statusStyle.text }}>
                                        {report.status.replace(/_/g, ' ')}
                                    </Text>
                                </View>

                                {/* SLA Timer Badge */}
                                <View className={`flex-row items-center px-2 py-1 rounded-full ${sla.isBreached ? 'bg-red-500' : 'bg-slate-200'}`}>
                                    <Clock color={sla.isBreached ? "white" : "#475569"} size={12} className="mr-1" />
                                    <Text className={`text-[10px] font-bold ${sla.isBreached ? 'text-white' : 'text-slate-700'}`}>
                                        {sla.text}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-full ml-4">
                            <X color="#64748b" size={20} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {report.imageUrl ? (
                            <View className="w-full relative justify-center items-center bg-slate-100" style={{ height: 250 }}>
                                {imageLoading && (
                                    <View className="absolute z-10">
                                        <ActivityIndicator size="large" color="#2563eb" />
                                    </View>
                                )}
                                <Image
                                    source={{ uri: report.imageUrl }}
                                    style={{ width: '100%', height: 250 }}
                                    contentFit="cover"
                                    onLoadStart={() => setImageLoading(true)}
                                    onLoadEnd={() => setImageLoading(false)}
                                    onError={() => setImageLoading(false)}
                                />
                            </View>
                        ) : (
                            <View className="w-full bg-slate-100 items-center justify-center" style={{ height: 250 }}>
                                <Text className="text-slate-500 font-medium">No Image Provided</Text>
                            </View>
                        )}

                        <View className="p-5">
                            {/* Dynamic Message Box */}
                            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex-row items-center">
                                <AlertTriangle color="#2563eb" size={20} className="mr-3" />
                                <Text className="text-blue-800 text-sm flex-1">{getStatusMessage(report.status)}</Text>
                            </View>

                            <View className="mb-5">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Category</Text>
                                <Text className="text-base text-slate-800 font-medium">{report.category}</Text>
                            </View>

                            <View className="mb-5">
                                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</Text>
                                <Text className="text-base text-slate-700 leading-relaxed">{report.description}</Text>
                            </View>

                            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location</Text>
                            {coordinate ? (
                                <View className="mb-6 rounded-2xl overflow-hidden border border-slate-200 h-48">
                                    <MapView
                                        style={{ flex: 1 }}
                                        initialRegion={{
                                            ...coordinate,
                                            latitudeDelta: 0.005,
                                            longitudeDelta: 0.005,
                                        }}
                                        scrollEnabled={false}
                                        zoomEnabled={false}
                                    >
                                        <Marker coordinate={coordinate} />
                                    </MapView>
                                </View>
                            ) : (
                                <View className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-32 items-center justify-center">
                                    <MapPin color="#94a3b8" size={32} className="mb-2" />
                                    <Text className="text-slate-500 font-medium">GPS Data Unavailable</Text>
                                </View>
                            )}

                            {/* Dynamic Action Buttons */}
                            <View className="mt-2 mb-8">
                                {report.status === 'pending' && (
                                    <TouchableOpacity
                                        className="bg-slate-900 py-4 rounded-xl flex-row items-center justify-center"
                                        onPress={() => onClaim(report._id)}
                                    >
                                        <Text className="text-white font-bold text-lg">Claim Task</Text>
                                    </TouchableOpacity>
                                )}

                                {(report.status === 'assigned') && (
                                    <View className="gap-4">
                                        <View className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <Picker
                                                selectedValue={selectedContractor}
                                                onValueChange={(itemValue) => setSelectedContractor(itemValue)}
                                                prompt="Select Contractor"
                                            >
                                                <Picker.Item label="Select Contractor to Assign..." value="" />
                                                {contractors.map(c => (
                                                    <Picker.Item key={c._id} label={c.name} value={c._id} />
                                                ))}
                                            </Picker>
                                        </View>

                                        <TouchableOpacity
                                            className={`py-3 rounded-xl flex-row items-center justify-center ${selectedContractor ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            disabled={!selectedContractor}
                                            onPress={() => onAssignContractor(report._id, selectedContractor)}
                                        >
                                            <Text className="text-white font-bold text-base">Assign to Contractor</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {(report.status === 'assigned_to_contractor') && (
                                    <View className="gap-4">
                                        <TouchableOpacity
                                            className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
                                            onPress={() => onResolve(report._id)}
                                        >
                                            <CheckCircle color="white" size={20} className="mr-2" />
                                            <Text className="text-white font-bold text-lg">Mark as Resolved</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {report.status === 'resolved' && (
                                    <TouchableOpacity
                                        className="bg-slate-100 border border-slate-300 py-4 rounded-xl flex-row items-center justify-center"
                                        onPress={() => alert('Viewing completion proof placeholder')}
                                    >
                                        <Text className="text-slate-700 font-bold text-lg">View Completion Proof</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

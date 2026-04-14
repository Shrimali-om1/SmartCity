import React, { useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, CheckCircle, Package, Clock, FileWarning, AlertTriangle } from 'lucide-react-native';
import { Image } from 'expo-image';
import API from '../services/api';

export default function ReviewDetailModal({ visible, onClose, report, onVerifyAndClose }) {
    const [imageLoadingBefore, setImageLoadingBefore] = useState(true);
    const [imageLoadingAfter, setImageLoadingAfter] = useState(true);
    const [closing, setClosing] = useState(false);

    if (!report) return null;

    const handleVerifyAndClose = async () => {
        setClosing(true);
        try {
            await onVerifyAndClose(report._id);
        } finally {
            setClosing(false);
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
                    {/* Handle for Bottom Sheet look */}
                    <View className="items-center pt-3 pb-1">
                        <View className="w-12 h-1.5 bg-slate-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="flex-row justify-between items-center px-5 pb-4 pt-2 border-b border-slate-100">
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-900 mb-1">{report.title}</Text>
                            <Text className="text-sm text-slate-500 font-medium">Review Task Completion</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="bg-slate-100 p-2 rounded-full ml-4">
                            <X color="#64748b" size={20} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                        {/* Images Section */}
                        <View className="p-5">
                            <Text className="text-sm font-bold text-slate-800 mb-3">Verification Photos</Text>
                            <View className="flex-row gap-3">
                                {/* Before Image */}
                                <View className="flex-1">
                                    <View className="w-full relative justify-center items-center bg-slate-100 rounded-xl overflow-hidden mb-2 border border-slate-200" style={{ height: 160 }}>
                                        {imageLoadingBefore && (
                                            <View className="absolute z-10">
                                                <ActivityIndicator size="small" color="#2563eb" />
                                            </View>
                                        )}
                                        {report.imageUrl ? (
                                            <Image
                                                source={{ uri: report.imageUrl }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                onLoadStart={() => setImageLoadingBefore(true)}
                                                onLoadEnd={() => setImageLoadingBefore(false)}
                                            />
                                        ) : (
                                            <FileWarning color="#94a3b8" size={32} />
                                        )}
                                    </View>
                                    <Text className="text-center text-xs font-bold text-slate-500 uppercase">Before</Text>
                                </View>

                                {/* After Image */}
                                <View className="flex-1">
                                    <View className="w-full relative justify-center items-center bg-slate-100 rounded-xl overflow-hidden mb-2 border border-slate-200" style={{ height: 160 }}>
                                        {imageLoadingAfter && (
                                            <View className="absolute z-10">
                                                <ActivityIndicator size="small" color="#2563eb" />
                                            </View>
                                        )}
                                        {report.afterImage ? (
                                            <Image
                                                source={{ uri: report.afterImage }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                onLoadStart={() => setImageLoadingAfter(true)}
                                                onLoadEnd={() => setImageLoadingAfter(false)}
                                            />
                                        ) : (
                                            <Text className="text-slate-400 text-xs">No image provided</Text>
                                        )}
                                    </View>
                                    <Text className="text-center text-xs font-bold text-green-600 uppercase">After</Text>
                                </View>
                            </View>
                        </View>

                        {/* Details Section */}
                        <View className="px-5 pb-5">
                            {/* Materials and Labor */}
                            <Text className="text-sm font-bold text-slate-800 mb-3 mt-2">Resource Statement</Text>
                            <View className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <View className="flex-row items-start mb-4">
                                    <Package color="#64748b" size={18} className="mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Materials Used</Text>
                                        <Text className="text-sm text-slate-800 font-medium">
                                            {report.materialsUsed || 'None specified'}
                                        </Text>
                                    </View>
                                </View>
                                <View className="h-[1px] bg-slate-200 mb-4 mx-2" />
                                <View className="flex-row items-center">
                                    <Clock color="#64748b" size={18} className="mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Labor Logged</Text>
                                        <Text className="text-sm text-slate-800 font-medium">
                                            {report.laborHours ? `${report.laborHours} hours` : 'Unknown'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* SLA Warning */}
                            {report.isLate && (
                                <View className="mt-4 bg-red-50 p-3 rounded-xl border border-red-200 flex-row items-center">
                                    <AlertTriangle color="#dc2626" size={20} className="mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-red-800 font-bold text-sm">SLA Breached</Text>
                                        <Text className="text-red-600 text-xs mt-1 leading-tight">
                                            This task was completed outside of the required SLA window. Ensure appropriate deductions are made if applicable.
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Fixed Action Footer */}
                    <View className="absolute bottom-0 w-full bg-white px-5 py-4 border-t border-slate-200">
                        <TouchableOpacity
                            className={`w-full py-4 rounded-xl flex-row justify-center items-center shadow-md ${closing ? 'bg-slate-400 shadow-none' : 'bg-green-600 shadow-green-600/30'}`}
                            onPress={handleVerifyAndClose}
                            disabled={closing}
                        >
                            {closing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg mr-2">Verify & Close Report</Text>
                                    <CheckCircle color="white" size={20} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

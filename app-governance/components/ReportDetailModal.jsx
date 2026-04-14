import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, Share, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { X, MapPin, Share2, PhoneCall } from 'lucide-react-native';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import API from '../services/api';

export default function ReportDetailModal({ visible, onClose, report, actionButton }) {
    const [imageLoading, setImageLoading] = useState(true);

    if (!report) return null;

    const handleRate = async (rating) => {
        try {
            await API.put(`/reports/rate/${report._id}`, { rating });
            if (rating === 1) {
                Alert.alert('Task Reopened', 'Because you rated this 1 star, the issue has been reopened and sent back to the officer queue.');
            } else {
                Alert.alert('Thank You', `You rated the work ${rating} stars.`);
            }
            onClose(); // Close modal, parent should refresh
        } catch (error) {
            console.error('Error rating:', error);
            Alert.alert('Error', 'Could not submit rating.');
        }
    };

    const getStepIndex = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending' || s === 'urgent') return 0;
        if (s === 'assigned') return 1;
        if (s === 'assigned_to_contractor' || s === 'completed_pending_review') return 2;
        if (s === 'resolved' || s === 'closed') return 3;
        return 0; // Default Report
    };

    const currentStepIndex = getStepIndex(report.status);
    const steps = ['REPORTED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED'];

    const handleShare = async () => {
        try {
            const locText = report.location?.latitude
                ? `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`
                : 'this location';

            const message = `I just reported a ${report.category} issue at ${locText} using the SmartCity App. Status: ${report.status}. Let's get this fixed! #SmartCity #Accountability ${report.imageUrl ? `\n\nProof: ${report.imageUrl}` : ''}`;

            await Share.share({ message });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

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

    const catDisplay = report.category === 'Road' || report.category === 'Water' || report.category === 'Electricity' ? `${report.category} Issue` : `${report.category}`;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/40 justify-end">
                <View className="bg-white h-[95%] overflow-hidden" style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, elevation: 20 }}>
                    
                    {/* Top Handle */}
                    <View className="items-center pt-4 pb-2">
                        <View className="w-16 h-1.5 bg-slate-200 rounded-full" />
                    </View>

                    {/* Close Button Floating top-right */}
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ position: 'absolute', top: 20, right: 20, zIndex: 50, backgroundColor: 'white', padding: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }}
                    >
                        <X color="#0f172a" size={24} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
                        
                        {/* Image Preview Card */}
                        <View className="w-full mt-4 bg-[#f8fafc] rounded-[32px] overflow-hidden justify-center items-center relative" style={{ height: 260 }}>
                            {report.imageUrl ? (
                                <Image
                                    source={{ uri: report.imageUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    onLoadStart={() => setImageLoading(true)}
                                    onLoadEnd={() => setImageLoading(false)}
                                />
                            ) : (
                                <Text className="text-slate-400 font-bold">No Image Available</Text>
                            )}
                            
                            {/* TICKET TAG */}
                            <View className="absolute top-4 left-4 bg-[#091557] px-4 py-2 rounded-full shadow-md">
                                <Text className="text-white text-xs font-bold tracking-wider">TICKET #{report._id.slice(-6).toUpperCase()}</Text>
                            </View>

                            {imageLoading && report.imageUrl && (
                                <View className="absolute z-10 bg-white/50 p-2 rounded-full">
                                    <ActivityIndicator size="small" color="#2563eb" />
                                </View>
                            )}
                        </View>

                        {/* Title & Desc */}
                        <View className="mt-6">
                            <Text className="text-[#ea580c] font-bold text-sm mb-2 tracking-wide">⚠️ {catDisplay}</Text>
                            <Text className="text-3xl font-[900] text-[#091557] leading-tight">{report.title}</Text>
                            <Text className="text-base text-[#475569] mt-3 leading-relaxed font-medium">{report.description}</Text>
                        </View>

                        {/* Progress Tracker */}
                        <View className="mt-8 bg-[#f8fafc] rounded-[32px] p-6 relative shadow-sm border border-slate-100">
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, position: 'relative' }}>
                                  {/* Track Line Background */}
                                  <View className="absolute top-[50%] left-[10%] right-[10%] h-1 bg-[#e2e8f0] z-0" style={{ transform: [{translateY: -0.5}] }} />
                                  {/* Track Line Active */}
                                  <View className="absolute top-[50%] left-[10%] h-1 bg-[#091557] z-0" style={{ width: `${(currentStepIndex / 3) * 80}%`, transform: [{translateY: -0.5}] }} />
                                  
                                  {steps.map((step, index) => {
                                      const isCompleted = index < currentStepIndex;
                                      const isCurrent = index === currentStepIndex;
                                      return (
                                          <View key={step} className="items-center z-10 w-1/4">
                                              <View
                                                  className={`w-10 h-10 rounded-full items-center justify-center 
                                                    ${isCompleted ? 'bg-[#091557]' : isCurrent ? 'bg-white border-[4px] border-[#091557]' : 'bg-[#e2e8f0]'}`}
                                              >
                                                  {isCompleted ? (
                                                      <Text className="text-white text-base font-bold">✓</Text>
                                                  ) : isCurrent ? (
                                                      <View className="w-3 h-3 rounded-full bg-[#fca5a5]" />
                                                  ) : (
                                                      <Text className="text-[#94a3b8] text-sm font-bold">{index + 1}</Text>
                                                  )}
                                              </View>
                                          </View>
                                      );
                                  })}
                             </View>
                             
                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0 }}>
                                {steps.map((step, index) => {
                                    const isActive = index <= currentStepIndex;
                                    return (
                                        <View key={'text-'+step} className="w-1/4 items-center">
                                            <Text className={`text-[9px] text-center font-bold tracking-wider pt-2 ${isActive ? 'text-[#091557]' : 'text-[#94a3b8]'}`}>
                                                {step}
                                            </Text>
                                        </View>
                                    );
                                })}
                             </View>
                        </View>

                        {/* REPORT DETAILS block */}
                        <Text className="text-[#091557] font-[900] text-sm uppercase tracking-wider mt-8 mb-4">REPORT DETAILS</Text>

                        {/* Map View */}
                        <View className="bg-[#f8fafc] rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm">
                            <View className="flex-row items-center mb-4">
                                <View className="bg-[#e0e7ff] p-2 rounded-full mr-3">
                                    <MapPin color="#3730a3" size={20} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Location</Text>
                                    <Text className="text-sm font-bold text-[#0f172a]">{report.location?.locality || 'Unavailable'}</Text>
                                </View>
                            </View>

                            {coordinate ? (
                                <View className="rounded-2xl overflow-hidden border border-slate-200 h-32 w-full">
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
                                <View className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-24 items-center justify-center w-full">
                                    <MapPin color="#94a3b8" size={24} className="mb-1" />
                                    <Text className="text-slate-500 font-medium text-xs">GPS Data Unavailable</Text>
                                </View>
                            )}
                        </View>

                        <View className="bg-[#f8fafc] rounded-3xl p-5 mb-6 border border-slate-100 shadow-sm flex-row items-center">
                             <View className="flex-1">
                                 <Text className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Date Reported</Text>
                                 <Text className="text-base text-[#0f172a] font-bold">
                                     {new Date(report.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'})}
                                 </Text>
                             </View>
                        </View>

                        {/* After Image (if applicable) */}
                        {report.afterImage && (
                             <View className="mb-6">
                                 <Text className="text-[#091557] font-[900] text-sm uppercase tracking-wider mb-4">COMPLETION PROOF</Text>
                                 <View className="w-full bg-[#f8fafc] rounded-[32px] overflow-hidden justify-center items-center relative border border-slate-100 shadow-sm" style={{ height: 200 }}>
                                    <Image
                                        source={{ uri: report.afterImage }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                    <View className="absolute bottom-4 right-4 bg-green-600/80 px-4 py-1.5 rounded-full shadow-sm">
                                        <Text className="text-white text-xs font-bold tracking-wider">RESOLVED</Text>
                                    </View>
                                </View>
                             </View>
                        )}

                        {/* Rating UI for Closed Reports */}
                        {report.status === 'closed' && !report.rating && (
                            <View className="bg-amber-50 p-6 rounded-[32px] border border-amber-200 mb-6 flex-col">
                                <Text className="text-amber-800 font-[900] text-lg mb-2">Rate this Work</Text>
                                <Text className="text-amber-700 text-sm font-medium mb-4">Your feedback helps hold contractors accountable. Rate 1 star to reopen.</Text>
                                <View className="flex-row justify-between px-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => handleRate(star)}
                                            className="p-2 bg-white rounded-full shadow-sm"
                                        >
                                            <Text className="text-2xl">{star === 1 ? '😡' : star === 2 ? '☹️' : star === 3 ? '😐' : star === 4 ? '🙂' : '🤩'}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                        
                        {report.rating && (
                            <View className="bg-green-50 p-6 rounded-[32px] border border-green-200 mb-6 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-green-800 font-[900] text-lg">You rated this work</Text>
                                    <Text className="text-green-600 font-bold mt-1">{report.rating === 1 ? 'Reopened' : `${report.rating} Stars`}</Text>
                                </View>
                                <Text className="text-4xl">{report.rating === 1 ? '😡' : report.rating === 2 ? '☹️' : report.rating === 3 ? '😐' : report.rating === 4 ? '🙂' : '🤩'}</Text>
                            </View>
                        )}

                        {/* Social Share Button */}
                        <TouchableOpacity
                            className="bg-blue-50 py-4 rounded-full flex-row items-center justify-center border border-blue-200"
                            onPress={handleShare}
                        >
                            <Share2 color="#2563eb" size={20} className="mr-2" />
                            <Text className="text-blue-700 font-bold text-base">Share to Social Media</Text>
                        </TouchableOpacity>

                        {/* Action Button spacer */}
                        {actionButton && (
                            <View className="mt-4">
                                {actionButton}
                            </View>
                        )}

                    </ScrollView>
                    


                </View>
            </View>
        </Modal>
    );
}

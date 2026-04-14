import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    Alert, Platform, ActionSheetIOS,
} from 'react-native';
import { Navigation, Camera, MapPin, Activity, CheckCircle2, Image as ImageIcon } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import API from '../services/api';

// ─── Haversine distance (meters) ─────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rL1 = (lat1 * Math.PI) / 180;
    const rL2 = (lat2 * Math.PI) / 180;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rL1) * Math.cos(rL2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Camera-OR-Gallery picker (cross-platform) ───────────────────────────────
async function pickImage() {
    return new Promise((resolve) => {
        const launch = async (source) => {
            try {
                let result;
                if (source === 'camera') {
                    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
                    if (!granted) {
                        Alert.alert('Permission Required', 'Please allow camera access to take a verification photo.');
                        return resolve(null);
                    }
                    result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.6,
                    });
                } else {
                    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!granted) {
                        Alert.alert('Permission Required', 'Please allow gallery access to select a photo.');
                        return resolve(null);
                    }
                    result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.6,
                    });
                }
                if (!result.canceled && result.assets?.length > 0) {
                    resolve(result.assets[0].uri);
                } else {
                    resolve(null);
                }
            } catch (err) {
                console.error('Image picker error:', err);
                resolve(null);
            }
        };

        if (Platform.OS === 'ios') {
            // iOS native action sheet
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', '📷  Take Photo', '🖼️  Choose from Gallery'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) launch('camera');
                    else if (buttonIndex === 2) launch('gallery');
                    else resolve(null);
                }
            );
        } else {
            // Android: use Alert as action sheet
            Alert.alert(
                'Upload Photo',
                'Choose how to upload your completion photo',
                [
                    { text: '📷  Take Photo', onPress: () => launch('camera') },
                    { text: '🖼️  Choose from Gallery', onPress: () => launch('gallery') },
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
                ],
                { cancelable: true, onDismiss: () => resolve(null) }
            );
        }
    });
}

// ─── Status config ────────────────────────────────────────────────────────────
function getStatusConfig(distance) {
    if (distance === null) return { label: 'Calculating…', color: '#94a3b8', dot: '#94a3b8', bg: '#f1f5f9' };
    if (distance <= 50) return { label: `Within Range (${Math.round(distance)}m)`, color: '#16a34a', dot: '#22c55e', bg: '#f0fdf4' };
    return { label: `${Math.round(distance)}m away`, color: '#d97706', dot: '#f59e0b', bg: '#fffbeb' };
}

// ─── Category color config ────────────────────────────────────────────────────
function getCategoryStyle(category) {
    const map = {
        Water:       { bg: '#e0f2fe', text: '#0369a1' },
        Road:        { bg: '#fef9c3', text: '#92400e' },
        Waste:       { bg: '#f3e8ff', text: '#7e22ce' },
        Electricity: { bg: '#fef3c7', text: '#b45309' },
        Other:       { bg: '#f1f5f9', text: '#475569' },
    };
    return map[category] || map.Other;
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function ContractorTaskCard({ task, onRefresh, accentColor = '#2d3b8e' }) {
    const [distance, setDistance]         = useState(null);
    const [uploading, setUploading]       = useState(false);
    const [locationError, setLocationError] = useState(null);

    useEffect(() => {
        let sub;
        const start = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') { setLocationError('Location permission denied'); return; }

                sub = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                    ({ coords: { latitude, longitude } }) => {
                        const { latitude: tLat, longitude: tLng } = task.location || {};
                        if (tLat && tLng) setDistance(getDistance(latitude, longitude, tLat, tLng));
                    }
                );
            } catch (e) {
                setLocationError('Could not track location');
            }
        };

        if (task.location?.latitude && task.location?.longitude) start();
        return () => sub?.remove();
    }, [task]);

    const handleNavigate = () => {
        const { latitude, longitude } = task.location || {};
        if (latitude && longitude) {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
                .catch(() => Alert.alert('Error', 'Could not open Google Maps.'));
        } else {
            Alert.alert('Error', 'Location coordinates not available.');
        }
    };

    const handleMarkResolved = async () => {
        if (distance === null || distance > 50) {
            Alert.alert('Too Far Away', `You must be within 50 meters of the task location to mark it as resolved.\n\nCurrent distance: ${distance ? Math.round(distance) + 'm' : 'unknown'}`);
            return;
        }

        // Show Camera / Gallery picker
        const uri = await pickImage();
        if (!uri) return; // user cancelled

        uploadPhoto(uri);
    };

    const uploadPhoto = async (uri) => {
        setUploading(true);
        try {
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            const formData = new FormData();
            formData.append('image', { uri, name: filename, type });

            const uploadResponse = await API.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedUrl = uploadResponse.data.secure_url;
            if (!uploadedUrl) throw new Error('Upload response missing secure_url');

            router.push({
                pathname: '/resource_form',
                params: { reportId: task._id, afterImage: uploadedUrl },
            });
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Upload Failed', 'Failed to upload the photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const isDisabled = distance === null || distance > 50 || uploading;
    const statusCfg  = getStatusConfig(distance);
    const catStyle   = getCategoryStyle(task.category);

    return (
        <View style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 18,
            marginBottom: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f1f5f9',
        }}>
            {/* ── Header row ─────────────────────────────────── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                {/* Category chip */}
                <View style={{ backgroundColor: catStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ color: catStyle.text, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        {task.category}
                    </Text>
                </View>

                {/* Status dot + label */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: statusCfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusCfg.dot, marginRight: 6 }} />
                    <Text style={{ color: statusCfg.color, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>
                        {distance === null ? 'LOCATING' : distance <= 50 ? 'WITHIN RANGE' : 'OUT OF RANGE'}
                    </Text>
                </View>
            </View>

            {/* ── Title ──────────────────────────────────────── */}
            <Text style={{ color: '#0f172a', fontSize: 17, fontWeight: '900', marginBottom: 4, lineHeight: 23 }}>
                {task.title}
            </Text>
            {task.description ? (
                <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500', marginBottom: 12, lineHeight: 18 }} numberOfLines={2}>
                    {task.description}
                </Text>
            ) : null}

            {/* ── Location row ───────────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <MapPin size={13} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={{ color: '#475569', fontSize: 12, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                    {task.location?.locality || 'Unknown Location'} – {task.location?.zone || 'Unknown Zone'}
                </Text>
            </View>

            {/* ── Distance bar ───────────────────────────────── */}
            {distance !== null && (
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: statusCfg.bg,
                    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
                    marginBottom: 14,
                }}>
                    <Activity size={14} color={statusCfg.color} style={{ marginRight: 8 }} />
                    <Text style={{ color: statusCfg.color, fontSize: 12, fontWeight: '700' }}>
                        {statusCfg.label}
                    </Text>
                </View>
            )}

            {locationError && (
                <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600', marginBottom: 10, textAlign: 'center' }}>
                    {locationError}
                </Text>
            )}

            {/* ── Action Buttons ─────────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Navigate */}
                <TouchableOpacity
                    onPress={handleNavigate}
                    style={{
                        flex: 1,
                        backgroundColor: '#f1f5f9',
                        borderRadius: 999,
                        paddingVertical: 13,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                    }}
                >
                    <Navigation size={15} color="#475569" />
                    <Text style={{ color: '#334155', fontWeight: '800', fontSize: 13 }}>Navigate</Text>
                </TouchableOpacity>

                {/* Mark Resolved */}
                <TouchableOpacity
                    onPress={handleMarkResolved}
                    disabled={isDisabled}
                    style={{
                        flex: 1.4,
                        backgroundColor: isDisabled ? '#cbd5e1' : accentColor,
                        borderRadius: 999,
                        paddingVertical: 13,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                        shadowColor: accentColor,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDisabled ? 0 : 0.25,
                        shadowRadius: 8,
                        elevation: isDisabled ? 0 : 4,
                    }}
                >
                    {uploading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <>
                            <CheckCircle2 size={15} color="white" />
                            <Text style={{ color: 'white', fontWeight: '900', fontSize: 13 }}>Mark Resolved</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { ArrowLeft, Info, Camera, Image as ImageIcon, Navigation, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import API from '../services/api';
import { identifyAMCZone } from '../utils/zoneMapper';

export default function CreateReport() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(null);
    const [location, setLocation] = useState(null);
    const [imageUri, setImageUri] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;
                let currentPos = await Location.getCurrentPositionAsync({});
                if (isMounted) {
                    const coords = { latitude: currentPos.coords.latitude, longitude: currentPos.coords.longitude };
                    try {
                        let geocode = await Location.reverseGeocodeAsync(coords);
                        if (geocode && geocode.length > 0) {
                            const addressObj = geocode[0];
                            const zone = identifyAMCZone(addressObj);
                            const locality = addressObj.subregion || addressObj.district || addressObj.name || 'Unknown Area';
                            setLocation({ ...coords, locality, zone });
                        } else {
                            setLocation(coords);
                        }
                    } catch (err) {
                        setLocation(coords);
                    }
                }
            } catch (err) {
                console.error(err);
                Alert.alert(
                    "Location Services Disabled",
                    "Please turn on your device's location to automatically detect your ward."
                );
            }
        })();
        return () => { isMounted = false; };
    }, []);

    const pickImage = async (useCamera = false) => {
        try {
            const { status } = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;
            const result = useCamera ? await ImagePicker.launchCameraAsync({ quality: 0.8 }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
            if (!result.canceled && result.assets) setImageUri(result.assets[0].uri);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        if (!title || !description || !category || !location || !imageUri) {
            Alert.alert('Incomplete', 'Please fill all details, select a category, attach a photo, and wait for location.');
            return;
        }
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('image', { uri: imageUri, name: 'report.jpg', type: 'image/jpeg' });
            const uploadRes = await API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            
            await API.post('/reports/create', {
                title: title.trim(),
                description: description.trim(),
                category,
                location,
                imageUrl: uploadRes.data.secure_url
            });

            Alert.alert('Success', 'Report submitted successfully!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { id: 'Waste', label: 'Garbage', icon: '🗑️' },
        { id: 'Electricity', label: 'Lighting', icon: '💡' },
        { id: 'Road', label: 'Roads', icon: '🛣️' },
        { id: 'Water', label: 'Water', icon: '💧' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <SafeAreaView style={{ backgroundColor: '#2d3b8e', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Report New Issue</Text>
                    <TouchableOpacity style={{ padding: 4 }}>
                        <Info color="white" size={24} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Progress Bar */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ea580c', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>STEP 1 OF 3</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: '#091557' }}>Basic Details</Text>
                        <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>33% Complete</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <View style={{ width: '33%', height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 }} />
                    </View>
                </View>

                {/* Select Category */}
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>Select Category</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                    {categories.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 16,
                                    borderRadius: 32,
                                    backgroundColor: isSelected ? '#091557' : 'white',
                                    borderWidth: 1,
                                    borderColor: isSelected ? '#091557' : '#e2e8f0',
                                    shadowColor: isSelected ? '#091557' : 'transparent',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: isSelected ? 0.3 : 0,
                                    shadowRadius: 8,
                                    elevation: isSelected ? 4 : 0
                                }}
                                onPress={() => setCategory(cat.id)}
                            >
                                <Text style={{ fontSize: 16, marginRight: 8 }}>{cat.icon}</Text>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: isSelected ? 'white' : '#0f172a' }}>{cat.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Issue Details */}
                <View style={{ backgroundColor: '#f4f5f9', borderRadius: 20, padding: 16, marginBottom: 16 }}>
                    <TextInput
                        style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', paddingVertical: 4 }}
                        placeholder="Issue Title"
                        placeholderTextColor="#64748b"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={{ backgroundColor: '#f4f5f9', borderRadius: 20, padding: 16, marginBottom: 32, minHeight: 120 }}>
                    <TextInput
                        style={{ fontSize: 16, fontWeight: '500', color: '#0f172a', paddingTop: 0 }}
                        placeholder="Problem Description"
                        placeholderTextColor="#64748b"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Add Proof */}
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>Add Proof</Text>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'white', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => pickImage(true)}
                    >
                        <View style={{ backgroundColor: '#e0e7ff', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                            <Camera color="#2d3b8e" size={24} />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: 'white', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => pickImage(false)}
                    >
                        <View style={{ backgroundColor: '#ffedd5', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                            <ImageIcon color="#ea580c" size={24} />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                {imageUri && (
                    <View style={{ marginBottom: 32, position: 'relative' }}>
                        <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 24 }} contentFit="cover" />
                        <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 }} onPress={() => setImageUri(null)}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Location */}
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>Location</Text>
                <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2, marginBottom: 40 }}>
                    <View style={{ width: 64, height: 64, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                        <MapPin color="#ea580c" size={28} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#ea580c', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>DETECTED AREA</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#091557', marginBottom: 2 }}>{location?.locality || 'Locating...'}</Text>
                        <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>{location ? `Nearby: ${location.zone || 'Unknown'} Zone` : 'Fetching GPS coordinates...'}</Text>
                    </View>
                    <Navigation color="#0f172a" size={24} />
                </View>

            </ScrollView>

            {/* Submit Button */}
            <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 24, backgroundColor: '#f9fafb' }}>
                <TouchableOpacity
                    style={{ backgroundColor: '#2d3b8e', height: 64, borderRadius: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#2d3b8e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, opacity: isSubmitting ? 0.7 : 1 }}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                >
                    {isSubmitting ? <ActivityIndicator color="white" style={{ marginRight: 8 }} /> : null}
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginRight: 8 }}>Submit Report</Text>
                    <Navigation color="white" size={20} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

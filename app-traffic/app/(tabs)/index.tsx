import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Marker, Region, MapPressEvent, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import io from 'socket.io-client';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Socket Configuration
const SOCKET_URL = 'http://10.42.96.103:5000';
const socket = io(SOCKET_URL);

// Types
interface RoadBlock {
  _id: string;
  title: string;
  description?: string;
  expectedEndDate: string;
  location: {
    type: string;
    coordinates: [number, number][]; // [lng, lat]
  };
}

interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  role: string;
}

// Constants
const AHMEDABAD_COORDS: Region = {
  latitude: 23.0225,
  longitude: 72.5714,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function RoadPulseMap() {
  const [location, setLocation] = useState<Region | null>(null);
  const [roadBlocks, setRoadBlocks] = useState<RoadBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherUsers, setOtherUsers] = useState<{ [key: string]: UserLocation }>({});
  
  // Real-Time Role and Auth
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userRole');
    router.replace('/(auth)/login' as any);
  };
  
  // Contractor Mode State
  const [isConstructionMode, setIsConstructionMode] = useState(false);
  const [tempPoints, setTempPoints] = useState<LatLng[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [blockTitle, setBlockTitle] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Fetch Position & Blocks
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      // Get User Info
      const role = await AsyncStorage.getItem('userRole');
      const storedUserId = 'user_' + Math.random().toString(36).substr(2, 9); // For now generate unique ID per session
      setUserRole(role);
      setUserId(storedUserId);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to see the map.');
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      fetchRoadBlocks();

      // Live GPS Stream - Watch position every 5 seconds
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          
          // Emit location if role is Ambulance Driver
          if (role === 'Ambulance Driver') {
            socket.emit('update_location', {
              latitude,
              longitude,
              userId: storedUserId,
              role: role
            });
          }
        }
      );
    })();

    // Listen for global map updates
    socket.on('location_received', (data: UserLocation) => {
      if (data.userId !== userId) {
        setOtherUsers(prev => ({
          ...prev,
          [data.userId]: data
        }));
      }
    });

    return () => {
      if (locationSubscription) locationSubscription.remove();
      socket.off('location_received');
    };
  }, []);

  const fetchRoadBlocks = async () => {
    try {
      setLoading(true);
      const response = await API.get('/traffic/blocks');
      setRoadBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    if (!isConstructionMode) return;

    const newPoint = e.nativeEvent.coordinate;
    const updatedPoints = [...tempPoints, newPoint];
    setTempPoints(updatedPoints);

    if (updatedPoints.length === 2) {
      setModalVisible(true);
    }
  };

  const submitRoadBlock = async () => {
    if (!blockTitle || !expectedDate) {
      Alert.alert('Missing Info', 'Please enter a title and expected end date.');
      return;
    }

    try {
      const formattedCoords = tempPoints.map(p => [p.longitude, p.latitude]); // GeoJSON format [lng, lat]
      await API.post('/traffic/block', {
        title: blockTitle,
        description: "Road construction reported via RoadPulse",
        expectedEndDate: expectedDate,
        coordinates: formattedCoords,
        userId: '65f1a2b3c4d5e6f7a8b9c0d1', // Valid-format 24-char Hex ObjectId
      });
      
      Alert.alert('Success', 'Road block reported successfully.');
      setModalVisible(false);
      setIsConstructionMode(false);
      setTempPoints([]);
      setBlockTitle('');
      setExpectedDate('');
      fetchRoadBlocks();
    } catch (error: any) {
      console.error('Submission Error:', error.response || error);
      const errorMsg = error.response?.data?.message || error.message || 'Check your network connection.';
      Alert.alert('Submission Failed', errorMsg);
    }
  };

  // Mock Active Users (Vehicles) - Replaced by real-time otherUsers

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={AHMEDABAD_COORDS}
        region={location || undefined}
        onPress={handleMapPress}
        showsUserLocation
        customMapStyle={darkMapStyle}
      >
        {/* Render Existing Blocks */}
        {roadBlocks.map((block) => (
          <Polyline
            key={block._id}
            coordinates={block.location.coordinates.map(coord => ({
              longitude: coord[0],
              latitude: coord[1],
            }))}
            strokeColor="#FF0000"
            strokeWidth={5}
            lineDashPattern={[5, 5]}
          />
        ))}

        {/* Render Temporary Polyline (Draft) */}
        {tempPoints.length > 0 && (
          <Polyline
            coordinates={tempPoints}
            strokeColor="#FF8C00"
            strokeWidth={4}
          />
        )}

        {/* Real-Time User Markers */}
        {Object.values(otherUsers).map((user) => (
          <Marker 
            key={user.userId} 
            coordinate={{ latitude: user.latitude, longitude: user.longitude }}
            flat={user.role !== 'Ambulance'}
          >
            <View style={user.role === 'Ambulance' ? styles.ambulanceMarker : styles.dotMarker}>
              <MaterialCommunityIcons 
                name={user.role === 'Ambulance' ? 'ambulance' : 'circle'} 
                size={user.role === 'Ambulance' ? 30 : 12} 
                color={user.role === 'Ambulance' ? '#FF3D00' : '#00E5FF'} 
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Controls */}
      <View style={styles.topControls}>
         <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#FF8C00" />
         </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        {userRole === 'Contractor' && (
          <TouchableOpacity
            style={[styles.modeButton, isConstructionMode && styles.modeButtonActive]}
            onPress={() => {
              setIsConstructionMode(!isConstructionMode);
              setTempPoints([]);
            }}
          >
            <MaterialCommunityIcons name="hard-hat" size={24} color={isConstructionMode ? "#FFF" : "#FF8C00"} />
            <Text style={[styles.modeText, isConstructionMode && styles.modeTextActive]}>
              {isConstructionMode ? 'STOP DRAWING' : 'CONSTRUCTION MODE'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submission Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Road Block</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Title (e.g. Pipeline Repair)"
              placeholderTextColor="#888"
              value={blockTitle}
              onChangeText={setBlockTitle}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Expected End Date (YYYY-MM-DD)"
              placeholderTextColor="#888"
              value={expectedDate}
              onChangeText={setExpectedDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]} 
                onPress={() => {
                  setModalVisible(false);
                  setTempPoints([]);
                }}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.btn, styles.submitBtn]} onPress={submitRoadBlock}>
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  iconButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  modeButtonActive: {
    backgroundColor: '#FF8C00',
  },
  modeText: {
    color: '#FF8C00',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modeTextActive: {
    color: '#FFF',
  },
  vehicleMarker: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00E5FF',
  },
  ambulanceMarker: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 5,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF3D00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotMarker: {
    backgroundColor: 'rgba(0, 229, 255, 0.3)',
    padding: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    width: '85%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 0.45,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#444',
  },
  submitBtn: {
    backgroundColor: '#FF8C00',
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

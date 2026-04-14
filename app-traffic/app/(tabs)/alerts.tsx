import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="bell-outline" size={80} color="#FF8C00" />
      <Text style={styles.title}>No New Alerts</Text>
      <Text style={styles.subtitle}>Real-time traffic updates will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

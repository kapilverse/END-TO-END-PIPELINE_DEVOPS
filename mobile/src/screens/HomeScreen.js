import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';

const SERVICES = [
  { id: '1', name: 'Plumbing', icon: '🔧', color: '#E3F2FD' },
  { id: '2', name: 'Electrician', icon: '⚡', color: '#FFF3E0' },
  { id: '3', name: 'Cleaning', icon: '🧹', color: '#F3E5F5' },
  { id: '4', name: 'AC Repair', icon: '❄️', color: '#E8F5E9' },
];

export default function HomeScreen() {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Find Local Services</Text>
        <Text style={styles.subGreeting}>What do you need help with today?</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput 
          placeholder="Search for services..." 
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList 
        data={SERVICES}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.serviceCard, { backgroundColor: item.color }]}>
            <Text style={styles.serviceIcon}>{item.icon}</Text>
            <Text style={styles.serviceName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.promoCard}>
        <Text style={styles.promoText}>50% Off on first cleaning!</Text>
        <TouchableOpacity style={styles.promoButton}>
          <Text style={styles.promoButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  subGreeting: { fontSize: 16, color: '#666', marginTop: 5 },
  searchBar: { 
    backgroundColor: '#f5f5f5', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 25 
  },
  searchInput: { fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  serviceCard: {
    flex: 1,
    margin: 8,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2
  },
  serviceIcon: { fontSize: 32, marginBottom: 10 },
  serviceName: { fontSize: 16, fontWeight: '600' },
  promoCard: {
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 25,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  promoText: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  promoButton: { backgroundColor: '#fff', padding: 10, borderRadius: 10 },
  promoButtonText: { fontWeight: 'bold' }
});

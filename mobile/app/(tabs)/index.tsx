import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { config } from '../../src/lib/config';
import { PawPrint, Calendar, FileText, Video, LogOut } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.name || 'User'}</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/pets')}>
            <PawPrint size={32} color={config.colors.primary} />
            <Text style={styles.cardTitle}>My Pets</Text>
            <Text style={styles.cardDesc}>Manage your pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/appointments')}>
            <Calendar size={32} color={config.colors.primary} />
            <Text style={styles.cardTitle}>Book Visit</Text>
            <Text style={styles.cardDesc}>Schedule appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/records')}>
            <FileText size={32} color={config.colors.primary} />
            <Text style={styles.cardTitle}>Medical Records</Text>
            <Text style={styles.cardDesc}>View history</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/live')}>
            <Video size={32} color={config.colors.primary} />
            <Text style={styles.cardTitle}>Live Camera</Text>
            <Text style={styles.cardDesc}>Watch your pet</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={config.colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: config.colors.primary,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  cardDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: config.colors.error,
    fontWeight: '600',
  },
});
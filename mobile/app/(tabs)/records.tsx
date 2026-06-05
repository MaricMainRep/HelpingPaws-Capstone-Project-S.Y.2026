import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useHealthRecords, usePrescriptions, useVaccinations } from '../../src/hooks/useApi';
import { config } from '../../src/lib/config';
import { FileText, Pill, Syringe, Activity, ChevronRight, Calendar } from 'lucide-react-native';
import { HealthRecord, Prescription, Vaccination } from '../../src/types';

export default function RecordsScreen() {
  const [tab, setTab] = useState<'records' | 'medications' | 'vaccinations'>('records');
  const { records, loading: loadingRecords } = useHealthRecords();
  const { prescriptions, loading: loadingMeds } = usePrescriptions();
  const { vaccinations, loading: loadingVacc } = useVaccinations();

  const tabs = [
    { key: 'records', label: 'Health Records', icon: Activity },
    { key: 'medications', label: 'Medications', icon: Pill },
    { key: 'vaccinations', label: 'Vaccinations', icon: Syringe },
  ] as const;

  const loading = loadingRecords || loadingMeds || loadingVacc;

  function renderRecord({ item }: { item: HealthRecord }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={20} color={config.colors.primary} />
          <Text style={styles.cardDate}>{item.created_at?.split('T')[0]}</Text>
        </View>
        <Text style={styles.petName}>{item.pets?.name}</Text>
        {item.diagnosis && <Text style={styles.cardTitle}>{item.diagnosis}</Text>}
        {item.treatment && <Text style={styles.cardText}>{item.treatment}</Text>}
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      </View>
    );
  }

  function renderPrescription({ item }: { item: Prescription }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Pill size={20} color={config.colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{item.medication_name}</Text>
        {item.dosage && <Text style={styles.cardText}>Dosage: {item.dosage}</Text>}
        {item.duration && <Text style={styles.cardText}>Duration: {item.duration}</Text>}
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      </View>
    );
  }

  function renderVaccination({ item }: { item: Vaccination }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Syringe size={20} color={config.colors.primary} />
          <Text style={styles.cardDate}>{item.date_given}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.vaccine_name}</Text>
        {item.next_due_date && (
          <View style={styles.dueDate}>
            <Calendar size={14} color="#666" />
            <Text style={styles.dueText}>Next: {item.next_due_date}</Text>
          </View>
        )}
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={config.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key as any)}
          >
            <t.icon size={18} color={tab === t.key ? config.colors.primary : '#666'} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'records' && (
        <FlatList
          data={records}
          keyExtractor={item => item.id.toString()}
          renderItem={renderRecord}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FileText size={48} color="#ddd" />
              <Text style={styles.emptyText}>No health records</Text>
            </View>
          }
        />
      )}

      {tab === 'medications' && (
        <FlatList
          data={prescriptions}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPrescription}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Pill size={48} color="#ddd" />
              <Text style={styles.emptyText}>No prescriptions</Text>
            </View>
          }
        />
      )}

      {tab === 'vaccinations' && (
        <FlatList
          data={vaccinations}
          keyExtractor={item => item.id.toString()}
          renderItem={renderVaccination}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Syringe size={48} color="#ddd" />
              <Text style={styles.emptyText}>No vaccinations</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#f0f5f3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  tabTextActive: {
    color: config.colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
  notes: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  petName: {
    fontSize: 14,
    color: config.colors.primary,
    marginBottom: 4,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dueText: {
    fontSize: 12,
    color: '#666',
  },
  empty: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
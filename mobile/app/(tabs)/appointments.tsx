import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAppointments, usePets, useStaff } from '../../src/hooks/useApi';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { config } from '../../src/lib/config';
import { Plus, Calendar, Clock, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { Appointment, Pet, Staff as StaffType } from '../../src/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#22c55e',
  REJECTED: '#ef4444',
  COMPLETED: '#3a7d6c',
  CANCELLED: '#6b7280',
};

export default function AppointmentsScreen() {
  const { appointments, loading, createAppointment, cancelAppointment } = useAppointments();
  const { pets } = usePets();
  const { staff } = useStaff();
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffType | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setSelectedPet(null);
    setSelectedStaff(null);
    setDate('');
    setTime('');
    setNotes('');
  }

  async function handleSubmit() {
    if (!selectedPet || !date || !time) {
      Alert.alert('Error', 'Please select pet, date and time');
      return;
    }
    setSubmitting(true);
    try {
      await createAppointment({
        pet_id: selectedPet.id,
        staff_id: selectedStaff?.id,
        appointment_date: date,
        start_time: time,
        end_time: time,
        notes: notes || undefined,
      });
      setModalVisible(false);
      resetForm();
    } catch (err) {
      Alert.alert('Error', 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(appointment: Appointment) {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => cancelAppointment(appointment.id) },
    ]);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle size={16} color={STATUS_COLORS.CONFIRMED} />;
      case 'REJECTED': return <XCircle size={16} color={STATUS_COLORS.REJECTED} />;
      case 'PENDING': return <AlertCircle size={16} color={STATUS_COLORS.PENDING} />;
      default: return null;
    }
  }

  function renderAppointment({ item }: { item: Appointment }) {
    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentDate}>
            <Calendar size={20} color={config.colors.primary} />
            <Text style={styles.dateText}>{item.appointment_date}</Text>
          </View>
          <View style={styles.statusBadge}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.appointmentDetails}>
          <Text style={styles.petName}>{item.pets?.name}</Text>
          <View style={styles.timeRow}>
            <Clock size={14} color="#666" />
            <Text style={styles.timeText}>{item.start_time}</Text>
          </View>
          {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
        </View>

        {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
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
      <FlatList
        data={appointments}
        keyExtractor={item => item.id.toString()}
        renderItem={renderAppointment}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Calendar size={48} color="#ddd" />
            <Text style={styles.emptyText}>No appointments</Text>
            <Text style={styles.emptySubtext}>Book your first appointment</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Select Pet *</Text>
            <View style={styles.optionsGrid}>
              {pets.map(pet => (
                <TouchableOpacity
                  key={pet.id}
                  style={[styles.option, selectedPet?.id === pet.id && styles.optionSelected]}
                  onPress={() => setSelectedPet(pet)}
                >
                  <Text style={[styles.optionText, selectedPet?.id === pet.id && styles.optionTextSelected]}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Select Veterinarian</Text>
            <View style={styles.optionsGrid}>
              <TouchableOpacity
                style={[styles.option, !selectedStaff && styles.optionSelected]}
                onPress={() => setSelectedStaff(null)}
              >
                <Text style={[styles.optionText, !selectedStaff && styles.optionTextSelected]}>
                  Any Available
                </Text>
              </TouchableOpacity>
              {staff.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.option, selectedStaff?.id === s.id && styles.optionSelected]}
                  onPress={() => setSelectedStaff(s)}
                >
                  <Text style={[styles.optionText, selectedStaff?.id === s.id && styles.optionTextSelected]}>
                    {s.users?.name || 'Staff'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Date *" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            <Input label="Time *" value={time} onChangeText={setTime} placeholder="HH:MM" />
            <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Reason for visit..." />

            <Button
              title={submitting ? '' : 'Book Appointment'}
              onPress={handleSubmit}
              loading={submitting}
            />
          </ScrollView>
        </View>
      </Modal>
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
  list: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    gap: 4,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: config.colors.error,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: config.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: config.colors.primary,
    borderColor: config.colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
});
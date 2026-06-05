import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { usePets } from '../../src/hooks/useApi';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { config } from '../../src/lib/config';
import { Plus, Pencil, Trash2, PawPrint, X } from 'lucide-react-native';
import { Pet } from '../../src/types';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Other'];

export default function PetsScreen() {
  const { pets, loading, createPet, updatePet, deletePet } = usePets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  function openModal(pet?: Pet) {
    if (pet) {
      setEditingPet(pet);
      setName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed || '');
      setAge(pet.age?.toString() || '');
      setWeight(pet.weight?.toString() || '');
      setNotes(pet.medical_history_notes || '');
    } else {
      setEditingPet(null);
      setName('');
      setSpecies('');
      setBreed('');
      setAge('');
      setWeight('');
      setNotes('');
    }
    setModalVisible(true);
  }

  async function handleSubmit() {
    if (!name.trim() || !species.trim()) {
      Alert.alert('Error', 'Name and species are required');
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        species: species.trim(),
        breed: breed.trim() || undefined,
        age: age ? parseInt(age) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        medical_history_notes: notes.trim() || undefined,
      };
      if (editingPet) {
        await updatePet(editingPet.id, data);
      } else {
        await createPet(data);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save pet');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(pet: Pet) {
    Alert.alert('Delete Pet', `Are you sure you want to delete ${pet.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePet(pet.id) },
    ]);
  }

  function renderPet({ item }: { item: Pet }) {
    return (
      <View style={styles.petCard}>
        <View style={styles.petIcon}>
          <PawPrint size={32} color={config.colors.primary} />
        </View>
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petDetails}>{item.species}{item.breed ? ` • ${item.breed}` : ''}</Text>
          <Text style={styles.petMeta}>
            {item.age ? `${item.age} years` : 'Age unknown'}
            {item.weight ? ` • ${item.weight} kg` : ''}
          </Text>
        </View>
        <View style={styles.petActions}>
          <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
            <Pencil size={20} color={config.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Trash2 size={20} color={config.colors.error} />
          </TouchableOpacity>
        </View>
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
        data={pets}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPet}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <PawPrint size={48} color="#ddd" />
            <Text style={styles.emptyText}>No pets yet</Text>
            <Text style={styles.emptySubtext}>Add your first pet to get started</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingPet ? 'Edit Pet' : 'Add Pet'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Input label="Name *" value={name} onChangeText={setName} placeholder="Pet name" />
            
            <Input label="Species *" value={species} onChangeText={setSpecies} placeholder="e.g., Dog, Cat" />
            
            <Input label="Breed" value={breed} onChangeText={setBreed} placeholder="Breed (optional)" />
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input label="Age" value={age} onChangeText={setAge} placeholder="Years" keyboardType="numeric" />
              </View>
              <View style={styles.halfInput}>
                <Input label="Weight" value={weight} onChangeText={setWeight} placeholder="kg" keyboardType="numeric" />
              </View>
            </View>

            <Input label="Medical Notes" value={notes} onChangeText={setNotes} placeholder="Any medical conditions..." />

            <Button
              title={submitting ? '' : editingPet ? 'Save Changes' : 'Add Pet'}
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>
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
  petCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  petIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  petMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  petActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});
import 'package:flutter/material.dart';
import '../../core/config.dart';
import '../../services/api_service.dart';
import '../../models/pet.dart';

class PetsScreen extends StatefulWidget {
  const PetsScreen({super.key});

  @override
  State<PetsScreen> createState() => _PetsScreenState();
}

class _PetsScreenState extends State<PetsScreen> {
  final _apiService = ApiService();
  List<Pet> _pets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadPets();
  }

  Future<void> _loadPets() async {
    setState(() => _loading = true);
    try {
      final data = await _apiService.getPets();
      setState(() {
        _pets = data.map((json) => Pet.fromJson(json)).toList();
        _loading = false;
      });
    } catch (e) {
      debugPrint('Error loading pets: $e');
      setState(() => _loading = false);
    }
  }

  void _showAddEditDialog([Pet? pet]) {
    final nameController = TextEditingController(text: pet?.name ?? '');
    final speciesController = TextEditingController(text: pet?.species ?? '');
    final breedController = TextEditingController(text: pet?.breed ?? '');
    final ageController = TextEditingController(
      text: pet?.age?.toString() ?? '',
    );
    final weightController = TextEditingController(
      text: pet?.weight?.toString() ?? '',
    );
    final notesController = TextEditingController(
      text: pet?.medicalHistoryNotes ?? '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                pet != null ? 'Edit Pet' : 'Add Pet',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Name *'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: speciesController,
                decoration: const InputDecoration(labelText: 'Species *'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: breedController,
                decoration: const InputDecoration(labelText: 'Breed'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: ageController,
                      decoration: const InputDecoration(labelText: 'Age'),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: weightController,
                      decoration: const InputDecoration(labelText: 'Weight'),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: notesController,
                decoration: const InputDecoration(labelText: 'Medical Notes'),
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () async {
                  if (nameController.text.isEmpty ||
                      speciesController.text.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Name and species are required'),
                      ),
                    );
                    return;
                  }
                  final data = {
                    'name': nameController.text,
                    'species': speciesController.text,
                    'breed': breedController.text.isNotEmpty
                        ? breedController.text
                        : null,
                    'age': int.tryParse(ageController.text),
                    'weight': double.tryParse(weightController.text),
                    'medical_history_notes': notesController.text.isNotEmpty
                        ? notesController.text
                        : null,
                  };
                  try {
                    if (pet != null) {
                      await _apiService.updatePet(pet.id, data);
                    } else {
                      await _apiService.createPet(data);
                    }
                    Navigator.pop(context);
                    _loadPets();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to save pet')),
                    );
                  }
                },
                child: Text(pet != null ? 'Save Changes' : 'Add Pet'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _archivePet(Pet pet) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Archive Pet'),
        content: Text('Are you sure you want to archive ${pet.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _apiService.archivePet(pet.id);
              _loadPets();
            },
            child: const Text(
              'Archive',
              style: TextStyle(color: Colors.orange),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Pets')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _pets.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.pets, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No pets yet',
                    style: TextStyle(color: Colors.grey[600], fontSize: 18),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _pets.length,
              itemBuilder: (context, index) {
                final pet = _pets[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppConfig.primaryColor.withOpacity(0.1),
                      child: const Icon(
                        Icons.pets,
                        color: AppConfig.primaryColor,
                      ),
                    ),
                    title: Text(pet.name),
                    subtitle: Text(
                      '${pet.species}${pet.breed != null ? ' • ${pet.breed}' : ''}',
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit),
                          onPressed: () => _showAddEditDialog(pet),
                        ),
                        IconButton(
                          icon: const Icon(Icons.archive, color: Colors.orange),
                          onPressed: () => _archivePet(pet),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddEditDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }
}

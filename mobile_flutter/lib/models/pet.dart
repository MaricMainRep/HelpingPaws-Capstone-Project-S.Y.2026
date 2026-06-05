class Pet {
  final int id;
  final int ownerId;
  final String name;
  final String species;
  final String? breed;
  final int? age;
  final double? weight;
  final String? medicalHistoryNotes;
  final String? imageUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Pet({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.species,
    this.breed,
    this.age,
    this.weight,
    this.medicalHistoryNotes,
    this.imageUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id'] as int,
      ownerId: json['owner_id'] as int,
      name: json['name'] as String,
      species: json['species'] as String,
      breed: json['breed'] as String?,
      age: json['age'] != null ? (json['age'] as num).toInt() : null,
      weight: json['weight'] != null
          ? (json['weight'] as num).toDouble()
          : null,
      medicalHistoryNotes: json['medical_history_notes'] as String?,
      imageUrl: json['image_url'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'species': species,
      'breed': breed,
      'age': age,
      'weight': weight,
      'medical_history_notes': medicalHistoryNotes,
    };
  }
}

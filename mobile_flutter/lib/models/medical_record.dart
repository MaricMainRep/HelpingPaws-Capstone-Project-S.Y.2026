class HealthRecord {
  final int id;
  final int petId;
  final int? recordedByStaffId;
  final String? diagnosis;
  final String? treatment;
  final String? notes;
  final DateTime? createdAt;
  final PetSimple? pet;

  HealthRecord({
    required this.id,
    required this.petId,
    this.recordedByStaffId,
    this.diagnosis,
    this.treatment,
    this.notes,
    this.createdAt,
    this.pet,
  });

  factory HealthRecord.fromJson(Map<String, dynamic> json) {
    return HealthRecord(
      id: json['id'] as int,
      petId: (json['pet_id'] as num).toInt(),
      recordedByStaffId: json['recorded_by_staff_id'] != null
          ? (json['recorded_by_staff_id'] as num).toInt()
          : null,
      diagnosis: json['diagnosis'] as String?,
      treatment: json['treatment'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      pet: json['pets'] != null ? PetSimple.fromJson(json['pets']) : null,
    );
  }
}

class Prescription {
  final int id;
  final int healthRecordId;
  final int petId;
  final String medicationName;
  final String? dosage;
  final String? dosagePerTime;
  final String? duration;
  final String? dateGiven;
  final DateTime? createdAt;
  final PetSimple? pet;
  final DateTime? scheduledStart;
  final DateTime? scheduledEnd;
  final String? scheduledTimes;

  Prescription({
    required this.id,
    required this.healthRecordId,
    required this.petId,
    required this.medicationName,
    this.dosage,
    this.dosagePerTime,
    this.duration,
    this.dateGiven,
    this.createdAt,
    this.pet,
    this.scheduledStart,
    this.scheduledEnd,
    this.scheduledTimes,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
    return Prescription(
      id: json['id'] as int,
      healthRecordId: (json['health_record_id'] as num).toInt(),
      petId: (json['pet_id'] as num).toInt(),
      medicationName: json['medication_name'] as String,
      dosage: json['dosage'] as String?,
      dosagePerTime: json['dosage_per_time'] as String?,
      duration: json['duration'] as String?,
      dateGiven: json['date_given'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      pet: json['pets'] != null ? PetSimple.fromJson(json['pets']) : null,
      scheduledStart: json['scheduled_start'] != null
          ? DateTime.tryParse(json['scheduled_start'])
          : null,
      scheduledEnd: json['scheduled_end'] != null
          ? DateTime.tryParse(json['scheduled_end'])
          : null,
      scheduledTimes: json['scheduled_times'] as String?,
    );
  }
}

class Vaccination {
  final int id;
  final int petId;
  final String vaccineName;
  final String? administeredDate;
  final String? nextDueDate;
  final DateTime? createdAt;
  final PetSimple? pet;

  Vaccination({
    required this.id,
    required this.petId,
    required this.vaccineName,
    this.administeredDate,
    this.nextDueDate,
    this.createdAt,
    this.pet,
  });

  factory Vaccination.fromJson(Map<String, dynamic> json) {
    return Vaccination(
      id: json['id'] as int,
      petId: (json['pet_id'] as num).toInt(),
      vaccineName: json['vaccine_name'] as String,
      administeredDate: json['administered_date'] as String?,
      nextDueDate: json['next_due_date'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      pet: json['pets'] != null ? PetSimple.fromJson(json['pets']) : null,
    );
  }
}

class PetSimple {
  final String name;
  final String species;

  PetSimple({required this.name, required this.species});

  factory PetSimple.fromJson(Map<String, dynamic> json) {
    return PetSimple(
      name: json['name'] as String,
      species: json['species'] as String,
    );
  }
}

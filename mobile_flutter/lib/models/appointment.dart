enum AppointmentStatus {
  pending,
  confirmed,
  rejected,
  completed,
  cancelled;

  String get displayName => name.toUpperCase();

  static AppointmentStatus fromString(String value) {
    return AppointmentStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => AppointmentStatus.pending,
    );
  }
}

class Appointment {
  final int id;
  final int petId;
  final int? staffId;
  final int ownerId;
  final String appointmentDate;
  final String startTime;
  final String endTime;
  final String status;
  final String? notes;
  final PetSimple? pet;
  final StaffSimple? staff;

  Appointment({
    required this.id,
    required this.petId,
    this.staffId,
    required this.ownerId,
    required this.appointmentDate,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.notes,
    this.pet,
    this.staff,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as int,
      petId: (json['pet_id'] as num).toInt(),
      staffId: json['staff_id'] != null
          ? (json['staff_id'] as num).toInt()
          : null,
      ownerId: (json['owner_id'] as num).toInt(),
      appointmentDate: json['appointment_date'] as String,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      status: json['status'] as String ?? 'PENDING',
      notes: json['notes'] as String?,
      pet: json['pets'] != null ? PetSimple.fromJson(json['pets']) : null,
      staff: json['staff'] != null ? StaffSimple.fromJson(json['staff']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'pet_id': petId,
      'staff_id': staffId,
      'appointment_date': appointmentDate,
      'start_time': startTime,
      'end_time': endTime,
      'notes': notes,
    };
  }

  AppointmentStatus get statusEnum => AppointmentStatus.fromString(status);
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

class StaffSimple {
  final int id;
  final String? name;

  StaffSimple({required this.id, this.name});

  factory StaffSimple.fromJson(Map<String, dynamic> json) {
    return StaffSimple(
      id: (json['id'] as num).toInt(),
      name: json['users']?['name'] as String?,
    );
  }
}

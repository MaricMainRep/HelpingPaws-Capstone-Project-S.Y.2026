class PetSimple {
  final String name;
  final String species;

  PetSimple({required this.name, required this.species});

  factory PetSimple.fromJson(Map<String, dynamic> json) {
    try {
      return PetSimple(
        name: (json['name'] as String?) ?? 'Unknown',
        species: (json['species'] as String?) ?? 'Unknown',
      );
    } catch (e) {
      return PetSimple(name: 'Unknown', species: 'Unknown');
    }
  }
}

class StaffSimple {
  final int id;
  final String? name;

  StaffSimple({required this.id, this.name});

  factory StaffSimple.fromJson(Map<String, dynamic> json) {
    return StaffSimple(
      id: json['id'] as int,
      name: json['users']?['name'] as String?,
    );
  }
}

class Camera {
  final int id;
  final int roomId;
  final String name;
  final String? streamUrl;
  final bool isActive;
  final RoomSimple? room;

  Camera({
    required this.id,
    required this.roomId,
    required this.name,
    this.streamUrl,
    required this.isActive,
    this.room,
  });

  factory Camera.fromJson(Map<String, dynamic> json) {
    try {
      return Camera(
        id: json['id'] != null ? (json['id'] as num).toInt() : 0,
        roomId: json['room_id'] != null ? (json['room_id'] as num).toInt() : 0,
        name: (json['name'] as String?) ?? 'Camera',
        streamUrl: json['stream_url'] as String?,
        isActive: json['is_active'] as bool? ?? true,
        room: json['rooms'] != null
            ? RoomSimple.fromJson(json['rooms'] as Map<String, dynamic>)
            : null,
      );
    } catch (e) {
      return Camera(
        id: 0,
        roomId: 0,
        name: 'Camera',
        streamUrl: null,
        isActive: true,
        room: null,
      );
    }
  }
}

class RoomSimple {
  final int id;
  final String name;

  RoomSimple({required this.id, required this.name});

  factory RoomSimple.fromJson(Map<String, dynamic> json) {
    try {
      return RoomSimple(
        id: json['id'] != null ? (json['id'] as num).toInt() : 0,
        name: (json['name'] as String?) ?? 'Unknown',
      );
    } catch (e) {
      return RoomSimple(id: 0, name: 'Unknown');
    }
  }
}

class Room {
  final int id;
  final String name;
  final String? description;
  final int? capacity;

  Room({required this.id, required this.name, this.description, this.capacity});

  factory Room.fromJson(Map<String, dynamic> json) {
    return Room(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      capacity: json['capacity'] != null
          ? (json['capacity'] as num).toInt()
          : null,
    );
  }
}

class PetLocation {
  final int id;
  final int petId;
  final int roomId;
  final String status;
  final PetSimple? pet;
  final RoomSimple? room;

  PetLocation({
    required this.id,
    required this.petId,
    required this.roomId,
    required this.status,
    this.pet,
    this.room,
  });

  factory PetLocation.fromJson(Map<String, dynamic> json) {
    try {
      return PetLocation(
        id: json['id'] != null ? (json['id'] as num).toInt() : 0,
        petId: json['pet_id'] != null ? (json['pet_id'] as num).toInt() : 0,
        roomId: json['room_id'] != null ? (json['room_id'] as num).toInt() : 0,
        status: (json['status'] as String?) ?? 'CHECKED_IN',
        pet: json['pets'] != null
            ? PetSimple.fromJson(json['pets'] as Map<String, dynamic>)
            : null,
        room: json['rooms'] != null
            ? RoomSimple.fromJson(json['rooms'] as Map<String, dynamic>)
            : null,
      );
    } catch (e) {
      return PetLocation(
        id: 0,
        petId: 0,
        roomId: 0,
        status: 'CHECKED_IN',
        pet: null,
        room: null,
      );
    }
  }
}

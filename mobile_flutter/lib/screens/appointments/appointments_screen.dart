import 'package:flutter/material.dart';
import '../../core/config.dart';
import '../../services/api_service.dart';
import '../../models/appointment.dart';

class TimeSlot {
  final String start;
  final String end;
  final String label;

  const TimeSlot({required this.start, required this.end, required this.label});
}

const TIME_SLOTS = [
  TimeSlot(start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM'),
  TimeSlot(start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM'),
  TimeSlot(start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM'),
  TimeSlot(start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM'),
  TimeSlot(start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM'),
  TimeSlot(start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM'),
  TimeSlot(start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM'),
  TimeSlot(start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM'),
  TimeSlot(start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM'),
];

class StaffWithAvailability {
  final int id;
  final String? name;
  final String? specialty;
  final List<StaffAvailability> availability;

  StaffWithAvailability({
    required this.id,
    this.name,
    this.specialty,
    this.availability = const [],
  });

  factory StaffWithAvailability.fromJson(Map<String, dynamic> json) {
    return StaffWithAvailability(
      id: (json['id'] as num).toInt(),
      name: json['users']?['name'] as String?,
      specialty: json['specialty'] as String?,
      availability:
          (json['staff_availability'] as List<dynamic>?)
              ?.map((a) => StaffAvailability.fromJson(a))
              .toList() ??
          [],
    );
  }
}

class StaffAvailability {
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final bool isAvailable;

  StaffAvailability({
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.isAvailable,
  });

  factory StaffAvailability.fromJson(Map<String, dynamic> json) {
    return StaffAvailability(
      dayOfWeek: (json['day_of_week'] as num).toInt(),
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      isAvailable: json['is_available'] as bool? ?? false,
    );
  }
}

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _apiService = ApiService();
  List<Appointment> _appointments = [];
  List<dynamic> _pets = [];
  List<StaffWithAvailability> _staff = [];
  bool _loading = true;
  int? _selectedPetId;
  int? _selectedStaffId;
  DateTime? _selectedDate;
  TimeSlot? _selectedSlot;
  String? _timeError;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final apts = await _apiService.getAppointments();
      final pets = await _apiService.getPets();
      final staff = await _apiService.getStaff();
      setState(() {
        _appointments = apts.map((j) => Appointment.fromJson(j)).toList();
        _pets = pets;
        _staff = (staff as List)
            .map((s) => StaffWithAvailability.fromJson(s))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  bool _isWeekend(DateTime date) {
    return date.weekday == DateTime.saturday || date.weekday == DateTime.sunday;
  }

  String _normalizeTime(String time) {
    return time.substring(0, 5);
  }

  List<TimeSlot> _getAvailableSlots() {
    if (_selectedDate == null || _selectedStaffId == null) {
      return [];
    }

    final selectedStaff = _staff.firstWhere(
      (s) => s.id == _selectedStaffId,
      orElse: () => StaffWithAvailability(id: 0),
    );

    if (selectedStaff.availability.isEmpty) {
      return [];
    }

    final dayOfWeek = _selectedDate!.weekday;
    final availableStaffSlots = selectedStaff.availability
        .where((a) => a.dayOfWeek == dayOfWeek && a.isAvailable)
        .map(
          (a) => TimeSlot(
            start: _normalizeTime(a.startTime),
            end: _normalizeTime(a.endTime),
            label: '',
          ),
        )
        .toList();

    final bookedForDate = _appointments
        .where(
          (apt) =>
              apt.appointmentDate.substring(0, 10) ==
              '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}',
        )
        .toList();

    final bookedStartTimes = <String>{};
    for (final booked in bookedForDate) {
      if (booked.staffId == _selectedStaffId) {
        bookedStartTimes.add(_normalizeTime(booked.startTime));
      }
    }

    return TIME_SLOTS.where((slot) {
      final isAvailable = availableStaffSlots.any(
        (as) => as.start == slot.start && as.end == slot.end,
      );
      final isBooked = bookedStartTimes.contains(slot.start);
      return isAvailable && !isBooked;
    }).toList();
  }

  Future<void> _selectDate(StateSetter setModalState) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
    );

    if (picked != null) {
      if (_isWeekend(picked)) {
        setModalState(() {
          _timeError = 'Appointments are not available on weekends';
          _selectedDate = null;
          _selectedSlot = null;
        });
        return;
      }
      setModalState(() {
        _selectedDate = picked;
        _selectedSlot = null;
        _timeError = null;
      });
    }
  }

  void _showCancelConfirmation(Appointment apt) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: const Text(
          'Are you sure you want to cancel this appointment?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _apiService.cancelAppointment(apt.id);
              _loadData();
            },
            child: const Text(
              'Yes, Cancel',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _bookAppointment() async {
    if (_selectedPetId == null ||
        _selectedStaffId == null ||
        _selectedDate == null ||
        _selectedSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final dateStr =
          '${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}';

      await _apiService.createAppointment({
        'pet_id': _selectedPetId,
        'staff_id': _selectedStaffId,
        'appointment_date': dateStr,
        'start_time': _selectedSlot!.start,
        'end_time': _selectedSlot!.end,
      });

      if (mounted) {
        Navigator.pop(context);
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment booked successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to book: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showBookingDialog() {
    final hasPending = _appointments.any(
      (apt) => apt.status == 'PENDING' || apt.status == 'CONFIRMED',
    );

    setState(() {
      _selectedPetId = null;
      _selectedStaffId = null;
      _selectedDate = null;
      _selectedSlot = null;
      _timeError = null;
    });

    if (hasPending) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Pending Appointment'),
          content: const Text(
            'You already have an active appointment. Please wait for it to be confirmed or cancelled before booking another.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final availableSlots = _getAvailableSlots();

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(ctx).viewInsets.bottom,
              left: 16,
              right: 16,
              top: 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Book Appointment',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<int>(
                    decoration: const InputDecoration(
                      labelText: 'Select Pet *',
                    ),
                    items: _pets
                        .map(
                          (p) => DropdownMenuItem(
                            value: (p['id'] as num).toInt(),
                            child: Text('${p['name']} (${p['species']})'),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setModalState(() {
                      _selectedPetId = v;
                    }),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    decoration: const InputDecoration(
                      labelText: 'Select Veterinarian *',
                    ),
                    items: _staff
                        .map(
                          (s) => DropdownMenuItem(
                            value: s.id,
                            child: Text(
                              '${s.name ?? 'Staff #${s.id}'}${s.specialty != null ? ' (${s.specialty})' : ''}',
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setModalState(() {
                      _selectedStaffId = v;
                      _selectedDate = null;
                      _selectedSlot = null;
                      _timeError = null;
                    }),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: _selectedStaffId != null
                        ? () => _selectDate(setModalState)
                        : null,
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Select Date *',
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _selectedDate != null
                                ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                                : 'Select a date',
                            style: TextStyle(
                              color: _selectedDate != null
                                  ? AppConfig.textPrimary
                                  : AppConfig.textSecondary,
                            ),
                          ),
                          const Icon(Icons.calendar_today, size: 20),
                        ],
                      ),
                    ),
                  ),
                  if (_timeError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _timeError!,
                      style: const TextStyle(
                        color: AppConfig.errorColor,
                        fontSize: 12,
                      ),
                    ),
                  ],
                  if (_selectedStaffId != null && _selectedDate != null) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Available Time Slots',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (availableSlots.isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: TIME_SLOTS.map((slot) {
                          final isAvailable = availableSlots.any(
                            (s) => s.start == slot.start,
                          );
                          final isSelected = _selectedSlot?.start == slot.start;

                          return InkWell(
                            onTap: isAvailable
                                ? () => setModalState(() {
                                    _selectedSlot = slot;
                                  })
                                : null,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppConfig.primaryColor
                                    : isAvailable
                                    ? Colors.white
                                    : Colors.grey[200],
                                border: Border.all(
                                  color: isSelected
                                      ? AppConfig.primaryColor
                                      : isAvailable
                                      ? AppConfig.primaryColor.withValues(
                                          alpha: 0.5,
                                        )
                                      : Colors.grey[300]!,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                slot.label,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: isSelected
                                      ? Colors.white
                                      : isAvailable
                                      ? AppConfig.primaryColor
                                      : Colors.grey,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'No available slots for this date',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppConfig.textSecondary),
                        ),
                      ),
                  ],
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isSubmitting || _selectedSlot == null
                        ? null
                        : () => _bookAppointment(),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Book Appointment'),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return AppConfig.successColor;
      case 'REJECTED':
        return AppConfig.errorColor;
      case 'PENDING':
        return AppConfig.warningColor;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr.substring(0, 10));
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${months[date.month - 1]}. ${date.day}, ${date.year}';
    } catch (e) {
      return dateStr.substring(0, 10);
    }
  }

  String _formatTime(String time) {
    if (time.isEmpty) return '';
    final hours = int.parse(time.split(':').first);
    if (hours == 0) return '12:00 AM';
    if (hours < 12) return '$hours:00 AM';
    if (hours == 12) return '12:00 PM';
    return '${hours - 12}:00 PM';
  }

  void _showBookingGuide() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('How to Book an Appointment'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('1. Select your pet from the dropdown'),
            SizedBox(height: 8),
            Text('2. Choose a veterinarian based on availability'),
            SizedBox(height: 8),
            Text('3. Pick a date (weekdays only)'),
            SizedBox(height: 8),
            Text('4. Select an available time slot'),
            SizedBox(height: 8),
            Text('5. Tap "Book Appointment" to confirm'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointments'),
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            onPressed: _showBookingGuide,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _appointments.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.calendar_today, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No appointments',
                    style: TextStyle(color: Colors.grey[600], fontSize: 18),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _appointments.length,
              itemBuilder: (ctx, i) {
                final apt = _appointments[i];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _formatDate(apt.appointmentDate),
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: _getStatusColor(
                                  apt.status,
                                ).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                apt.status,
                                style: TextStyle(
                                  color: _getStatusColor(apt.status),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(apt.pet?.name ?? 'Pet #${apt.petId}'),
                        Text(
                          '${_formatTime(apt.startTime)} - ${_formatTime(apt.endTime)}',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        if (apt.staff?.name != null)
                          Text(
                            apt.staff!.name ?? 'Staff #${apt.staffId}',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                        if (apt.status == 'PENDING' ||
                            apt.status == 'CONFIRMED')
                          TextButton(
                            onPressed: () => _showCancelConfirmation(apt),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showBookingDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}

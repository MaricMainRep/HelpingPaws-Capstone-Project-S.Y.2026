import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/config.dart';
import '../../services/api_service.dart';
import '../../models/medical_record.dart';

String _formatDate(DateTime? date) {
  if (date == null) return '';
  return DateFormat('MMM d, yyyy').format(date);
}

String _formatTime(String timeStr) {
  try {
    final parts = timeStr.split(':');
    final h = int.parse(parts[0]);
    final m = int.parse(parts[1]);
    final amPm = h >= 12 ? 'PM' : 'AM';
    final hour = h == 0 ? 12 : (h > 12 ? h - 12 : h);
    return '${hour.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} $amPm';
  } catch (_) {
    return timeStr;
  }
}

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen>
    with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  late TabController _tabController;
  List<HealthRecord> _records = [];
  List<Prescription> _prescriptions = [];
  List<Vaccination> _vaccinations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final records = await _apiService.getHealthRecords();
      final prescriptions = await _apiService.getPrescriptions();
      final vaccinations = await _apiService.getVaccinations();
      setState(() {
        _records = records.map((j) => HealthRecord.fromJson(j)).toList();
        _prescriptions = prescriptions
            .map((j) => Prescription.fromJson(j))
            .toList();
        _vaccinations = vaccinations
            .map((j) => Vaccination.fromJson(j))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _showScheduleForm(Prescription p) async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _ScheduleForm(
        medicationName: p.medicationName,
        petName: p.pet?.name ?? 'Pet #${p.petId}',
        initialStart: p.scheduledStart ?? DateTime.now(),
        initialEnd:
            p.scheduledEnd ?? DateTime.now().add(const Duration(days: 30)),
        initialTimes: p.scheduledTimes != null
            ? p.scheduledTimes!.split(',').map((t) => t.trim()).toList()
            : ['08:00', '18:00'],
        initialDosage: p.dosagePerTime ?? p.dosage ?? '1 tablet',
      ),
    );

    if (result == null) return;

    await _apiService.updatePrescription(p.id, result);
    await _apiService.checkReminders();
    _loadData();
  }

  Future<void> _pickVaccinationDate(Vaccination v) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: v.nextDueDate != null
          ? DateTime.tryParse(v.nextDueDate!) ?? DateTime.now()
          : DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked == null) return;

    await _apiService.updateVaccination(v.id, {
      'administered_date': DateFormat('yyyy-MM-dd').format(picked),
    });
    _loadData();
  }

  String _scheduleSummary(Prescription p) {
    if (p.scheduledStart == null ||
        p.scheduledEnd == null ||
        p.scheduledTimes == null) {
      return 'Not scheduled';
    }
    final times = p.scheduledTimes!
        .split(',')
        .map((t) => _formatTime(t.trim()))
        .join(', ');
    final start = _formatDate(p.scheduledStart);
    final end = _formatDate(p.scheduledEnd);
    final dosage = p.dosagePerTime ?? p.dosage ?? '';
    return '$start – $end\n$times${dosage.isNotEmpty ? ' ($dosage)' : ''}';
  }

  void _showRecordDetail(Widget detail) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: detail,
        ),
      ),
    );
  }

  Widget _buildDetailCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required List<MapEntry<String, String>> fields,
    String? actionDate,
    VoidCallback? onDateTap,
    String? actionLabel,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (subtitle.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        subtitle,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ...fields.map(
          (f) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _detailField(f.key, f.value),
          ),
        ),
        if (actionDate != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.schedule, size: 16, color: Colors.grey),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  actionDate,
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                ),
              ),
              if (onDateTap != null) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: onDateTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppConfig.primaryColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      actionLabel ?? 'Set',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConfig.primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Close'),
          ),
        ),
      ],
    );
  }

  Widget _detailField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey[500],
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Text(value, style: const TextStyle(fontSize: 14, height: 1.5)),
        ),
      ],
    );
  }

  String _truncate(String? text, {int maxLines = 2}) {
    if (text == null || text.isEmpty) return '-';
    final lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    return '${lines.sublist(0, maxLines).join('\n')}...';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Medical Records'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Health'),
            Tab(text: 'Medications'),
            Tab(text: 'Vaccinations'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildHealthTab(),
                _buildMedicationsTab(),
                _buildVaccinationsTab(),
              ],
            ),
    );
  }

  Widget _buildHealthTab() {
    if (_records.isEmpty) return _buildEmptyTab();
    return _buildList(
      _records.map((r) {
        final petName = r.pet?.name ?? 'Pet #${r.petId}';
        final date = _formatDate(r.createdAt);
        return _RecordItem(
          title: petName,
          subtitle: _truncate(r.diagnosis ?? r.treatment),
          date: date.isNotEmpty ? date : null,
          onTap: () => _showRecordDetail(
            _buildDetailCard(
              icon: Icons.medical_information,
              color: AppConfig.primaryColor,
              title: petName,
              subtitle: 'Health Record',
              fields: [
                MapEntry('Diagnosis', r.diagnosis ?? 'No diagnosis'),
                MapEntry('Treatment', r.treatment ?? 'No treatment'),
              ],
              actionDate: date.isNotEmpty ? date : null,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMedicationsTab() {
    if (_prescriptions.isEmpty) return _buildEmptyTab();
    return _buildList(
      _prescriptions.map((p) {
        final petName = p.pet?.name ?? 'Pet #${p.petId}';
        final hasSchedule =
            p.scheduledStart != null &&
            p.scheduledEnd != null &&
            p.scheduledTimes != null;
        final summary = hasSchedule
            ? _scheduleSummary(p)
            : 'Tap to set schedule';
        return _RecordItem(
          title: p.medicationName,
          subtitle: p.dosage != null ? '$petName – ${p.dosage}' : petName,
          date: summary,
          onTap: () => _showRecordDetail(
            _buildDetailCard(
              icon: Icons.medication,
              color: AppConfig.secondaryColor,
              title: p.medicationName,
              subtitle: petName,
              fields: [
                if (p.dosage != null) MapEntry('Dosage', p.dosage!),
                if (p.duration != null) MapEntry('Duration', p.duration!),
                if (hasSchedule)
                  MapEntry(
                    'Schedule',
                    _scheduleSummary(p).replaceAll('\n', ' — '),
                  ),
              ],
              actionDate: hasSchedule ? 'Active schedule' : 'Not scheduled',
              actionLabel: hasSchedule ? 'Edit' : 'Set Schedule',
              onDateTap: () {
                Navigator.pop(context);
                _showScheduleForm(p);
              },
            ),
          ),
          onDateTap: () => _showScheduleForm(p),
        );
      }).toList(),
    );
  }

  Widget _buildVaccinationsTab() {
    if (_vaccinations.isEmpty) return _buildEmptyTab();
    return _buildList(
      _vaccinations.map((v) {
        return _RecordItem(
          title: v.vaccineName,
          subtitle: v.pet?.name ?? 'Pet #${v.petId}',
          date: v.nextDueDate != null ? 'Due: ${v.nextDueDate}' : null,
          onTap: () => _showRecordDetail(
            _buildDetailCard(
              icon: Icons.vaccines,
              color: AppConfig.successColor,
              title: v.vaccineName,
              subtitle: v.pet?.name ?? 'Pet #${v.petId}',
              fields: [
                MapEntry('Administered', v.administeredDate ?? 'Unknown'),
                if (v.nextDueDate != null) MapEntry('Next Due', v.nextDueDate!),
              ],
              actionDate: v.administeredDate != null
                  ? 'Given: ${v.administeredDate}'
                  : null,
              onDateTap: () {
                Navigator.pop(context);
                _pickVaccinationDate(v);
              },
            ),
          ),
          onDateTap: () => _pickVaccinationDate(v),
        );
      }).toList(),
    );
  }

  Widget _buildEmptyTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.medical_information, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No records',
            style: TextStyle(color: Colors.grey[600], fontSize: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildList(List<_RecordItem> items) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (ctx, i) => Card(
        child: ListTile(
          leading: const Icon(
            Icons.medical_information,
            color: AppConfig.primaryColor,
          ),
          title: Text(
            items[i].title,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (items[i].subtitle.isNotEmpty)
                Text(
                  items[i].subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (items[i].date != null) ...[
                    const Icon(Icons.schedule, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        items[i].date!,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                  if (items[i].onDateTap != null) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: items[i].onDateTap,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppConfig.primaryColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add, size: 14, color: Colors.white),
                            SizedBox(width: 4),
                            Text(
                              'Set',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          isThreeLine: true,
          trailing: const Icon(Icons.chevron_right, color: Colors.grey),
          onTap: items[i].onTap,
        ),
      ),
    );
  }
}

class _ScheduleForm extends StatefulWidget {
  final String medicationName;
  final String petName;
  final DateTime initialStart;
  final DateTime initialEnd;
  final List<String> initialTimes;
  final String initialDosage;

  const _ScheduleForm({
    required this.medicationName,
    required this.petName,
    required this.initialStart,
    required this.initialEnd,
    required this.initialTimes,
    required this.initialDosage,
  });

  @override
  State<_ScheduleForm> createState() => _ScheduleFormState();
}

class _ScheduleFormState extends State<_ScheduleForm> {
  late DateTime _startDate;
  late DateTime _endDate;
  late List<TimeOfDay> _times;
  late TextEditingController _dosageCtrl;

  @override
  void initState() {
    super.initState();
    _startDate = widget.initialStart;
    _endDate = widget.initialEnd;
    _times = widget.initialTimes.map((t) {
      final parts = t.split(':');
      return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
    }).toList();
    _dosageCtrl = TextEditingController(text: widget.initialDosage);
  }

  @override
  void dispose() {
    _dosageCtrl.dispose();
    super.dispose();
  }

  void _addTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 8, minute: 0),
    );
    if (picked != null) {
      setState(() => _times.add(picked));
    }
  }

  void _removeTime(int index) {
    setState(() => _times.removeAt(index));
  }

  String _timeStr(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Schedule: ${widget.medicationName}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          Text(widget.petName, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 24),

          // Start & End dates
          Row(
            children: [
              Expanded(
                child: _dateField(
                  'Start',
                  _startDate,
                  (d) => setState(() => _startDate = d),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _dateField(
                  'End',
                  _endDate,
                  (d) => setState(() => _endDate = d),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Dosage per time
          TextField(
            controller: _dosageCtrl,
            decoration: InputDecoration(
              labelText: 'Dosage per time',
              hintText: 'e.g., 1 tablet',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Times
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Times',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              TextButton.icon(
                onPressed: _addTime,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add time'),
              ),
            ],
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _times
                .asMap()
                .entries
                .map(
                  (e) => Chip(
                    label: Text(_timeStr(e.value)),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: () => _removeTime(e.key),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context, {
                'scheduled_start': DateFormat('yyyy-MM-dd').format(_startDate),
                'scheduled_end': DateFormat('yyyy-MM-dd').format(_endDate),
                'scheduled_times': _times.map(_timeStr).join(','),
                'dosage_per_time': _dosageCtrl.text,
              }),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'Save Schedule',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _dateField(
    String label,
    DateTime date,
    ValueChanged<DateTime> onPicked,
  ) {
    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date,
          firstDate: DateTime(2020),
          lastDate: DateTime(2035),
        );
        if (picked != null) onPicked(picked);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                const SizedBox(width: 6),
                Text(_formatDate(date)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RecordItem {
  final String title;
  final String subtitle;
  final String? date;
  final VoidCallback? onTap;
  final VoidCallback? onDateTap;

  _RecordItem({
    required this.title,
    required this.subtitle,
    this.date,
    this.onTap,
    this.onDateTap,
  });
}

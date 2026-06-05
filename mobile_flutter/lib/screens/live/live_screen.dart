import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/config.dart';
import '../../services/api_service.dart';
import '../../models/shared.dart';

bool _isMjpegStream(String? url) {
  if (url == null) return false;
  return url.contains('/video') || url.contains(':8080');
}

class LiveScreen extends StatefulWidget {
  const LiveScreen({super.key});

  @override
  State<LiveScreen> createState() => _LiveScreenState();
}

class _LiveScreenState extends State<LiveScreen> {
  final _apiService = ApiService();
  List<Camera> _cameras = [];
  List<PetLocation> _petLocations = [];
  bool _loading = true;
  Camera? _selectedCamera;
  late WebViewController _webViewController;

  @override
  void initState() {
    super.initState();
    _initWebView();
    _loadData();
  }

  Future<void> _initWebView() async {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {},
          onPageFinished: (String url) {},
        ),
      );
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final camerasData = await _apiService.getCameras();
      final locationsData = await _apiService.getPetLocations();
      setState(() {
        _cameras = camerasData.map((j) => Camera.fromJson(j)).toList();
        _petLocations = locationsData
            .map((j) => PetLocation.fromJson(j))
            .toList();
        _loading = false;
      });
    } catch (e) {
      debugPrint('Error loading data: $e');
      setState(() => _loading = false);
    }
  }

  void _playStream(Camera camera) async {
    if (camera.streamUrl == null) return;

    if (_isMjpegStream(camera.streamUrl)) {
      try {
        final uri = Uri.parse(camera.streamUrl!);
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        if (!launched && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cannot open IP Webcam stream')),
          );
        }
      } catch (e) {
        debugPrint('Error opening stream: $e');
      }
      return;
    }

    _webViewController.loadRequest(Uri.parse(camera.streamUrl!));
    setState(() => _selectedCamera = camera);
  }

  void _closeStream() {
    setState(() => _selectedCamera = null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Monitoring'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _selectedCamera != null
          ? _buildWebViewPlayer()
          : _cameras.isEmpty
          ? _buildEmpty()
          : _buildCameraGrid(),
    );
  }

  Widget _buildWebViewPlayer() {
    final roomId = _selectedCamera?.roomId;
    final petsInRoom = roomId != null
        ? _petLocations.where((loc) => loc.roomId == roomId).toList()
        : [];

    return SafeArea(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: AppConfig.primaryColor,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 20),
                  onPressed: _closeStream,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _selectedCamera!.room?.name ?? 'Camera',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        _selectedCamera!.isActive ? 'LIVE' : 'OFFLINE',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _selectedCamera!.streamUrl != null
                ? WebViewWidget(controller: _webViewController)
                : const Center(child: Text('No stream URL available')),
          ),
          if (petsInRoom.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pets in this room:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppConfig.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...petsInRoom.map(
                    (loc) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.pets,
                            size: 14,
                            color: AppConfig.primaryColor,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            loc.pet?.name ?? 'Pet #${loc.petId}',
                            style: const TextStyle(fontSize: 13),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            loc.status.replaceAll('_', ' '),
                            style: TextStyle(
                              fontSize: 11,
                              color: AppConfig.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppConfig.primaryColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.videocam_off,
              size: 40,
              color: AppConfig.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No cameras available',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          const Text('Contact the clinic to set up live monitoring'),
        ],
      ),
    );
  }

  Widget _buildCameraGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.9,
      ),
      itemCount: _cameras.length,
      itemBuilder: (ctx, i) {
        final camera = _cameras[i];
        final petsInRoom = _petLocations
            .where((loc) => loc.roomId == camera.roomId)
            .toList();
        return _CameraCard(
          camera: camera,
          petCount: petsInRoom.length,
          petNames: petsInRoom
              .map((l) => l.pet?.name ?? 'Pet #${l.petId}')
              .toList(),
          onTap: () => _playStream(camera),
          onLongPress: () => setState(() => _selectedCamera = camera),
        );
      },
    );
  }
}

class _CameraCard extends StatelessWidget {
  final Camera camera;
  final int petCount;
  final List<String> petNames;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _CameraCard({
    required this.camera,
    this.petCount = 0,
    this.petNames = const [],
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                alignment: Alignment.topRight,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: camera.isActive
                          ? AppConfig.primaryColor.withValues(alpha: 0.1)
                          : AppConfig.textSecondary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.videocam,
                      size: 24,
                      color: camera.isActive
                          ? AppConfig.primaryColor
                          : AppConfig.textSecondary,
                    ),
                  ),
                  if (camera.isActive)
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppConfig.successColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                camera.name,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                camera.room?.name ?? '',
                style: TextStyle(fontSize: 10, color: AppConfig.textSecondary),
              ),
              if (petCount > 0) ...[
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.pets,
                      size: 12,
                      color: AppConfig.primaryColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      petCount == 1 ? petNames.first : '$petCount pets',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppConfig.primaryColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ] else
                const SizedBox(height: 4),
            ],
          ),
        ),
      ),
    );
  }
}

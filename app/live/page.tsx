'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PawPrint, RefreshCw, Video, Camera, Webcam, X, Monitor, Play } from 'lucide-react';
import Hls from 'hls.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Camera {
  id: number;
  room_id: number;
  stream_url?: string;
  is_active: boolean;
  rooms?: { name: string };
}

interface PetLocation {
  id: number;
  pet_id: number;
  room_id: number;
  status: string;
  rooms?: { name: string };
  pets?: { name: string };
}

interface StreamSource {
  id: string;
  name: string;
  url: string;
  roomName: string;
  isMjpeg?: boolean;
}

function WebcamDisplay({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  const startStream = async (deviceId?: string) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId || selectedDeviceId
          ? { deviceId: { exact: deviceId || selectedDeviceId }, width: 1280, height: 720 }
          : true,
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLoading(false);
      setPermissionsGranted(true);
    } catch (err: any) {
      console.error('Webcam error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Make sure OBS Virtual Camera is enabled.');
      } else {
        setError('Unable to access camera: ' + err.message);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        
        const obsCam = videoDevices.find(d => 
          d.label.toLowerCase().includes('obs') || 
          d.label.toLowerCase().includes('virtual')
        );
        
        if (obsCam) {
          setSelectedDeviceId(obsCam.deviceId);
          await startStream(obsCam.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
          await startStream(videoDevices[0].deviceId);
        } else {
          await startStream();
        }
      } catch (err) {
        console.error('Error initializing:', err);
        await startStream();
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (selectedDeviceId && permissionsGranted) {
      startStream(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const switchCamera = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 sm:h-64 md:h-80 bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <Webcam className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-white text-sm">{error}</p>
              <button 
                onClick={() => startStream()} 
                className="mt-2 px-3 py-1 bg-white text-black rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {!error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-green-600 px-2 py-1 rounded">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">DEMO</span>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
      <div className="p-2 bg-muted">
        {devices.length > 0 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => switchCamera(e.target.value)}
            className="w-full text-sm mb-2 bg-background border rounded px-2 py-1"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <Webcam className="h-4 w-4 text-[#3a7d6c]" />
          <p className="text-sm font-medium">Webcam Demo</p>
        </div>
      </div>
    </Card>
  );
}

function OBSStreamDisplay({ streamUrl, onClose }: { streamUrl: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let hls: Hls | null = null;
    let isMounted = true;

    const loadStream = async () => {
      if (!streamUrl || !isMounted) {
        setError('No stream URL provided');
        setIsLoading(false);
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      setError('');

      if (streamUrl.includes('.m3u8')) {
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isMounted) {
              setIsLoading(false);
              video.play().catch(console.error);
            }
          });
          hls.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean; type?: string; details?: string; reason?: string }) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              setError('Stream not ready. Make sure MediaMTX is running and OBS is streaming.');
              setIsLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', () => {
            if (isMounted) {
              setIsLoading(false);
              video.play().catch(console.error);
            }
          });
          video.addEventListener('error', () => {
            if (isMounted) {
              setError('Failed to load stream. Check URL and try again.');
              setIsLoading(false);
            }
          });
        } else {
          setError('HLS not supported in this browser');
          setIsLoading(false);
        }
      } else {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          if (isMounted) {
            setIsLoading(false);
            video.play().catch(console.error);
          }
        });
        video.addEventListener('error', () => {
          if (isMounted) {
            setError('Failed to load stream. Check URL and try again.');
            setIsLoading(false);
          }
        });
      }
    };

    loadStream();

    return () => {
      isMounted = false;
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 sm:h-64 md:h-80 bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <Monitor className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-white text-sm">{error}</p>
            </div>
          </div>
        )}
        {!error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        )}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-blue-600 px-2 py-1 rounded">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">OBS</span>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
      <div className="p-2 bg-muted flex items-center gap-2">
        <Monitor className="h-4 w-4 text-[#3a7d6c]" />
        <p className="text-sm font-medium truncate">OBS Stream</p>
      </div>
    </Card>
  );
}

type DemoType = 'none' | 'webcam' | 'obs' | 'mjpeg';

export default function LiveMonitoringPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [petLocations, setPetLocations] = useState<PetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [ownerPetRoomIds, setOwnerPetRoomIds] = useState<number[]>([]);
  const [demoType, setDemoType] = useState<DemoType>('none');
  const [obsStreamUrl, setObsStreamUrl] = useState('');
  const [mjpegStreamUrl, setMjpegStreamUrl] = useState('');
  const [showObsInput, setShowObsInput] = useState(false);
  const [showMjpegInput, setShowMjpegInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [camsRes, locsRes, userRes, petsRes] = await Promise.all([
          fetch(`${API_URL}/api/cameras/`),
          fetch(`${API_URL}/api/pet-locations/`),
          fetch(`${API_URL}/api/auth/me/`, { credentials: 'include' }),
          fetch(`${API_URL}/api/pets/`),
        ]);

        const cams = await camsRes.json();
        const locs = await locsRes.json();
        const userData = userRes.ok ? await userRes.json() : { user: null };
        const petsData = await petsRes.json();

        setCameras(cams.cameras || []);
        setPetLocations(locs.locations || []);
        setUserRole(userData.user?.role || '');

        if (userData.user?.role === 'PET_OWNER') {
          const userPets = petsData.pets || [];
          const petIds = userPets.map((p: any) => p.id);
          const ownerLocs = (locs.locations || []).filter((loc: PetLocation) => 
            petIds.includes(loc.pet_id)
          );
          const roomIds: number[] = [...new Set<number>(ownerLocs.map((loc: PetLocation) => loc.room_id))];
          setOwnerPetRoomIds(roomIds);
          
          if (roomIds.length === 1) {
            const room = locs.locations.find((loc: PetLocation) => loc.room_id === roomIds[0]);
            setSelectedRoom(room?.rooms?.name || 'all');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeCameras = cameras.filter((c: Camera) => c.is_active && c.stream_url);
  
  const isMjpegStream = (url: string): boolean => {
    if (!url) return false;
    return url.includes('/video') || url.endsWith('/jpeg') || url.includes('/mjpeg') || url.includes(':8080');
  };
  
  const groupedCameras = activeCameras.reduce((acc: Record<string, StreamSource[]>, cam) => {
    const roomName = cam.rooms?.name || 'Unassigned';
    const url = cam.stream_url || '';
    const isMjpegCam = isMjpegStream(url);
    if (!acc[roomName]) acc[roomName] = [];
    acc[roomName].push({
      id: `cam-${cam.id}`,
      name: cam.rooms?.name || `Camera ${cam.id}`,
      url: url,
      roomName: roomName,
      isMjpeg: isMjpegCam
    });
    return acc;
  }, {} as Record<string, StreamSource[]>);

  const roomNames = Object.keys(groupedCameras);
  
  const filteredRoomNames = userRole === 'PET_OWNER' && ownerPetRoomIds.length > 0
    ? roomNames.filter((roomName) => {
        const cam = activeCameras.find((c: Camera) => c.rooms?.name === roomName);
        return cam && ownerPetRoomIds.includes(cam.room_id);
      })
    : roomNames;
  
  const showAllRooms = userRole !== 'PET_OWNER';

  useEffect(() => {
    if (userRole === 'PET_OWNER' && filteredRoomNames.length > 0 && !selectedRoom && demoType === 'none') {
      setSelectedRoom(filteredRoomNames[0]);
    }
  }, [userRole, filteredRoomNames, selectedRoom, demoType]);
  
  const filteredCameras = demoType !== 'none'
    ? []
    : (!selectedRoom || selectedRoom === 'all'
        ? activeCameras 
        : activeCameras.filter((c: Camera) => (c.rooms?.name || 'Unassigned') === selectedRoom));

  const filteredPetLocations = demoType !== 'none'
    ? []
    : (!selectedRoom || selectedRoom === 'all'
        ? petLocations
        : petLocations.filter((loc: PetLocation) => (loc.rooms?.name || 'Unassigned') === selectedRoom));

  const handleSelectChange = (value: string) => {
    if (value === 'webcam') {
      setDemoType('webcam');
      setShowObsInput(false);
      setShowMjpegInput(false);
    } else if (value === 'obs') {
      setDemoType('obs');
      setShowObsInput(true);
      setShowMjpegInput(false);
    } else if (value === 'mjpeg') {
      setDemoType('mjpeg');
      setShowObsInput(false);
      setShowMjpegInput(true);
    } else {
      setDemoType('none');
      setShowObsInput(false);
      setShowMjpegInput(false);
      setSelectedRoom(value === 'all' ? '' : value);
    }
  };

  const handleObsConnect = () => {
    if (obsStreamUrl.trim()) {
      setShowObsInput(false);
    } else {
      setShowObsInput(false);
      setDemoType('none');
    }
  };

  const handleMjpegConnect = () => {
    if (mjpegStreamUrl.trim()) {
      setShowMjpegInput(false);
    } else {
      setShowMjpegInput(false);
      setDemoType('none');
    }
  };

  const closeDemo = () => {
    setDemoType('none');
    setShowObsInput(false);
    setShowMjpegInput(false);
    setObsStreamUrl('');
    setMjpegStreamUrl('');
  };

  const getDropdownValue = () => {
    if (demoType === 'webcam') return 'webcam';
    if (demoType === 'obs') return 'obs';
    return selectedRoom || 'all';
  };

  const isDemoMode = demoType !== 'none';

  return (
    <Sidebar>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Live Monitoring</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {userRole === 'PET_OWNER' ? 'Watch your pet in real-time' : 'Monitor all pets at the clinic'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 sm:h-64">
          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#3a7d6c]" />
        </div>
      ) : activeCameras.length === 0 && !isDemoMode ? (
        <Card className="p-8 sm:p-12 text-center border-dashed">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-[#3a7d6c]/10 flex items-center justify-center">
            <Video className="h-6 w-6 sm:h-8 sm:w-8 text-[#3a7d6c]" />
          </div>
          <p className="text-muted-foreground">No active cameras configured</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add cameras in Admin → Camera Management
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
            <Button variant="outline" onClick={() => { setDemoType('webcam'); }}>
              <Webcam className="h-4 w-4 mr-2" />
              Webcam Demo
            </Button>
            <Button variant="outline" onClick={() => { setDemoType('obs'); setShowObsInput(true); }}>
              <Monitor className="h-4 w-4 mr-2" />
              OBS Stream
            </Button>
          </div>
        </Card>
      ) : isDemoMode ? (
        <div className="space-y-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-col sm:flex-row">
            <Select value={getDropdownValue()} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webcam">
                  <div className="flex items-center gap-2">
                    <Webcam className="h-4 w-4" />
                    Webcam Demo
                  </div>
                </SelectItem>
                <SelectItem value="obs">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    OBS Stream
                  </div>
                </SelectItem>
                <SelectItem value="mjpeg">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    IP Webcam (Android)
                  </div>
                </SelectItem>
                {showAllRooms && (
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      All Rooms ({activeCameras.length} cameras)
                    </div>
                  </SelectItem>
                )}
                {filteredRoomNames.map((roomName) => (
                  <SelectItem key={roomName} value={roomName}>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      {roomName} ({groupedCameras[roomName].length} cameras)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showObsInput && (
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter OBS stream URL (e.g., http://localhost:8889/live/stream/index.m3u8)"
                  value={obsStreamUrl}
                  onChange={(e) => setObsStreamUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleObsConnect} className="shrink-0">
                  <Play className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter your HLS stream URL from OBS + MediaMTX. Example: http://localhost:8889/live/stream/index.m3u8
              </p>
            </Card>
          )}

          {showMjpegInput && (
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Enter IP Webcam URL (e.g., http://192.168.1.100:8080/video)"
                  value={mjpegStreamUrl}
                  onChange={(e) => setMjpegStreamUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleMjpegConnect} className="shrink-0">
                  <Play className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use the IP Webcam app on Android. Go to &quot;Connect &gt; Start server&quot;, then enter the URL shown (e.g., http://192.168.1.100:8080/video)
              </p>
            </Card>
          )}

          {!showObsInput && !showMjpegInput && demoType === 'webcam' && (
            <div className="max-w-2xl mx-auto">
              <WebcamDisplay onClose={closeDemo} />
            </div>
          )}

          {!showObsInput && !showMjpegInput && demoType === 'obs' && obsStreamUrl && (
            <div className="max-w-2xl mx-auto">
              <OBSStreamDisplay streamUrl={obsStreamUrl} onClose={closeDemo} />
            </div>
          )}

          {!showObsInput && !showMjpegInput && demoType === 'mjpeg' && mjpegStreamUrl && (
            <div className="max-w-2xl mx-auto">
              <Card className="overflow-hidden">
                <div className="relative h-48 sm:h-64 md:h-80 bg-black">
                  <img
                    src={mjpegStreamUrl}
                    alt="IP Webcam stream"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-2 bg-muted flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#3a7d6c]" />
                  <p className="text-sm font-medium truncate">IP Webcam</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-col sm:flex-row">
            <Select 
              value={selectedRoom || 'all'} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder={userRole === 'PET_OWNER' ? "Your pet's room" : "Select room"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webcam">
                  <div className="flex items-center gap-2">
                    <Webcam className="h-4 w-4" />
                    Webcam Demo
                  </div>
                </SelectItem>
                <SelectItem value="obs">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    OBS Stream
                  </div>
                </SelectItem>
                {showAllRooms && (
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      All Rooms ({activeCameras.length} cameras)
                    </div>
                  </SelectItem>
                )}
                {filteredRoomNames.map((roomName) => (
                  <SelectItem key={roomName} value={roomName}>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      {roomName} ({groupedCameras[roomName].length} cameras)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`grid gap-3 sm:gap-4 ${
            filteredCameras.length === 1 ? 'grid-cols-1' :
            filteredCameras.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            filteredCameras.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredCameras.map((cam: Camera) => {
              const streamUrl = cam.stream_url || '';
              const isMjpeg = isMjpegStream(streamUrl);
              const roomName = cam.rooms?.name || 'Camera';
              return (
                <Card key={cam.id} className="overflow-hidden">
                  <div className="relative h-48 sm:h-64 md:h-80 bg-black">
                    {isMjpeg ? (
                      <div className="absolute inset-0">
                        <img
                          src={streamUrl}
                          alt="Camera stream"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <iframe
                        key={cam.id}
                        src={streamUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-600 px-2 py-1 rounded">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-xs font-medium">{isMjpeg ? 'IP CAM' : 'LIVE'}</span>
                    </div>
                  </div>
                  <div className="p-2 bg-muted">
                    <p className="text-sm font-medium truncate">{roomName}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-medium text-base sm:text-lg">
              {selectedRoom === 'all' || selectedRoom === '' ? 'Pets at Clinic' : `Pets in ${selectedRoom}`}
            </h3>
            {filteredPetLocations.length === 0 ? (
              <Card className="p-4 sm:p-6 text-center">
                <PawPrint className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No pets in this room</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPetLocations.map((loc: PetLocation) => (
                  <Card key={loc.id} className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <PawPrint className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{loc.pets?.name || `Pet #${loc.pet_id}`}</p>
                        <p className="text-sm text-muted-foreground truncate">{loc.rooms?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{loc.status?.replace(/_/g, ' ').toLowerCase()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Sidebar>
  );
}

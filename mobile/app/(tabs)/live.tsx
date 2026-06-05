import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useCameras, useRooms, usePets } from '../../src/hooks/useApi';
import { config } from '../../src/lib/config';
import { Video, Camera, MapPin, PawPrint, Wifi, WifiOff } from 'lucide-react-native';
import { Camera as CameraType, Room, Pet } from '../../src/types';

export default function LiveScreen() {
  const { cameras, loading: loadingCameras } = useCameras();
  const { rooms, loading: loadingRooms } = useRooms();
  const { pets } = usePets();
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function getPetForRoom(roomId: number): Pet | undefined {
    return undefined;
  }

  function handleCameraPress(camera: CameraType) {
    setSelectedCamera(camera);
    setStreamUrl(camera.stream_url || null);
  }

  function renderCamera({ item }: { item: CameraType }) {
    const room = rooms.find(r => r.id === item.room_id);
    const pet = getPetForRoom(item.room_id);

    return (
      <TouchableOpacity
        style={[styles.cameraCard, selectedCamera?.id === item.id && styles.cameraCardSelected]}
        onPress={() => handleCameraPress(item)}
      >
        <View style={styles.cameraHeader}>
          {item.is_active ? (
            <Wifi size={16} color={config.colors.success} />
          ) : (
            <WifiOff size={16} color={config.colors.error} />
          )}
          <Text style={[styles.cameraStatus, { color: item.is_active ? config.colors.success : config.colors.error }]}>
            {item.is_active ? 'Live' : 'Offline'}
          </Text>
        </View>

        <View style={styles.cameraIcon}>
          <Video size={32} color={config.colors.primary} />
        </View>

        <Text style={styles.cameraName}>{item.name}</Text>
        
        {room && (
          <View style={styles.roomTag}>
            <MapPin size={12} color="#666" />
            <Text style={styles.roomName}>{room.name}</Text>
          </View>
        )}

        {pet && (
          <View style={styles.petTag}>
            <PawPrint size={12} color={config.colors.primary} />
            <Text style={styles.petName}>{pet.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (loadingCameras || loadingRooms) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={config.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Monitoring</Text>
        <Text style={styles.subtitle}>Watch your pet in real-time</Text>
      </View>

      {cameras.length === 0 ? (
        <View style={styles.empty}>
          <Camera size={48} color="#ddd" />
          <Text style={styles.emptyText}>No cameras available</Text>
          <Text style={styles.emptySubtext}>Contact the clinic to set up live monitoring</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {cameras.map(camera => (
              <View key={camera.id}>
                {renderCamera({ item: camera })}
              </View>
            ))}
          </View>

          {selectedCamera && (
            <View style={styles.playerSection}>
              <Text style={styles.sectionTitle}>Now Streaming</Text>
              <View style={styles.player}>
                <View style={styles.playerPlaceholder}>
                  {streamUrl ? (
                    <View style={styles.streamInfo}>
                      <Video size={48} color={config.colors.primary} />
                      <Text style={styles.streamUrl}>{streamUrl}</Text>
                      <Text style={styles.streamNote}>
                        Stream URL configured. Use a video player to view the feed.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.noStream}>
                      <WifiOff size={48} color="#ddd" />
                      <Text style={styles.noStreamText}>No stream URL configured</Text>
                      <Text style={styles.noStreamSubtext}>
                        Ask clinic staff to set up streaming
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
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
  header: {
    backgroundColor: config.colors.primary,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  cameraCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cameraCardSelected: {
    borderColor: config.colors.primary,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  cameraStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  cameraIcon: {
    alignItems: 'center',
    marginVertical: 12,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  roomName: {
    fontSize: 12,
    color: '#666',
  },
  petTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  petName: {
    fontSize: 12,
    color: config.colors.primary,
    fontWeight: '500',
  },
  playerSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  player: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  playerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  streamInfo: {
    alignItems: 'center',
    padding: 20,
  },
  streamUrl: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  streamNote: {
    fontSize: 12,
    color: '#444',
    marginTop: 8,
    textAlign: 'center',
  },
  noStream: {
    alignItems: 'center',
  },
  noStreamText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  noStreamSubtext: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
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
    textAlign: 'center',
  },
});
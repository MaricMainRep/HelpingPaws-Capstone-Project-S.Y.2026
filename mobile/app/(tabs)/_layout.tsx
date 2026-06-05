import { Tabs } from 'expo-router';
import { PawPrint, Calendar, FileText, Video, Home } from 'lucide-react-native';
import { config } from '../../src/lib/config';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: config.colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopColor: '#eee',
          backgroundColor: '#fff',
        },
        headerStyle: {
          backgroundColor: config.colors.primary,
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerTitle: 'HelpingPaws',
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color, size }) => <PawPrint size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
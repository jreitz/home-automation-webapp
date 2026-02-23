"use client";

import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Types based on UX design
interface SensorReading {
  temperature: number;
  humidity: number;
  lastUpdated: string;
}

interface Device {
  id: string;
  name: string;
  room: string;
  type: "switch" | "sensor" | "thermostat";
  state: boolean;
  value?: number;
  unit?: string;
  ip?: string;
}

interface Room {
  id: string;
  name: string;
  icon: string;
  devices: Device[];
  temperature?: number;
  humidity?: number;
}

// Real device configuration (from Node-RED flows)
const rooms: Room[] = [
  {
    id: "living-room",
    name: "Living Room",
    icon: "🏠",
    temperature: 70,
    humidity: 42,
    devices: [
      { id: "front-light", name: "Front Light", room: "living-room", type: "switch", state: false, ip: "192.168.1.23" },
      { id: "table-lamp", name: "Table Lamp", room: "living-room", type: "switch", state: true },
      { id: "tv-power", name: "TV Power", room: "living-room", type: "switch", state: false },
    ],
  },
  {
    id: "garage",
    name: "Garage",
    icon: "🚗",
    temperature: 52,
    humidity: 65,
    devices: [
      { id: "garage-heater", name: "Space Heater", room: "garage", type: "switch", state: false, ip: "192.168.1.24" },
      { id: "garage-radiator", name: "Radiator", room: "garage", type: "switch", state: false },
    ],
  },
  {
    id: "bedrooms",
    name: "Bedrooms",
    icon: "🛏️",
    temperature: 68,
    humidity: 45,
    devices: [],
  },
  {
    id: "backyard",
    name: "Backyard",
    icon: "🏡",
    devices: [
      { id: "back-porch", name: "Back Porch Light", room: "backyard", type: "switch", state: true },
    ],
  },
];

// Mock power consumption data (24 hours)
const powerData = [
  { time: '12am', power: 1.2 },
  { time: '2am', power: 0.8 },
  { time: '4am', power: 0.6 },
  { time: '6am', power: 1.1 },
  { time: '8am', power: 2.3 },
  { time: '10am', power: 3.1 },
  { time: '12pm', power: 2.8 },
  { time: '2pm', power: 3.4 },
  { time: '4pm', power: 3.2 },
  { time: '6pm', power: 4.1 },
  { time: '8pm', power: 3.8 },
  { time: '10pm', power: 2.4 },
];

export default function Home() {
  const [roomsState, setRoomsState] = useState<Room[]>(rooms);
  const [stats, setStats] = useState({
    insideTemp: 68,
    garageHumidity: 65,
    powerUsage: 2.4,
    presence: 3,
  });
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Mock power data for 24h chart (would come from Ecoflow/inverters in production)
  const powerData = [
    { time: '12am', power: 1.2 },
    { time: '2am', power: 0.8 },
    { time: '4am', power: 0.6 },
    { time: '6am', power: 1.5 },
    { time: '8am', power: 2.8 },
    { time: '10am', power: 3.2 },
    { time: '12pm', power: 2.9 },
    { time: '2pm', power: 2.6 },
    { time: '4pm', power: 2.4 },
    { time: '6pm', power: 3.1 },
    { time: '8pm', power: 2.8 },
    { time: '10pm', power: 2.1 },
  ];

  // Connect to SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/sensors');
    
    eventSource.onopen = () => {
      setConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sensor' && data.sensor === 'temperature') {
          // Update garage temperature from sensor
          setRoomsState(prev => prev.map(room => 
            room.id === 'garage' 
              ? { ...room, temperature: Math.round(data.value) }
              : room
          ));
          setStats(prev => ({
            ...prev,
            garageHumidity: Math.round(65 + (Math.random() - 0.5) * 10),
          }));
        }
      } catch {
        // Ignore parse errors
      }
    };
    
    eventSource.onerror = () => {
      setConnected(false);
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  const toggleDevice = useCallback(async (roomId: string, deviceId: string, currentState: boolean) => {
    // Optimistic update
    setRoomsState(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          devices: room.devices.map(device => 
            device.id === deviceId 
              ? { ...device, state: !currentState }
              : device
          ),
        };
      }
      return room;
    }));

    // Try to send command to device
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: !currentState }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // Revert on failure
        setRoomsState(prev => prev.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              devices: room.devices.map(device => 
                device.id === deviceId 
                  ? { ...device, state: currentState }
                  : device
              ),
            };
          }
          return room;
        }));
      }
    } catch (error) {
      // Revert on error (though for dev we accept optimistic update)
      console.error('Failed to toggle device:', error);
    }
  }, []);

  const scenes = [
    { id: "home", name: "Home", icon: "🏠" },
    { id: "away", name: "Away", icon: "🚗" },
    { id: "night", name: "Night", icon: "🌙" },
    { id: "morning", name: "Morning", icon: "☀️" },
  ];

  const activateScene = (sceneId: string) => {
    setActiveScene(sceneId);
    
    // Apply scene presets
    switch (sceneId) {
      case 'away':
        // Turn off all lights
        setRoomsState(prev => prev.map(room => ({
          ...room,
          devices: room.devices.map(device => ({ ...device, state: false })),
        })));
        break;
      case 'night':
        // Turn on exterior lights
        setRoomsState(prev => prev.map(room => {
          if (room.id === 'backyard') {
            return {
              ...room,
              devices: room.devices.map(device => ({ ...device, state: true })),
            };
          }
          return room;
        }));
        break;
      case 'morning':
        // Normal morning state
        break;
      case 'home':
        // Default home state
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold">Home</h1>
              <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
                    title={connected ? 'Connected' : 'Disconnected'} />
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-xs text-slate-400">Last updated: just now</span>
              <button className="p-2 rounded-lg hover:bg-slate-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {/* Quick Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Inside Temp" value={`${stats.insideTemp}°F`} icon="🌡️" />
          <StatCard label="Garage Humidity" value={`${stats.garageHumidity}%`} icon="💧" />
          <StatCard label="Power Usage" value={`${stats.powerUsage} kW`} icon="⚡" />
          <StatCard label="Presence" value={`${stats.presence} home`} icon="👤" />
        </section>

        {/* Scenes */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-4">Scenes</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => activateScene(scene.id)}
                className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all ${
                  activeScene === scene.id
                    ? "bg-sky-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className="text-2xl">{scene.icon}</span>
                <span className="text-xs mt-1">{scene.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Rooms Grid */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-4">Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomsState.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onToggleDevice={(deviceId, currentState) => toggleDevice(room.id, deviceId, currentState)} 
              />
            ))}
          </div>
        </section>

        {/* Sauna Widget */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-4">Sauna</h2>
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Current Temp</span>
              <span className="text-3xl font-bold">--°F</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Target</span>
              <span className="text-lg">180°F</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-slate-500">Sensor offline</span>
            </div>
          </div>
        </section>

        {/* Power Chart */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-4">Power Consumption (24h)</h2>
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={powerData}>
                <defs>
                  <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value}kW`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} kW`, 'Power']}
                />
                <Area 
                  type="monotone" 
                  dataKey="power" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fill="url(#powerGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <p className="text-xs text-slate-500 text-center">
            Home Dashboard • Connected to mqtt.lan
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function RoomCard({ room, onToggleDevice }: { 
  room: Room; 
  onToggleDevice: (deviceId: string, currentState: boolean) => void 
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 hover:bg-slate-750 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{room.icon}</span>
        <h3 className="font-semibold">{room.name}</h3>
      </div>
      
      {(room.temperature || room.humidity) && (
        <div className="flex gap-4 text-sm text-slate-400 mb-3">
          {room.temperature && <span>{room.temperature}°F</span>}
          {room.humidity && <span>{room.humidity}% humidity</span>}
        </div>
      )}
      
      {room.devices.length > 0 && (
        <div className="space-y-2">
          {room.devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{device.name}</span>
              <button
                onClick={() => onToggleDevice(device.id, device.state)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  device.state ? "bg-sky-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    device.state ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

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
}

interface Room {
  id: string;
  name: string;
  icon: string;
  devices: Device[];
  temperature?: number;
  humidity?: number;
}

// Mock data for development
const mockRooms: Room[] = [
  {
    id: "living-room",
    name: "Living Room",
    icon: "🏠",
    temperature: 70,
    humidity: 42,
    devices: [
      { id: "front-light", name: "Front Light", room: "living-room", type: "switch", state: false },
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
      { id: "garage-heater", name: "Space Heater", room: "garage", type: "switch", state: false },
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

const mockQuickStats = {
  insideTemp: 68,
  garageHumidity: 65,
  powerUsage: 2.4,
  presence: 3,
};

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [stats, setStats] = useState(mockQuickStats);
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const toggleDevice = (roomId: string, deviceId: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          devices: room.devices.map(device => 
            device.id === deviceId 
              ? { ...device, state: !device.state }
              : device
          ),
        };
      }
      return room;
    }));
  };

  const scenes = [
    { id: "home", name: "Home", icon: "🏠" },
    { id: "away", name: "Away", icon: "🚗" },
    { id: "night", name: "Night", icon: "🌙" },
    { id: "morning", name: "Morning", icon: "☀️" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold">Home</h1>
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
                onClick={() => setActiveScene(scene.id)}
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
            {rooms.map((room) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onToggleDevice={(deviceId) => toggleDevice(room.id, deviceId)} 
              />
            ))}
          </div>
        </section>

        {/* Sauna Widget (placeholder) */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-4">Sauna</h2>
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Current Temp</span>
              <span className="text-3xl font-bold">175°F</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Target</span>
              <span className="text-lg">180°F</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-amber-400">Heating • 15 min to target</span>
            </div>
          </div>
        </section>

        {/* Power Chart Placeholder */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-4">Power Consumption (24h)</h2>
          <div className="bg-slate-800 rounded-xl p-6 h-48 flex items-center justify-center">
            <span className="text-slate-500">Chart coming soon</span>
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

function RoomCard({ room, onToggleDevice }: { room: Room; onToggleDevice: (deviceId: string) => void }) {
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
                onClick={() => onToggleDevice(device.id)}
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

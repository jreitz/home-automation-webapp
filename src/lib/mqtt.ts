import mqtt, { MqttClient } from 'mqtt';

// MQTT configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://mqtt.lan:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

// Topic patterns for Shelly devices
const SHELLY_TOPICS = {
  temperature: 'shellies/+/info',
  humidity: 'shellies/+/info',
  button: 'shellies/+/input_event/+',
  switch: 'shellies/+/relay/+',
  power: 'shellies/+/relay/+/power',
};

// Singleton MQTT client
let client: MqttClient | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

// Subscriber callbacks
type SensorCallback = (data: SensorData) => void;
const sensorCallbacks: Set<SensorCallback> = new Set();

export interface SensorData {
  topic: string;
  device: string;
  type: 'temperature' | 'humidity' | 'power' | 'button';
  value: number;
  unit?: string;
  timestamp: Date;
}

export interface DeviceState {
  deviceId: string;
  name: string;
  state: boolean;
  power?: number;
}

export function getMQTTStatus() {
  return connectionStatus;
}

export function connectMQTT(): Promise<MqttClient> {
  return new Promise((resolve, reject) => {
    if (client && connectionStatus === 'connected') {
      resolve(client);
      return;
    }

    connectionStatus = 'connecting';
    
    const options: mqtt.IClientOptions = {
      clientId: `home-dashboard-${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
    };

    if (MQTT_USERNAME && MQTT_PASSWORD) {
      options.username = MQTT_USERNAME;
      options.password = MQTT_PASSWORD;
    }

    client = mqtt.connect(MQTT_BROKER, options);

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      connectionStatus = 'connected';
      
      // Subscribe to Shelly sensor topics
      client?.subscribe('shellies/+/info', (err) => {
        if (err) console.error('Failed to subscribe to sensor topics:', err);
      });
      
      client?.subscribe('shellies/+/relay/+', (err) => {
        if (err) console.error('Failed to subscribe to relay topics:', err);
      });

      resolve(client!);
    });

    client.on('message', (topic, message) => {
      try {
        const payload = message.toString();
        const data = parseShellyMessage(topic, payload);
        if (data) {
          notifySubscribers(data);
        }
      } catch (err) {
        console.error('Error parsing MQTT message:', err);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      connectionStatus = 'disconnected';
      reject(err);
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
      connectionStatus = 'disconnected';
    });

    client.on('reconnect', () => {
      console.log('Reconnecting to MQTT broker...');
      connectionStatus = 'connecting';
    });
  });
}

export function disconnectMQTT() {
  if (client) {
    client.end();
    client = null;
    connectionStatus = 'disconnected';
  }
}

// Parse Shelly device messages
function parseShellyMessage(topic: string, payload: string): SensorData | null {
  // Match shellies/<device-id>/info
  const deviceMatch = topic.match(/shellies\/([^/]+)\/info/);
  if (!deviceMatch) return null;

  const deviceId = deviceMatch[1];
  
  try {
    const data = JSON.parse(payload);
    
    // Shelly H&T sensor
    if (data.temp !== undefined) {
      return {
        topic,
        device: deviceId,
        type: 'temperature',
        value: parseFloat(data.temp),
        unit: '°C',
        timestamp: new Date(),
      };
    }
    
    if (data.humidity !== undefined) {
      return {
        topic,
        device: deviceId,
        type: 'humidity',
        value: parseFloat(data.humidity),
        unit: '%',
        timestamp: new Date(),
      };
    }
  } catch {
    // Not JSON, might be plain text
  }
  
  return null;
}

// Subscribe to sensor updates
export function subscribeToSensors(callback: SensorCallback): () => void {
  sensorCallbacks.add(callback);
  return () => sensorCallbacks.delete(callback);
}

function notifySubscribers(data: SensorData) {
  sensorCallbacks.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error('Error in sensor callback:', err);
    }
  });
}

// Control a Shelly switch
export async function setShellySwitch(deviceIp: string, switchId: number, on: boolean): Promise<boolean> {
  try {
    const response = await fetch(`http://${deviceIp}/rpc/Switch.Set?id=${switchId}&on=${on}`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.wasOn !== undefined;
  } catch (err) {
    console.error(`Failed to control Shelly switch ${deviceIp}:`, err);
    return false;
  }
}

// Get Shelly switch status
export async function getShellyStatus(deviceIp: string): Promise<DeviceState | null> {
  try {
    const response = await fetch(`http://${deviceIp}/rpc/Switch.GetStatus?id=0`);
    const data = await response.json();
    
    return {
      deviceId: deviceIp,
      name: deviceIp, // Could be enhanced to show friendly name
      state: data.output || false,
      power: data.apower,
    };
  } catch (err) {
    console.error(`Failed to get Shelly status ${deviceIp}:`, err);
    return null;
  }
}

// Device registry with known devices
export const knownDevices = {
  // Sensors
  garageTempSensor: {
    type: 'sensor' as const,
    name: 'Garage Temperature',
    topic: 'shellies/shellyht-7917A0/info',
    deviceType: 'shelly-ht',
  },
  // Switches
  frontPorchLight: {
    type: 'switch' as const,
    name: 'Front Porch Lights',
    ip: '192.168.1.23',
    deviceType: 'shelly-plus-1',
  },
  garagePlug: {
    type: 'switch' as const,
    name: 'Garage Plug',
    ip: '192.168.1.24',
    deviceType: 'shelly-plug-us',
  },
};

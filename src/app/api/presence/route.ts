import { NextResponse } from 'next/server';

// Mikrotik presence detection
// Uses RouterOS API to check WiFi registration table

export const dynamic = 'force-dynamic';

// Known family devices by MAC address
const FAMILY_DEVICES: Record<string, string> = {
  // Jay's phone
  'xx:xx:xx:xx:xx:01': 'Jay',
  // Ada's phone  
  'xx:xx:xx:xx:xx:02': 'Ada',
  // Amy's phone
  'xx:xx:xx:xx:xx:03': 'Amy',
};

// Mikrotik RouterOS API configuration
const MIKROTIK_HOST = process.env.MIKROTIK_HOST || '192.168.1.1';
const MIKROTIK_USER = process.env.MIKROTIK_USER || 'admin';
const MIKROTIK_PASS = process.env.MIKROTIK_PASS || '';

interface PresenceStatus {
  name: string;
  isHome: boolean;
  lastSeen?: Date;
}

export async function GET() {
  // For development, return mock presence data
  // In production, this would query Mikrotik RouterOS API
  
  const mockPresence: PresenceStatus[] = [
    { name: 'Jay', isHome: true },
    { name: 'Ada', isHome: true },
    { name: 'Amy', isHome: true },
  ];
  
  // In production, the actual implementation would:
  // 1. Connect to Mikrotik via REST API (RouterOS 7+)
  // 2. Query /interface/wireless/registration-table
  // 3. Match MAC addresses to known family devices
  // 4. Return presence status for each person
  
  /*
  // Production implementation (requires Mikrotik REST API):
  try {
    const response = await fetch(
      `https://${MIKROTIK_HOST}/rest/interface/wireless/registration-table`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${MIKROTIK_USER}:${MIKROTIK_PASS}`).toString('base64')}`,
        },
        cache: 'no-store',
      }
    );
    
    const devices = await response.json();
    const registeredMacs = new Set(devices.map((d: any) => d['mac-address']));
    
    const presence = Object.entries(FAMILY_DEVICES).map(([mac, name]) => ({
      name,
      isHome: registeredMacs.has(mac),
    }));
    
    return NextResponse.json({ presence, count: presence.filter(p => p.isHome).length });
  } catch (error) {
    console.error('Failed to fetch Mikrotik presence:', error);
    return NextResponse.json({ presence: mockPresence, simulated: true });
  }
  */
  
  return NextResponse.json({ 
    presence: mockPresence, 
    count: mockPresence.filter(p => p.isHome).length,
    simulated: true,
  });
}

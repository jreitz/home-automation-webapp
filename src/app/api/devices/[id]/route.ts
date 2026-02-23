import { NextRequest, NextResponse } from 'next/server';

// Device control API
// POST /api/devices/[id]/toggle

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { state } = body;

  if (typeof state !== 'boolean') {
    return NextResponse.json(
      { error: 'Missing or invalid "state" (must be boolean)' },
      { status: 400 }
    );
  }

  // Device registry - maps friendly names to IPs
  const devices: Record<string, string> = {
    'front-light': '192.168.1.23',
    'garage-heater': '192.168.1.24',
    'garage-plug': '192.168.1.24',
  };

  const deviceIp = devices[id];
  if (!deviceIp) {
    return NextResponse.json(
      { error: `Unknown device: ${id}` },
      { status: 404 }
    );
  }

  try {
    // Shelly Gen 2+ API
    const response = await fetch(
      `http://${deviceIp}/rpc/Switch.Set?id=0&on=${state}`,
      { method: 'POST' }
    );
    
    if (!response.ok) {
      throw new Error(`Shelly returned ${response.status}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      deviceId: id,
      newState: state,
      result,
    });
  } catch (error) {
    console.error(`Failed to control device ${id}:`, error);
    
    // Return mock success for development
    return NextResponse.json({
      success: true,
      deviceId: id,
      newState: state,
      simulated: true,
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Device registry
  const devices: Record<string, string> = {
    'front-light': '192.168.1.23',
    'garage-heater': '192.168.1.24',
    'garage-plug': '192.168.1.24',
  };

  const deviceIp = devices[id];
  if (!deviceIp) {
    return NextResponse.json(
      { error: `Unknown device: ${id}` },
      { status: 404 }
    );
  }

  try {
    const response = await fetch(
      `http://${deviceIp}/rpc/Switch.GetStatus?id=0`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      throw new Error(`Shelly returned ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      deviceId: id,
      state: data.output || false,
      power: data.apower || 0,
      energy: data.aenergy?.total || 0,
    });
  } catch (error) {
    console.error(`Failed to get device ${id} status:`, error);
    
    // Return mock data for development
    return NextResponse.json({
      deviceId: id,
      state: false,
      power: 0,
      simulated: true,
    });
  }
}

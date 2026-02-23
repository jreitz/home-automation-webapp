# Home Automation Dashboard

A real-time home automation dashboard for controlling and monitoring smart home devices.

## Features

- **Quick Stats**: Temperature, humidity, power usage, presence at a glance
- **Room Controls**: Toggle lights, heaters, and devices per room
- **Scenes**: One-tap activation for Away, Home, Night, Morning modes
- **Power Monitoring**: 24-hour power consumption chart
- **Sauna Widget**: Temperature monitoring (sensor coming soon)
- **Real-time Updates**: SSE connection to MQTT broker

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Protocols**: MQTT, SSE, REST

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your devices
nano .env

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Example |
|----------|-------------|---------|
| `MQTT_BROKER` | MQTT broker URL | `mqtt://mqtt.lan:1883` |
| `MQTT_USERNAME` | MQTT username (optional) | `homeassistant` |
| `MQTT_PASSWORD` | MQTT password (optional) | `secret` |

### Device Configuration

Devices are configured in `src/app/page.tsx` in the `rooms` array. Each device needs:

```typescript
{
  id: "device-id",           // Unique identifier
  name: "Device Name",       // Display name
  room: "room-id",           // Parent room ID
  type: "switch",            // switch | sensor | thermostat
  state: false,              // Current state
  ip: "192.168.1.x",         // Device IP (for direct control)
}
```

## Deployment

### Docker

```bash
# Build image
docker build -t home-automation-dashboard .

# Run container
docker run -p 3000:3000 \
  -e MQTT_BROKER=mqtt://mqtt.lan:1883 \
  home-automation-dashboard
```

### Docker Compose

```bash
docker-compose up -d
```

### Vercel

```bash
vercel deploy
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sensors` | GET | SSE stream for real-time sensor updates |
| `/api/devices/:id` | POST | Toggle device state |
| `/api/presence` | GET | Family presence status from Mikrotik |

## Device Support

### Currently Integrated

| Device Type | Protocol | Notes |
|-------------|----------|-------|
| Shelly switches | HTTP API | Gen 1 & Gen 2 |
| Shelly sensors | MQTT | H&T, Button |
| Wemo switches | SOAP | Legacy devices |
| Mikrotik routers | REST API | Presence detection |

### Planned Support

- Ecoflow Delta Pro Ultra (MQTT)
- Stitch/Monoprice outlets
- Sauna sensor (Shelly Pill + thermocouple)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Dashboard                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ Stats    │ │ Rooms    │ │ Scenes   │ │ Power Chart    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────┘ │
└───────┼────────────┼────────────┼─────────────────┼────────┘
        │            │            │                 │
        └────────────┴──────┬─────┴─────────────────┘
                            │
                   ┌────────▼────────┐
                   │   API Routes    │
                   │  /api/sensors   │
                   │  /api/devices   │
                   └────────┬────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
  ┌────▼─────┐        ┌─────▼──────┐       ┌────▼─────┐
  │  MQTT    │        │   REST     │       │  Mikrotik│
  │  Broker  │        │   APIs     │       │  Router  │
  └──────────┘        └────────────┘       └──────────┘
```

## Related

- [UX Design Document](../home-automation-ux-design.md)
- [FLA-10: Linear Task](https://linear.app)

## License

Private project for personal use.

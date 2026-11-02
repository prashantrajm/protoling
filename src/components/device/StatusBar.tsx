import type { Device } from '@/lib/devices'

/**
 * Status bar and camera cut-out, drawn from scratch so the repo carries no
 * manufacturer artwork. Sits above the screen and ignores pointer events.
 */
export function DeviceChrome({
  device,
  tone,
  statusBar,
}: {
  device: Device
  tone: 'dark' | 'light'
  statusBar: boolean
}) {
  const color = tone === 'dark' ? '#0a0a0a' : '#ffffff'
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[2147483000]"
      style={{ height: device.safeArea.top, color }}
    >
      {device.cutout === 'dynamic-island' && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
          style={{ top: 11, width: 124, height: 36 }}
        />
      )}
      {device.cutout === 'punch-hole' && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
          style={{ top: 14, width: 22, height: 22 }}
        />
      )}
      {statusBar &&
        (device.platform === 'ios' ? <IOSStatus device={device} /> : <AndroidStatus />)}
    </div>
  )
}

function IOSStatus({ device }: { device: Device }) {
  const island = device.cutout === 'dynamic-island'
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-between font-semibold"
      style={{
        top: island ? 17 : 0,
        height: island ? 24 : device.safeArea.top,
        paddingInline: island ? 34 : 16,
        fontSize: island ? 17 : 12,
        letterSpacing: '-0.01em',
        fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      }}
    >
      <span style={{ width: island ? 96 : 'auto', textAlign: 'center' }}>9:41</span>
      <span
        className="flex items-center gap-[6px]"
        style={{ width: island ? 96 : 'auto', justifyContent: 'center' }}
      >
        <Signal />
        <Wifi />
        <Battery />
      </span>
    </div>
  )
}

function AndroidStatus() {
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-between px-6 text-[14px] font-medium"
      style={{ top: 14, height: 22, fontFamily: 'Roboto, system-ui, sans-serif' }}
    >
      <span>9:41</span>
      <span className="flex items-center gap-[5px]">
        <Wifi />
        <Signal />
        <Battery />
      </span>
    </div>
  )
}

function Signal() {
  return (
    <svg aria-hidden width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  )
}

function Wifi() {
  return (
    <svg aria-hidden width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .7C5.3.7 2.8 1.7.9 3.5L2 4.7a8.6 8.6 0 0 1 6-2.4Z" />
      <path d="M8 5.5c1.4 0 2.7.5 3.7 1.4l1.1-1.2A7 7 0 0 0 8 3.9a7 7 0 0 0-4.8 1.8l1.1 1.2A5.4 5.4 0 0 1 8 5.5Z" />
      <path d="M8 8.6c.6 0 1.2.2 1.6.6L8 11.1 6.4 9.2c.4-.4 1-.6 1.6-.6Z" />
    </svg>
  )
}

function Battery() {
  return (
    <svg aria-hidden width="27" height="13" viewBox="0 0 27 13" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="12"
        rx="3.8"
        stroke="currentColor"
        opacity="0.4"
      />
      <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
      <path
        d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  )
}

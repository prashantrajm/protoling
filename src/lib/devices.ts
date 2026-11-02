/**
 * Device catalog. Sizes are CSS points (iOS) or dp (Android), which is what a
 * web layout sees on the real device. Safe areas are portrait insets.
 *
 * Frames are drawn as plain rounded rectangles plus our own status bar and
 * Dynamic Island SVGs. No manufacturer artwork is used.
 */
export type DeviceId =
  | 'iphone-17-pro'
  | 'iphone-17-pro-max'
  | 'iphone-air'
  | 'iphone-16'
  | 'iphone-15-pro'
  | 'iphone-15-pro-max'
  | 'iphone-se'
  | 'pixel-8'

export interface Device {
  id: DeviceId
  name: string
  platform: 'ios' | 'android'
  width: number
  height: number
  /** Display corner radius, in the same units as width and height. */
  radius: number
  safeArea: { top: number; right: number; bottom: number; left: number }
  /** Top cut-out drawn over the screen. */
  cutout: 'dynamic-island' | 'punch-hole' | 'none'
}

const iphoneIsland = { top: 62, right: 0, bottom: 34, left: 0 }

export const devices: Record<DeviceId, Device> = {
  'iphone-17-pro': {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    platform: 'ios',
    width: 402,
    height: 874,
    radius: 62,
    safeArea: iphoneIsland,
    cutout: 'dynamic-island',
  },
  'iphone-17-pro-max': {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    platform: 'ios',
    width: 440,
    height: 956,
    radius: 62,
    safeArea: iphoneIsland,
    cutout: 'dynamic-island',
  },
  'iphone-air': {
    id: 'iphone-air',
    name: 'iPhone Air',
    platform: 'ios',
    width: 420,
    height: 912,
    radius: 62,
    safeArea: iphoneIsland,
    cutout: 'dynamic-island',
  },
  'iphone-16': {
    id: 'iphone-16',
    name: 'iPhone 16',
    platform: 'ios',
    width: 393,
    height: 852,
    radius: 55,
    safeArea: { top: 59, right: 0, bottom: 34, left: 0 },
    cutout: 'dynamic-island',
  },
  'iphone-15-pro': {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    platform: 'ios',
    width: 393,
    height: 852,
    radius: 55,
    safeArea: { top: 59, right: 0, bottom: 34, left: 0 },
    cutout: 'dynamic-island',
  },
  'iphone-15-pro-max': {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    platform: 'ios',
    width: 430,
    height: 932,
    radius: 55,
    safeArea: { top: 59, right: 0, bottom: 34, left: 0 },
    cutout: 'dynamic-island',
  },
  'iphone-se': {
    id: 'iphone-se',
    name: 'iPhone SE',
    platform: 'ios',
    width: 375,
    height: 667,
    radius: 0,
    safeArea: { top: 20, right: 0, bottom: 0, left: 0 },
    cutout: 'none',
  },
  'pixel-8': {
    id: 'pixel-8',
    name: 'Pixel 8',
    platform: 'android',
    width: 412,
    height: 915,
    radius: 48,
    safeArea: { top: 48, right: 0, bottom: 24, left: 0 },
    cutout: 'punch-hole',
  },
}

export const deviceIds = Object.keys(devices) as DeviceId[]

export const defaultDeviceId: DeviceId = 'iphone-17-pro'

export function getDevice(id: string | undefined): Device {
  return devices[id as DeviceId] ?? devices[defaultDeviceId]
}


export const ROOMS = Array.from({ length: 41 }, (_, i) => ({
  id: i + 1,
  roomNumber: String(i + 1).padStart(2, '0'),
  prevWater: 0,
  prevElec: 0,
}))
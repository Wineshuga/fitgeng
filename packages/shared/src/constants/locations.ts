/**
 * Nigerian location reference data for filters and pickers.
 * Lagos is the launch market, so its areas are listed in detail. Other states
 * accept free-text areas until they are expanded here.
 */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
] as const;
export type NigerianState = (typeof NIGERIAN_STATES)[number];

export const LAGOS_AREAS = [
  'Agege', 'Ajah', 'Alimosho', 'Amuwo Odofin', 'Anthony', 'Apapa', 'Badagry',
  'Banana Island', 'Chevron', 'Egbeda', 'Epe', 'Festac', 'Gbagada', 'Ikate', 'Ikeja',
  'Ikeja GRA', 'Ikorodu', 'Ikotun', 'Ikoyi', 'Ilupeju', 'Isolo', 'Ketu', 'Lekki',
  'Lekki Phase 1', 'Magodo', 'Maryland', 'Mushin', 'Ogba', 'Ogudu', 'Ojo', 'Ojodu',
  'Ojota', 'Oniru', 'Opebi', 'Osapa London', 'Oshodi', 'Sangotedo', 'Surulere',
  'Victoria Island', 'Yaba',
] as const;

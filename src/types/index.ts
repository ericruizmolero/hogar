export type PropertyStatus = 'pending' | 'contacted' | 'visited' | 'favorite' | 'discarded';

export type CallResult = 'no_answer' | 'scheduled_visit' | 'info_received' | 'not_available' | 'other';

export interface Contact {
  name: string;
  phone: string;
  phone2?: string;
  email: string;
  agency: string;
}

export interface Property {
  id: string;
  url: string;
  title: string;
  zone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  price: number;
  pricePerMeter: number;
  builtSquareMeters: number;
  usableSquareMeters: number;
  squareMeters: number; // Mantener por compatibilidad
  rooms: number;
  floor: string;
  bathrooms: number;
  terrace: boolean;
  balcony: boolean;
  parkingIncluded: boolean;
  parkingOptional: boolean;
  elevator: boolean;
  yearBuilt: number;
  orientation: string;
  needsRenovation: boolean;
  daysPublished: number;
  photos: string[];
  contact: Contact;
  status: PropertyStatus;
  notes: string;
  callNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Call {
  id: string;
  propertyId: string;
  date: Date;
  duration: number;
  result: CallResult;
  notes: string;
}

export interface Reminder {
  id: string;
  propertyId: string;
  date: Date;
  message: string;
  completed: boolean;
}

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  visited: 'Visitado',
  favorite: 'Favorito',
  discarded: 'Descartado',
};

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  visited: 'bg-green-100 text-green-800',
  favorite: 'bg-yellow-100 text-yellow-800',
  discarded: 'bg-red-100 text-red-800',
};

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  no_answer: 'No contestó',
  scheduled_visit: 'Visita programada',
  info_received: 'Información recibida',
  not_available: 'No disponible',
  other: 'Otro',
};

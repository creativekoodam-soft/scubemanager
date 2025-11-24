export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Booking {
  id: string;
  clientName: string;
  phoneNumber?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h format)
  durationHours: number;
  actualEndTime?: string; // The time the session actually ended
  type: string; // e.g., Vocal, Mixing, Jamming, Dubbing
  status: BookingStatus;
  createdAt: number;
  notes?: string;
  invoiceDetails?: {
    ratePerHour: number;
    totalAmount: number;
    generatedAt: number;
  };
}

export interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalHours: number;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  REPORTS = 'REPORTS'
}
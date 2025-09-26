export interface Hotel {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalRooms: number;
  subscription: {
    plan: 'trial' | 'basic' | 'premium';
    status: 'active' | 'inactive' | 'canceled';
    expiresAt: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  settings: {
    servicesEnabled: {
      callServiceBoy: boolean;
      orderFood: boolean;
      requestRoomService: boolean;
      lodgeComplaint: boolean;
      customMessage: boolean;
    };
    notifications: {
      sound: boolean;
      email: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  _id: string;
  hotelId: string;
  number: string;
  name: string;
  qrCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  _id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  type: 'call-service' | 'order-food' | 'room-service' | 'complaint' | 'custom-message';
  message: string;
  status: 'pending' | 'in-progress' | 'completed' | 'canceled';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  hotelId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guest {
  _id: string;
  hotelId: string;
  name: string;
  email: string;
  phone: string;
  idType: string;
  idNumber: string;
  address: string;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children: number;
  roomId: string;
  roomNumber: string;
  roomType: string;
  ratePerNight: number;
  totalNights: number;
  totalAmount: number;
  advancePayment: number;
  paidAmount: number;
  pendingAmount: number;
  additionalCharges?: number;
  specialRequests?: string;
  status: 'checked-in' | 'checked-out';
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestPortalProps {
  hotelId: string;
  roomId: string;
}

export interface AdminDashboardProps {
  hotel: Hotel;
  user: User;
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(hotelData: any) {
    return this.request<{ token: string; user: any; hotel: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(hotelData),
    });
  }

  // Hotel endpoints
  async getHotel(id: string) {
    return this.request<any>(`/hotels/${id}`);
  }

  async updateHotel(id: string, data: any) {
    return this.request<any>(`/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Room endpoints
  async getRooms(hotelId: string) {
    return this.request<any[]>(`/hotels/${hotelId}/rooms`);
  }

  async createRoom(hotelId: string, roomData: any) {
    return this.request<any>(`/hotels/${hotelId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateRoom(hotelId: string, roomId: string, data: any) {
    return this.request<any>(`/hotels/${hotelId}/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(hotelId: string, roomId: string) {
    return this.request<any>(`/hotels/${hotelId}/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  // Request endpoints
  async getRequests(hotelId: string) {
    return this.request<any[]>(`/hotels/${hotelId}/requests`);
  }

  async createRequest(hotelId: string, requestData: any) {
    return this.request<any>(`/hotels/${hotelId}/requests`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequest(hotelId: string, requestId: string, data: any) {
    return this.request<any>(`/hotels/${hotelId}/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Guest portal endpoints
  async getGuestPortalData(hotelId: string, roomId: string) {
    return this.request<any>(`/guest/${hotelId}/${roomId}`);
  }

  async submitGuestRequest(hotelId: string, roomId: string, requestData: {
  type: string;
  guestPhone: string;
  message?: string;
  priority?: 'low' | 'medium' | 'high';
  orderDetails?: any;
}) {
  return this.request<any>(`/guest/${hotelId}/${roomId}/request`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

  // Food Menu endpoints
  async getFoodMenu(hotelId: string) {
    return this.request<any[]>(`/hotels/${hotelId}/food-menu`);
  }

  async createFoodItem(hotelId: string, itemData: any) {
    return this.request<any>(`/hotels/${hotelId}/food-menu`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateFoodItem(hotelId: string, itemId: string, data: any) {
    return this.request<any>(`/hotels/${hotelId}/food-menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFoodItem(hotelId: string, itemId: string) {
    return this.request<any>(`/hotels/${hotelId}/food-menu/${itemId}`, {
      method: 'DELETE',
    });
  }

  async getGuestFoodMenu(hotelId: string) {
    const url = `${this.baseURL}/guest/${hotelId}/food-menu`;
    console.log('Fetching food menu from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Food menu API response not ok:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Food menu data received:', data);
    return data;
  }

  // Room Service Menu endpoints
  async getRoomServiceMenu(hotelId: string) {
    return this.request<any[]>(`/hotels/${hotelId}/room-service-menu`);
  }

  async createRoomServiceItem(hotelId: string, itemData: any) {
    return this.request<any>(`/hotels/${hotelId}/room-service-menu`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateRoomServiceItem(hotelId: string, itemId: string, data: any) {
    return this.request<any>(`/hotels/${hotelId}/room-service-menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoomServiceItem(hotelId: string, itemId: string) {
    return this.request<any>(`/hotels/${hotelId}/room-service-menu/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Complaint Menu endpoints
  async getComplaintMenu(hotelId: string) {
    return this.request<any[]>(`/hotels/${hotelId}/complaint-menu`);
  }

  async createComplaintItem(hotelId: string, itemData: any) {
    return this.request<any>(`/hotels/${hotelId}/complaint-menu`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateComplaintItem(hotelId: string, itemId: string, data: any) {
    return this.request<any>(`/hotels/${hotelId}/complaint-menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComplaintItem(hotelId: string, itemId: string) {
    return this.request<any>(`/hotels/${hotelId}/complaint-menu/${itemId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

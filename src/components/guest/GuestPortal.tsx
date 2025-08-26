import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Phone,
  UtensilsCrossed,
  MessageSquare,
  ShoppingCart,
  X,
  Plus,
  Minus,
  ArrowLeft,
  Clock,
  Car,
  Shield,
  User,
  Home,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiClient } from "../../utils/api";
import { ThemeToggle } from "../ui/ThemeToggle";

interface GuestPortalProps {
  hotelId: string;
  roomId: string;
}

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface RoomServiceItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  isAvailable: boolean;
}

interface ComplaintItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  isAvailable: boolean;
}

interface CartItem extends FoodItem {
  quantity: number;
}

const GuestPortal: React.FC<GuestPortalProps> = ({ hotelId, roomId }) => {
  // Get hotelId and roomId from URL params if not provided as props
  const { hotelId: urlHotelId, roomId: urlRoomId } = useParams<{
    hotelId: string;
    roomId: string;
  }>();
  const actualHotelId = hotelId || urlHotelId || "";
  const actualRoomId = roomId || urlRoomId || "";

  const [step, setStep] = useState<"phone" | "services" | "service-detail">(
    "phone"
  );
  const [activeService, setActiveService] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hotelData, setHotelData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [roomServiceItems, setRoomServiceItems] = useState<RoomServiceItem[]>(
    []
  );
  const [complaintItems, setComplaintItems] = useState<ComplaintItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [customMessage, setCustomMessage] = useState("");

  const fetchGuestPortalData = useCallback(async () => {
    try {
      console.log(
        "Fetching guest portal data for hotel:",
        actualHotelId,
        "room:",
        actualRoomId
      );
      const data = await apiClient.getGuestPortalData(
        actualHotelId,
        actualRoomId
      );
      console.log("Guest portal data received:", data);
      setHotelData(data.hotel);
      setRoomData(data.room);
    } catch (error) {
      console.error("Failed to load guest portal data:", error);
      toast.error("Failed to load room information");
    }
  }, [actualHotelId, actualRoomId]);

  const fetchFoodItems = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching food items for hotel:", actualHotelId);
      const data = await apiClient.getGuestFoodMenu(actualHotelId);
      console.log("Food items received:", data);
      setFoodItems(data.filter((item: FoodItem) => item.isAvailable));
    } catch (error) {
      console.error("Failed to load food menu:", error);
      toast.error("Failed to load food menu");
      setFoodItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [actualHotelId]);

  const fetchRoomServiceItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGuestRoomServiceMenu(actualHotelId);
      setRoomServiceItems(
        data.filter((item: RoomServiceItem) => item.isAvailable)
      );
    } catch (error) {
      console.error("Failed to load room service menu:", error);
      toast.error("Failed to load room service menu");
    } finally {
      setLoading(false);
    }
  }, [actualHotelId]);

  const fetchComplaintItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGuestComplaintMenu(actualHotelId);
      setComplaintItems(data.filter((item: ComplaintItem) => item.isAvailable));
    } catch (error) {
      console.error("Failed to load complaint options:", error);
      toast.error("Failed to load complaint options");
    } finally {
      setLoading(false);
    }
  }, [actualHotelId]);

  useEffect(() => {
    console.log(
      "GuestPortal mounted with hotelId:",
      actualHotelId,
      "roomId:",
      actualRoomId
    );
    fetchGuestPortalData();
  }, [actualHotelId, actualRoomId, fetchGuestPortalData]);

  useEffect(() => {
    console.log("Active service changed to:", activeService);
    if (activeService === "food") {
      fetchFoodItems();
    } else if (activeService === "room-service") {
      fetchRoomServiceItems();
    } else if (activeService === "complaint") {
      fetchComplaintItems();
    }
  }, [
    activeService,
    fetchFoodItems,
    fetchRoomServiceItems,
    fetchComplaintItems,
  ]);

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem._id === item._id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item._id === id) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const submitRequest = async (type: string, details: any) => {
    try {
      setLoading(true);

      const requestData: any = {
        type,
        guestPhone: phoneNumber.trim(),
        priority: "medium",
      };

      if (type === "order-food" && details) {
        requestData.orderDetails = details;
      } else if (type === "room-service" && details) {
        requestData.serviceDetails = details;
      } else if (type === "complaint" && details) {
        requestData.complaintDetails = details;
      } else if (type === "custom-message" && details) {
        requestData.customMessageDetails = details;
      } else if (type === "call-service-boy" && details) {
        requestData.callServiceBoyDetails = details;
      } else if (type === "security-alert" && details) {
        requestData.securityAlertDetails = details;
      }

      await apiClient.submitGuestRequest(
        actualHotelId,
        actualRoomId,
        requestData
      );

      toast.success("Request submitted successfully!");
      setStep("services");
      setActiveService(null);
      setCustomMessage("");
      setCart([]);
    } catch (error) {
      console.error("Failed to submit request:", error);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleFoodOrder = () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }

    const orderDetails = {
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: getTotalPrice(),
    };

    submitRequest("order-food", orderDetails);
  };

  const handleRoomServiceRequest = (service: RoomServiceItem) => {
    const serviceDetails = {
      serviceName: service.name,
      description: service.description,
      category: service.category,
      estimatedTime: service.estimatedTime,
    };
    submitRequest("room-service", serviceDetails);
  };

  const handleComplaintSubmission = (complaint: ComplaintItem) => {
    const complaintDetails = {
      complaintName: complaint.name,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
    };
    submitRequest("complaint", complaintDetails);
  };

  const handleCustomMessageSubmission = () => {
    if (!customMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const customMessageDetails = {
      message: customMessage.trim(),
    };
    submitRequest("custom-message", customMessageDetails);
  };

  const handleCallServiceBoy = () => {
    submitRequest("custom-message", {
      message: "Guest has requested immediate assistance from service boy - Call Service Boy Request",
    });
  };

  const handleSecurityAlert = () => {
    // Play alarm sound
    try {
      const audio = new Audio("/sounds/alarm.mp3");
      audio.play().catch((error) => {
        console.warn("Could not play alarm sound:", error);
      });
    } catch (error) {
      console.warn("Error creating audio element:", error);
    }

    submitRequest("security-alert", {
      alertType: "Security Emergency",
      description: "Guest has activated the security alert button",
      category: "Emergency",
      priority: "high",
    });
  };

  const handleEmergencyCall = () => {
    const phone =
      hotelData?.settings?.emergencyContact?.phone || "+91 9876543210";
    window.location.href = `tel:${phone}`;
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (phoneNumber.trim().length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setStep("services");
  };

  const getUniqueCategories = (items: any[]) => {
    const categories = items.map((item) => item.category);
    return ["All", ...Array.from(new Set(categories))];
  };

  const filterItemsByCategory = (items: any[]) => {
    return selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900";
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700";
    }
  };

  // Helper function to check if a service is enabled
  const isServiceEnabled = (serviceKey: string) => {
    return hotelData?.settings?.servicesEnabled?.[serviceKey] !== false;
  };

  // Helper function to get service status
  const getServiceStatus = (serviceKey: string) => {
    const enabled = isServiceEnabled(serviceKey);
    return {
      enabled,
      statusText: enabled ? "Available" : "Not Available",
      statusClass: enabled
        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    };
  };

  // Phone Number Step
  if (step === "phone") {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          {/* Hotel Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome to {hotelData?.name || "Hotel"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Room {roomData?.number || "Loading..."}
            </p>
          </div>

          {/* Phone Input Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              Enter Your Phone Number
            </h2>
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent text-center text-lg font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-700 text-white py-4 rounded-xl font-semibold hover:bg-slate-800 transition-colors text-lg"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Services Selection Step
  if (step === "services") {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Welcome Header */}
        <div className="bg-slate-700 dark:bg-slate-800 text-white p-6 mb-8">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome, Guest!</h1>
              <p className="text-slate-300 dark:text-slate-400">
                Room {roomData?.number} •{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-slate-600 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-white">
                Verified Guest
              </span>
            </div>
          </div>
        </div>

        {/* Hotel Services Section */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Hotel Services
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Request services or assistance during your stay
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Food Menu */}
              <button
                onClick={() => {
                  if (isServiceEnabled("orderFood")) {
                    setActiveService("food");
                    setStep("service-detail");
                  } else {
                    toast.error(
                      "Food ordering service is currently unavailable"
                    );
                  }
                }}
                disabled={!isServiceEnabled("orderFood")}
                className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center transition-all duration-200 group ${
                  isServiceEnabled("orderFood")
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isServiceEnabled("orderFood")
                      ? "group-hover:bg-orange-100 dark:group-hover:bg-orange-900"
                      : ""
                  }`}
                >
                  <UtensilsCrossed
                    className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${
                      isServiceEnabled("orderFood")
                        ? "group-hover:text-orange-600"
                        : ""
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Food Menu
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Order food to your room
                </p>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    getServiceStatus("orderFood").statusClass
                  }`}
                >
                  {getServiceStatus("orderFood").statusText}
                </span>
              </button>

              {/* Housekeeping */}
              <button
                onClick={() => {
                  if (isServiceEnabled("requestRoomService")) {
                    setActiveService("room-service");
                    setStep("service-detail");
                  } else {
                    toast.error("Room service is currently unavailable");
                  }
                }}
                disabled={!isServiceEnabled("requestRoomService")}
                className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center transition-all duration-200 group ${
                  isServiceEnabled("requestRoomService")
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isServiceEnabled("requestRoomService")
                      ? "group-hover:bg-blue-100 dark:group-hover:bg-blue-900"
                      : ""
                  }`}
                >
                  <Home
                    className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${
                      isServiceEnabled("requestRoomService")
                        ? "group-hover:text-blue-600"
                        : ""
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Housekeeping
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Request cleaning service
                </p>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    getServiceStatus("requestRoomService").statusClass
                  }`}
                >
                  {getServiceStatus("requestRoomService").statusText}
                </span>
              </button>

              {/* Concierge */}
              <button
                onClick={() => {
                  if (isServiceEnabled("customMessage")) {
                    setActiveService("custom-message");
                    setStep("service-detail");
                  } else {
                    toast.error("Concierge service is currently unavailable");
                  }
                }}
                disabled={!isServiceEnabled("customMessage")}
                className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center transition-all duration-200 group ${
                  isServiceEnabled("customMessage")
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isServiceEnabled("customMessage")
                      ? "group-hover:bg-purple-100 dark:group-hover:bg-purple-900"
                      : ""
                  }`}
                >
                  <User
                    className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${
                      isServiceEnabled("customMessage")
                        ? "group-hover:text-purple-600"
                        : ""
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Concierge
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Local recommendations
                </p>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    getServiceStatus("customMessage").statusClass
                  }`}
                >
                  {getServiceStatus("customMessage").statusText}
                </span>
              </button>

              {/* Complaints */}
              <button
                onClick={() => {
                  if (isServiceEnabled("lodgeComplaint")) {
                    setActiveService("complaint");
                    setStep("service-detail");
                  } else {
                    toast.error("Complaint service is currently unavailable");
                  }
                }}
                disabled={!isServiceEnabled("lodgeComplaint")}
                className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center transition-all duration-200 group ${
                  isServiceEnabled("lodgeComplaint")
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isServiceEnabled("lodgeComplaint")
                      ? "group-hover:bg-green-100 dark:group-hover:bg-green-900"
                      : ""
                  }`}
                >
                  <Car
                    className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${
                      isServiceEnabled("lodgeComplaint")
                        ? "group-hover:text-green-600"
                        : ""
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Complaints
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Lodge Complaint to Reception
                </p>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    getServiceStatus("lodgeComplaint").statusClass
                  }`}
                >
                  {getServiceStatus("lodgeComplaint").statusText}
                </span>
              </button>

              {/* Call Service Boy */}
              <button
                onClick={() => {
                  if (isServiceEnabled("callServiceBoy")) {
                    handleCallServiceBoy();
                  } else {
                    toast.error("Call service boy is currently unavailable");
                  }
                }}
                disabled={loading || !isServiceEnabled("callServiceBoy")}
                className={`bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center transition-all duration-200 group ${
                  isServiceEnabled("callServiceBoy") && !loading
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4 transition-colors ${
                    isServiceEnabled("callServiceBoy") && !loading
                      ? "group-hover:bg-blue-100 dark:group-hover:bg-blue-900"
                      : ""
                  }`}
                >
                  <Phone
                    className={`w-6 h-6 text-gray-600 dark:text-gray-300 ${
                      isServiceEnabled("callServiceBoy") && !loading
                        ? "group-hover:text-blue-600"
                        : ""
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Call Service Boy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Request immediate assistance
                </p>
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    loading
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      : getServiceStatus("callServiceBoy").statusClass
                  }`}
                >
                  {loading
                    ? "Processing..."
                    : getServiceStatus("callServiceBoy").statusText}
                </span>
              </button>

              {/* Security - Always available for safety */}
              <button
                onClick={handleSecurityAlert}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 dark:group-hover:bg-red-900 transition-colors">
                  <Shield className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Security
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Emergency assistance
                </p>
                <span className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-3 py-1 rounded-full">
                  24/7
                </span>
              </button>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Emergency Contact
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  24/7 assistance available
                </p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Front Desk:{" "}
                    {hotelData?.settings?.emergencyContact?.phone ||
                      "+91 9876543210"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {hotelData?.settings?.emergencyContact?.description ||
                      "Available 24/7 for any assistance"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEmergencyCall}
                className="bg-red-600 dark:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Service Detail Step
  if (step === "service-detail") {
    // Custom Message Interface
    if (activeService === "custom-message") {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep("services")}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Concierge Service
              </h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          {/* Message Form */}
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Send Message to Concierge
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Get local recommendations and assistance
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your Message
                </label>
                <textarea
                  placeholder="Ask for local recommendations, directions, or any assistance you need..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  rows={6}
                  required
                />
              </div>

              <button
                onClick={handleCustomMessageSubmission}
                disabled={loading || !customMessage.trim()}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending Message..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Food Order Interface
    if (activeService === "food") {
      const categories = getUniqueCategories(foodItems);
      const filteredItems = filterItemsByCategory(foodItems);

      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep("services")}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Food Menu
              </h1>
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="max-w-4xl mx-auto p-6 pb-80">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {item.name}
                      </h3>
                      <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                        ₹{item.price}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {item.description}
                    </p>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
                {filteredItems.length === 0 && !loading && (
                  <div className="col-span-2 text-center py-12">
                    <UtensilsCrossed className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No food items available
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Please check back later
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Cart Bottom Sheet */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl max-h-80 flex flex-col">
              {/* Cart Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Your Order
                </h3>
              </div>

              {/* Cart Items - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-orange-600 dark:text-orange-400 font-bold">
                        ₹{item.price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center ml-2 hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    Total: ₹{getTotalPrice()}
                  </span>
                </div>
                <button
                  onClick={handleFoodOrder}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 text-lg"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Room Service Interface
    if (activeService === "room-service") {
      const categories = getUniqueCategories(roomServiceItems);
      const filteredItems = filterItemsByCategory(roomServiceItems);

      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep("services")}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Room Service Menu
              </h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((service) => (
                  <div
                    key={service._id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {service.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {service.estimatedTime}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {service.category}
                      </span>
                      <button
                        onClick={() => handleRoomServiceRequest(service)}
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Requesting..." : "Request"}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && !loading && (
                  <div className="col-span-3 text-center py-12">
                    <Home className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No room services available
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Please check back later
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Complaint Interface
    if (activeService === "complaint") {
      const categories = getUniqueCategories(complaintItems);
      const filteredItems = filterItemsByCategory(complaintItems);

      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setStep("services")}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lodge Complaint
              </h1>
              <div className="w-10 h-10"></div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {complaint.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority} Priority
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {complaint.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
                        {complaint.category}
                      </span>
                      <button
                        onClick={() => handleComplaintSubmission(complaint)}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : "Submit Complaint"}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && !loading && (
                  <div className="col-span-3 text-center py-12">
                    <Car className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No complaint options available
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Please check back later
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return null;
};

export default GuestPortal;

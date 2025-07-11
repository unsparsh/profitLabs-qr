import React, { useState, useEffect } from "react";
import {
  Phone,
  UtensilsCrossed,
  ZoomIn as Room,
  MessageCircle,
  Send,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "../../utils/api";
import toast from "react-hot-toast";
import mongoose from "mongoose";

interface IdObject {
  _id?: string;
  id?: string;
  uuid?: string;
}

interface GuestPortalProps {
  hotelId: string | IdObject;
  roomId: string | IdObject;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  type: "call-service" | "order-food" | "room-service" | "complaint";
}

export const GuestPortal: React.FC<GuestPortalProps> = ({
  hotelId,
  roomId,
}) => {
  // Debug logging to check what we're receiving
  console.log("GuestPortal props:", { hotelId, roomId });

  const [hotelData, setHotelData] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [guestPhone, setGuestPhone] = useState("");
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [pendingServiceType, setPendingServiceType] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [housekeepingOptions, setHousekeepingOptions] = useState<string[]>([]);

  useEffect(() => {
    // Ensure we have valid hotelId and roomId
    if (!hotelId || !roomId) {
      console.error("Missing hotelId or roomId:", { hotelId, roomId });
      toast.error("Invalid room access. Please scan the QR code again.");
      return;
    }

  const fetchHotelData = async () => {
  try {
    // Safely extract string IDs from props
    const parsedHotelId =
      typeof hotelId === "object" && hotelId !== null
        ? hotelId._id || hotelId.id || ""
        : hotelId;

    const parsedRoomId =
      typeof roomId === "object" && roomId !== null
        ? roomId._id || roomId.uuid || roomId.id || ""
        : roomId;

    if (!parsedHotelId || !parsedRoomId) {
      console.error("Missing valid hotelId or roomId:", {
        parsedHotelId,
        parsedRoomId,
      });
      toast.error("Invalid room access. Please scan the QR code again.");
      return;
    }

    console.log("Fetching hotel data for:", {
      parsedHotelId,
      parsedRoomId,
    });

    const data = await apiClient.getGuestPortalData(
      parsedHotelId,
      parsedRoomId
    );

    console.log("✅ Hotel data received:", data);
    setHotelData(data);
  } catch (error) {
    console.error("❌ Error fetching hotel data:", error);
    toast.error("Unable to load hotel information");
  }
};


    const fetchFoodMenu = async () => {
      try {
        console.log("Fetching food menu for hotelId:", hotelId);
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const response = await fetch(
          `${API_BASE_URL}/guest/${hotelId}/food-menu`
        );
        console.log("Food menu API response status:", response.status);
        if (response.ok) {
          const foodMenu = await response.json();
          console.log("Food items loaded:", foodMenu);
          setFoodItems(foodMenu);
        } else {
          console.error("Failed to fetch food menu:", response.status);
          setFoodItems([]);
        }
      } catch (error) {
        console.error("Error loading food menu:", error);
        setFoodItems([]); // Set empty array on error
      }
    };

    fetchHotelData();
    fetchFoodMenu();
  }, [hotelId, roomId]);

  const serviceIdToSettingsKey: Record<string, string> = {
    "call-service": "callServiceBoy",
    "order-food": "orderFood",
    "room-service": "requestRoomService",
    complaint: "lodgeComplaint",
  };

  const services: Service[] = [
    {
      id: "call-service",
      title: "Call Service Boy",
      description: "Request immediate assistance",
      icon: <Phone className="h-8 w-8" />,
      color: "bg-blue-500",
      type: "call-service",
    },
    {
      id: "order-food",
      title: "Order Food",
      description: "Browse menu and place orders",
      icon: <UtensilsCrossed className="h-8 w-8" />,
      color: "bg-green-500",
      type: "order-food",
    },
    {
      id: "room-service",
      title: "Room Service",
      description: "Housekeeping and maintenance",
      icon: <Room className="h-8 w-8" />,
      color: "bg-purple-500",
      type: "room-service",
    },
    {
      id: "complaint",
      title: "Lodge Complaint",
      description: "Report issues or concerns",
      icon: <MessageCircle className="h-8 w-8" />,
      color: "bg-red-500",
      type: "complaint",
    },
  ];

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === "order-food") {
      setShowFoodMenu(true);
    } else if (serviceId === "room-service") {
      setShowHousekeepingModal(true);
    } else {
      setPendingServiceType(serviceId);
      setShowPhoneModal(true);
    }
    setIsSubmitted(false);
  };

  const handleHousekeepingSelect = (option: string) => {
    setShowHousekeepingModal(false);
    setPendingServiceType("room-service");
    setCustomMessage(option);
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = () => {
    if (!guestPhone.trim() || guestPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setShowPhoneModal(false);
    setSelectedService(pendingServiceType || "call-service");
  };


const handleSubmit = async (
  type: string,
  message: string = "",
  orderDetails: any = null
) => {
  if (!hotelData) return;

  const parsedHotelId =
    typeof hotelId === "object" && hotelId !== null
      ? hotelId._id || hotelId.id || ""
      : hotelId || hotelData?.hotel?._id || "";

  const parsedRoomId =
    typeof roomId === "object" && roomId !== null
      ? roomId.uuid || roomId._id || roomId.id || ""
      : hotelData?.room?.uuid || roomId;

  console.log("🧠 Parsed IDs for request:", {
    parsedHotelId,
    parsedRoomId,
    phone: guestPhone,
  });

  if (!parsedHotelId || !parsedRoomId) {
    toast.error("Invalid hotel or room ID");
    return;
  }

  setIsLoading(true);
  try {
    await apiClient.submitGuestRequest(parsedHotelId, parsedRoomId, {
      type,
      guestPhone,
      message:
        message || `${services.find((s) => s.type === type)?.title} request`,
      priority: type === "complaint" ? "high" : "medium",
      orderDetails,
    });

    setIsSubmitted(true);
    setSelectedService(null);
    setGuestPhone("");
    setCart([]);
    setCustomMessage("");
    toast.success("Request submitted successfully!");
  } catch (error) {
    console.error("API Error:", error);
    toast.error("Failed to submit request. Please try again.");
  } finally {
    setIsLoading(false);
  }
};


  const handleCustomMessageSubmit = async () => {
    if (!customMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setPendingServiceType("custom-message");
    setShowPhoneModal(true);
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find((cartItem) => cartItem._id === item._id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem._id === item._id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                total: (cartItem.quantity + 1) * cartItem.price,
              }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1, total: item.price }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item._id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(
      cart.map((item) =>
        item._id === itemId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const handleFoodOrderSubmit = () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }

    const orderDetails = {
      items: cart.map((item) => ({
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      })),
      totalAmount: getTotalAmount(),
    };

    setPendingServiceType("order-food");
    setShowPhoneModal(true);
  };

  const categories = [...new Set(foodItems.map((item) => item.category))];

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Request Submitted!
            </h2>
            <p className="text-gray-600">
              Your request has been sent to the hotel staff. They will respond
              shortly.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {hotelData.hotel.name}
            </h1>
            <p className="text-gray-600">Room {hotelData.room.number}</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              disabled={
                !hotelData.hotel.settings.servicesEnabled[
                  serviceIdToSettingsKey[service.id]
                ]
              }
              className={`
                p-6 rounded-2xl shadow-sm border-2 transition-all duration-200 text-left
                ${
                  selectedService === service.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                }
                ${
                  !hotelData.hotel.settings.servicesEnabled[
                    serviceIdToSettingsKey[service.id]
                  ]
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
            >
              <div
                className={`${service.color} text-white p-3 rounded-xl mb-3 inline-block`}
              >
                {service.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600">{service.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Message */}
        {hotelData.hotel.settings.servicesEnabled.customMessage && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Custom Message</h3>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            <button
              onClick={handleCustomMessageSubmit}
              disabled={isLoading || !customMessage.trim()}
              className="mt-3 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </div>
        )}

        {/* Selected Service Action */}
        {selectedService && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-3">
                {services.find((s) => s.id === selectedService)?.title}
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to request this service?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pendingServiceType === "custom-message") {
                      handleSubmit("custom-message", customMessage);
                    } else if (pendingServiceType === "order-food") {
                      const orderDetails = {
                        items: cart.map((item) => ({
                          itemId: item._id,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                          total: item.total,
                        })),
                        totalAmount: getTotalAmount(),
                      };
                      handleSubmit(
                        "order-food",
                        "Food order placed",
                        orderDetails
                      );
                    } else if (pendingServiceType === "room-service") {
                      handleSubmit("room-service", customMessage);
                    } else {
                      handleSubmit(selectedService);
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Submitting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Housekeeping Options Modal */}
        {showHousekeepingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Housekeeping Service
              </h3>
              <div className="space-y-3">
                {[
                  "Clean Room",
                  "Change Towels",
                  "Replace Bed Sheets",
                  "Refill Toiletries",
                  "Fix Air Conditioning",
                  "Repair TV/Electronics",
                  "Plumbing Issue",
                  "Extra Pillows/Blankets",
                  "Room Maintenance",
                  "Other Request",
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleHousekeepingSelect(option)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowHousekeepingModal(false)}
                className="w-full mt-4 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Phone Number Modal */}
        {showPhoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Enter Your Phone Number
              </h3>
              <p className="text-gray-600 mb-4">
                We need your phone number so our staff can contact you if
                needed.
              </p>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhoneModal(false);
                    setGuestPhone("");
                    setPendingServiceType("");
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhoneSubmit}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Food Menu Modal */}
        {showFoodMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Food Menu
                  </h3>
                  <button
                    onClick={() => setShowFoodMenu(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex h-[calc(90vh-120px)]">
                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto p-6">
                  {foodItems.length === 0 ? (
                    <div className="text-center py-8">
                      <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Unable to load food menu</p>
                      <p className="text-sm text-gray-400">
                        Please try again later or contact staff
                      </p>
                    </div>
                  ) : (
                    <>
                      {categories.map((category) => (
                        <div key={category} className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {foodItems
                              .filter((item) => item.category === category)
                              .map((item) => (
                                <div
                                  key={item._id}
                                  className="border border-gray-200 rounded-lg p-4"
                                >
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-24 object-cover rounded-lg mb-2"
                                    />
                                  )}
                                  <h5 className="font-semibold text-gray-900">
                                    {item.name}
                                  </h5>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-orange-600">
                                      ₹{item.price}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-700 transition-colors"
                                    >
                                      Add to Cart
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Cart */}
                <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Order
                  </h4>
                  {cart.length === 0 ? (
                    <p className="text-gray-500">No items in cart</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {cart.map((item) => (
                          <div
                            key={item._id}
                            className="bg-white p-3 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-gray-900">
                                {item.name}
                              </h5>
                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateQuantity(item._id, item.quantity - 1)
                                  }
                                  className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm"
                                >
                                  -
                                </button>
                                <span className="font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item._id, item.quantity + 1)
                                  }
                                  className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-sm"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-orange-600">
                                ₹{item.total}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-300 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-bold">Total</span>
                          <span className="text-xl font-bold text-orange-600">
                            ₹{getTotalAmount()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setShowFoodMenu(false);
                            handleFoodOrderSubmit();
                          }}
                          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                        >
                          Place Order
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

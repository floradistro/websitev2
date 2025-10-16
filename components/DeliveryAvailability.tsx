"use client";

import { useState, useEffect } from "react";
import { MapPin, Package, Store } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  is_active: string;
}

interface InventoryRecord {
  id: string;
  product_id: string;
  location_id: string;
  quantity: string;
  status: string;
}

interface DeliveryAvailabilityProps {
  inventory: InventoryRecord[];
  locations: Location[];
  stockStatus: string;
  initialOrderType?: "pickup" | "delivery";
  onDetailsChange?: (details: any) => void;
}

export default function DeliveryAvailability({
  inventory,
  locations,
  stockStatus,
  initialOrderType,
  onDetailsChange,
}: DeliveryAvailabilityProps) {
  const [selectedTab, setSelectedTab] = useState<"delivery" | "pickup">(initialOrderType || "delivery");
  const [userZip, setUserZip] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const activeLocations = locations.filter(loc => loc.is_active === "1");

  // Highlight and scroll when arriving with pre-selected order type
  useEffect(() => {
    if (initialOrderType) {
      setShowHighlight(true);
      setTimeout(() => {
        const element = document.getElementById("delivery-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      
      setTimeout(() => {
        setShowHighlight(false);
      }, 2000);
    }
  }, [initialOrderType]);
  
  const getQuantity = (locationId: string): number => {
    const inv = inventory.find(inv => inv.location_id === locationId);
    return inv ? parseFloat(inv.quantity) : 0;
  };

  const locationsWithStock = activeLocations.filter(
    loc => getQuantity(loc.id) > 0
  );

  const sortedLocations = [...activeLocations].sort((a, b) => {
    const aQty = getQuantity(a.id);
    const bQty = getQuantity(b.id);
    if (aQty > 0 && bQty === 0) return -1;
    if (aQty === 0 && bQty > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  const nearestStore = sortedLocations.find(loc => getQuantity(loc.id) > 0) || sortedLocations[0] || null;

  useEffect(() => {
    if (nearestStore && !selectedStore) {
      setSelectedStore(nearestStore.id);
    }
  }, [nearestStore, selectedStore]);

  // Notify parent when order details change
  useEffect(() => {
    if (onDetailsChange) {
      if (selectedTab === "pickup" && selectedStore) {
        const store = activeLocations.find((loc) => loc.id === selectedStore);
        onDetailsChange({
          orderType: "pickup",
          locationId: selectedStore,
          locationName: store?.name || "",
        });
      } else if (selectedTab === "delivery") {
        onDetailsChange({
          orderType: "delivery",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, selectedStore]);

  // Calculate delivery dates
  const getDeliveryDates = () => {
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const currentHour = estTime.getHours();
    
    // Check if before 2pm EST cutoff
    const isSameDayShipping = currentHour < 14;
    
    const tomorrow = new Date(estTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(estTime);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const threeDays = new Date(estTime);
    threeDays.setDate(threeDays.getDate() + 3);

    const formatDate = (date: Date) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    };

    if (isSameDayShipping) {
      return {
        express: formatDate(tomorrow),
        standard: formatDate(dayAfterTomorrow),
        cutoffMessage: "Order within 2 hours for next-day delivery",
        showExpress: true,
      };
    } else {
      return {
        express: formatDate(dayAfterTomorrow),
        standard: formatDate(threeDays),
        cutoffMessage: "Order by 2 PM EST tomorrow for next-day delivery",
        showExpress: false,
      };
    }
  };

  const delivery = getDeliveryDates();
  const currentStore = activeLocations.find(loc => loc.id === selectedStore);
  const currentStoreQuantity = currentStore ? getQuantity(currentStore.id) : 0;

  const isInStock = locationsWithStock.length > 0 || stockStatus === "instock";

  return (
    <div id="delivery-section" className="space-y-2">
      {/* Tabs */}
      <div className="flex border border-white/20">
        <button
          onClick={() => setSelectedTab("delivery")}
          className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
            selectedTab === "delivery"
              ? "bg-black text-white border-white/40"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          Delivery
        </button>
        <button
          onClick={() => setSelectedTab("pickup")}
          className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 border-l border-white/20 ${
            selectedTab === "pickup"
              ? "bg-black text-white border-white/40"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          Pickup
        </button>
      </div>

      {/* Delivery Tab */}
      {selectedTab === "delivery" && (
        <div className="border border-white/20 p-4 animate-fadeIn">
          {isInStock ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/80">
                  {delivery.express}
                </div>
                <div className="text-xs font-medium text-white">
                  FREE
                </div>
              </div>
              {delivery.cutoffMessage && (
                <p className="text-[10px] text-white/60 uppercase tracking-wider">
                  {delivery.cutoffMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="py-2 text-xs text-white/50 text-center uppercase tracking-wider">
              Unavailable
            </div>
          )}
        </div>
      )}

      {/* Pickup Tab */}
      {selectedTab === "pickup" && (
        <div className="border border-white/20 p-4 animate-fadeIn space-y-2">
          {locationsWithStock.length > 0 ? (
            <>
              {/* Store Selector */}
              <div className="relative">
                <select
                  value={selectedStore || ""}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full appearance-none bg-transparent border border-white/20 px-3 py-2.5 pr-7 text-[11px] font-normal text-white hover:border-white/40 hover:bg-white/5 focus:border-white focus:outline-none transition-all duration-300 cursor-pointer uppercase tracking-[0.1em]"
                >
                  {sortedLocations.map((location) => {
                    const quantity = getQuantity(location.id);
                    return (
                      <option key={location.id} value={location.id}>
                        {location.name} {quantity > 0 ? `(${Math.floor(quantity)} available)` : "(Out of Stock)"}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Pickup Time */}
              {currentStoreQuantity > 0 && (
                <div className="text-xs text-white/60 uppercase tracking-wider">
                  Ready for pickup today
                </div>
              )}
            </>
          ) : (
            <div className="py-2 text-xs text-white/50 text-center uppercase tracking-wider">
              Unavailable
            </div>
          )}
        </div>
      )}
    </div>
  );
}


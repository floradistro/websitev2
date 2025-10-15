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
    <div id="delivery-section" className="mb-6 md:mb-8 scroll-mt-24">
      {/* Highlight notification */}
      {showHighlight && initialOrderType && (
        <div className="mb-3 bg-white text-black px-4 py-2.5 text-xs uppercase tracking-wider text-center animate-fadeIn">
          {initialOrderType === "pickup" ? "Select your pickup location below" : "Enter delivery address below"}
        </div>
      )}
      
      <div className={`bg-black/30 backdrop-blur-sm rounded-2xl shadow-elevated p-4 md:p-6 border transition-all duration-500 ${
        showHighlight ? "border-white shadow-elevated-lg ring-2 ring-white/10" : "border-white/10"
      }`}>
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-4">
          <button
            onClick={() => setSelectedTab("delivery")}
            className={`flex-1 pb-3 text-sm font-light transition-all duration-200 ${
              selectedTab === "delivery"
                ? "border-b-2 border-white text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Package size={16} className="inline mr-2" strokeWidth={1.5} />
            Delivery
          </button>
          <button
            onClick={() => setSelectedTab("pickup")}
            className={`flex-1 pb-3 text-sm font-light transition-all duration-200 ${
              selectedTab === "pickup"
                ? "border-b-2 border-white text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Store size={16} className="inline mr-2" strokeWidth={1.5} />
            Pickup
          </button>
        </div>

        {/* Delivery Tab */}
        {selectedTab === "delivery" && (
          <div className="space-y-4 animate-fadeIn">
            {isInStock ? (
              <>
                {/* Primary Delivery Option */}
                <div className="border border-white/10 rounded-lg p-4 hover:border-white/30 bg-black/20 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-sm font-light text-white">
                          Get it by <span className="font-medium text-white">{delivery.express}</span>
                        </div>
                        {delivery.showExpress && (
                          <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Express
                          </span>
                        )}
                      </div>
                      {delivery.cutoffMessage && (
                        <p className="text-xs text-white/60 font-light">
                          {delivery.cutoffMessage}
                        </p>
                      )}
                    </div>
                    <div className="text-xs font-light text-white/90">
                      FREE
                    </div>
                  </div>
                </div>

                {/* Standard Delivery */}
                <div className="border border-transparent rounded-lg p-4 hover:border-white/10 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-light text-white/70">
                        Standard: {delivery.standard}
                      </div>
                    </div>
                    <div className="text-xs font-light text-white/60">
                      FREE
                    </div>
                  </div>
                </div>

              </>
            ) : (
              <div className="py-4 text-sm text-white/50 font-light">
                Currently unavailable for delivery
              </div>
            )}
          </div>
        )}

        {/* Pickup Tab */}
        {selectedTab === "pickup" && (
          <div className="space-y-3 animate-fadeIn">
            {locationsWithStock.length > 0 ? (
              <>
                {/* Store Selector */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full text-left py-3 px-4 border border-white/10 rounded-lg shadow-subtle hover:border-white/30 hover:shadow-elevated transition-all duration-300 bg-black/40"
                >
                  {currentStore && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-light mb-1 text-white">
                          {currentStore.name}
                        </div>
                        <div className="text-xs text-white/60 font-light">
                          {currentStore.address_line_1}
                          {currentStore.city && `, ${currentStore.city}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <span className={`text-xs font-light ${currentStoreQuantity > 0 ? "text-white" : "text-white/50"}`}>
                          {currentStoreQuantity > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                        <svg
                          className={`w-3 h-3 text-white/60 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>

                {/* Pickup Time */}
                {currentStoreQuantity > 0 && (
                  <div className="text-sm font-light">
                    <span className="text-white/60">Ready for pickup</span>
                    <span className="text-white font-medium ml-1">today</span>
                  </div>
                )}

                {/* Store Dropdown */}
                {isDropdownOpen && (
                  <div className="border border-white/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto shadow-elevated animate-fadeIn bg-black/40">
                    {sortedLocations.map((location, idx) => {
                      const quantity = getQuantity(location.id);
                      const isCurrentlySelected = location.id === selectedStore;
                      
                      return (
                        <button
                          key={location.id}
                          onClick={() => {
                            setSelectedStore(location.id);
                            setIsDropdownOpen(false);
                          }}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          className={`w-full text-left py-3 px-4 transition-all duration-200 border-b border-white/10 last:border-0 animate-slideIn ${
                            isCurrentlySelected ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-light mb-1 text-white">
                                {location.name}
                              </div>
                              <div className="text-xs text-white/60 font-light">
                                {location.address_line_1}
                                {location.city && `, ${location.city}`}
                              </div>
                            </div>
                            <div className={`text-xs font-light ml-4 ${quantity > 0 ? "text-white" : "text-white/50"}`}>
                              {quantity > 0 ? "Available" : "Unavailable"}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-sm text-white/50 font-light">
                Currently unavailable for pickup
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { MapPin, Package, Store } from "lucide-react";
import { getUserLocation, findNearestLocation, getDistanceToLocation, type UserLocation } from "@/lib/geolocation";

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
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [storeDistance, setStoreDistance] = useState<number | null>(null);
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

  // Auto-select nearest location based on user's IP address
  useEffect(() => {
    const autoSelectNearestLocation = async () => {
      // Only auto-select if no location is selected yet
      if (selectedStore) {
        return;
      }

      try {
        console.log('🌍 Getting user location from IP...');
        const location = await getUserLocation();
        
        if (location) {
          setUserLocation(location); // Save for distance calculations
          console.log(`📍 User detected: ${location.city}, ${location.region_code} ${location.postal}`);
          
          // Find nearest location with stock
          const nearest = findNearestLocation(location, locationsWithStock);
          
          if (nearest) {
            console.log(`✓ Auto-selected nearest warehouse: ${nearest.name}`);
            setSelectedStore(nearest.id);
          } else if (nearestStore) {
            setSelectedStore(nearestStore.id);
          }
        } else if (nearestStore) {
          // Fallback to first location with stock
          setSelectedStore(nearestStore.id);
        }
      } catch (error) {
        console.error('Error auto-selecting location:', error);
        // Fallback to first location with stock
        if (nearestStore) {
          setSelectedStore(nearestStore.id);
        }
      }
    };

    autoSelectNearestLocation();
  }, [locationsWithStock, nearestStore, selectedStore]);
  
  // Calculate distance to selected store
  useEffect(() => {
    if (userLocation && selectedStore) {
      const distance = getDistanceToLocation(userLocation, selectedStore);
      setStoreDistance(distance);
    }
  }, [userLocation, selectedStore]);

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
      } else if (selectedTab === "delivery" && selectedStore) {
        // For delivery, also pass the selected store as the shipping origin
        const store = activeLocations.find((loc) => loc.id === selectedStore);
        onDetailsChange({
          orderType: "delivery",
          locationId: selectedStore,
          locationName: store?.name || "",
        });
      } else if (selectedTab === "delivery") {
        // No store selected yet, use first location with stock
        const firstStockLocation = locationsWithStock[0];
        if (firstStockLocation) {
          onDetailsChange({
            orderType: "delivery",
            locationId: firstStockLocation.id,
            locationName: firstStockLocation.name,
          });
        }
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
          className={`flex-1 py-3 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 ${
            selectedTab === "delivery"
              ? "bg-black text-white border-white/40"
              : "text-white/60 hover:bg-white/5"
          }`}
        >
          Delivery
        </button>
        <button
          onClick={() => setSelectedTab("pickup")}
          className={`flex-1 py-3 text-xs font-medium uppercase tracking-[0.15em] transition-all duration-300 border-l border-white/20 ${
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
        <div className={`border border-white/20 p-4 animate-fadeIn space-y-3 relative ${isDropdownOpen ? 'min-h-[400px]' : ''}`}>
          {isInStock ? (
            <>
              {/* Selected Location with Distance and Change Button */}
              {selectedStore && (
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-white/30 rounded-full" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/80">
                          {activeLocations.find((loc) => loc.id === selectedStore)?.name}
                        </span>
                        {storeDistance && (
                          <span className="text-xs text-white/40">
                            {`· ${Math.round(storeDistance)} mi away`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mt-0.5">
                        Ships from this location
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(true)}
                    className="text-xs text-white/60 hover:text-white uppercase tracking-wider transition-colors underline decoration-white/20 hover:decoration-white/60"
                  >
                    Change
                  </button>
                </div>
              )}
              
              {/* Delivery Date Info */}
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
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    {delivery.cutoffMessage}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="py-2.5 text-xs text-white/50 text-center uppercase tracking-wider">
              Unavailable
            </div>
          )}
          
          {/* Location Dropdown for Delivery (when changing) */}
          {isDropdownOpen && selectedTab === "delivery" && (
            <div className="absolute inset-0 bg-[#1a1a1a] border border-white/10 z-30 flex flex-col min-h-[400px]">
              <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <span className="text-xs uppercase tracking-wider text-white/60">
                  Select Shipping Origin
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-xs text-white/60 hover:text-white uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[350px]">
              {sortedLocations.map((location) => {
                const qty = getQuantity(location.id);
                const hasStock = qty > 0;
                const distance = userLocation ? getDistanceToLocation(userLocation, location.id) : null;

                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => {
                      setSelectedStore(location.id);
                      setIsDropdownOpen(false);
                    }}
                    disabled={!hasStock}
                    className={`w-full px-4 py-3 text-left border-b border-white/5 last:border-0 transition-all ${
                      hasStock
                        ? "hover:bg-white/10 cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                    } ${
                      selectedStore === location.id
                        ? "bg-white/10 border-l-2 border-l-white/40"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-white">
                            {location.name}
                          </span>
                          {distance && (
                            <span className="text-xs text-white/40">
                              {`· ${Math.round(distance)} mi`}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 uppercase tracking-wider">
                          {location.city}, {location.state}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${hasStock ? 'text-white/60' : 'text-white/30'}`}>
                          {hasStock ? `${qty} available` : 'Out of stock'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pickup Tab */}
      {selectedTab === "pickup" && (
        <div className={`border border-white/20 p-4 animate-fadeIn space-y-3 relative ${isDropdownOpen ? 'min-h-[400px]' : ''}`}>
          {locationsWithStock.length > 0 ? (
            <>
              {/* Selected Store Display with Distance and Change Button */}
              {selectedStore && !isDropdownOpen && (
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-white/30 rounded-full" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/80">
                          {activeLocations.find((loc) => loc.id === selectedStore)?.name}
                        </span>
                        {storeDistance && (
                          <span className="text-xs text-white/40">
                            {`· ${Math.round(storeDistance)} mi away`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mt-0.5">
                        {currentStoreQuantity} available
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(true)}
                    className="text-xs text-white/60 hover:text-white uppercase tracking-wider transition-colors underline decoration-white/20 hover:decoration-white/60"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Pickup Time */}
              {selectedStore && currentStoreQuantity > 0 && !isDropdownOpen && (
                <div className="text-xs text-white/60 uppercase tracking-wider">
                  Ready for pickup today
                </div>
              )}
              
              {/* Location Dropdown for Pickup (when changing) */}
              {isDropdownOpen && selectedTab === "pickup" && (
                <div className="absolute inset-0 bg-[#1a1a1a] border border-white/10 z-30 flex flex-col min-h-[400px]">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs uppercase tracking-wider text-white/60">
                      Select Pickup Location
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-xs text-white/60 hover:text-white uppercase tracking-wider"
                    >
                      Done
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-[350px]">
                  {sortedLocations.map((location) => {
                    const qty = getQuantity(location.id);
                    const hasStock = qty > 0;
                    const distance = userLocation ? getDistanceToLocation(userLocation, location.id) : null;

                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => {
                          setSelectedStore(location.id);
                          setIsDropdownOpen(false);
                        }}
                        disabled={!hasStock}
                        className={`w-full px-4 py-3 text-left border-b border-white/5 last:border-0 transition-all ${
                          hasStock
                            ? "hover:bg-white/10 cursor-pointer"
                            : "opacity-40 cursor-not-allowed"
                        } ${
                          selectedStore === location.id
                            ? "bg-white/10 border-l-2 border-l-white/40"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-white">
                                {location.name}
                              </span>
                              {distance && (
                                <span className="text-xs text-white/40">
                                  {`· ${Math.round(distance)} mi`}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/40 uppercase tracking-wider">
                              {location.city}, {location.state}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs ${hasStock ? 'text-white/60' : 'text-white/30'}`}>
                              {hasStock ? `${qty} available` : 'Out of stock'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-2.5 text-xs text-white/50 text-center uppercase tracking-wider">
              Unavailable
            </div>
          )}
        </div>
      )}
    </div>
  );
}


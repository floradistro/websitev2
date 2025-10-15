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
      } else if (selectedTab === "delivery" && deliveryAddress.city) {
        onDetailsChange({
          orderType: "delivery",
          deliveryAddress,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, selectedStore, deliveryAddress.city, deliveryAddress.state, deliveryAddress.zip, deliveryAddress.address]);

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
        <div className="mb-3 bg-black text-white px-4 py-2.5 text-xs uppercase tracking-wider text-center animate-fadeIn">
          {initialOrderType === "pickup" ? "Select your pickup location below" : "Enter delivery address below"}
        </div>
      )}
      
      <div className={`bg-[#f5f5f2] rounded-2xl shadow-elevated p-4 md:p-6 border transition-all duration-500 ${
        showHighlight ? "border-black shadow-elevated-lg ring-2 ring-black/10" : "border-[#e5e5e2]"
      }`}>
        {/* Tabs */}
        <div className="flex border-b border-[#e5e5e2] mb-4">
          <button
            onClick={() => setSelectedTab("delivery")}
            className={`flex-1 pb-3 text-sm font-light transition-all duration-200 ${
              selectedTab === "delivery"
                ? "border-b-2 border-black"
                : "text-[#999] hover:text-black"
            }`}
          >
            <Package size={16} className="inline mr-2" strokeWidth={1.5} />
            Delivery
          </button>
          <button
            onClick={() => setSelectedTab("pickup")}
            className={`flex-1 pb-3 text-sm font-light transition-all duration-200 ${
              selectedTab === "pickup"
                ? "border-b-2 border-black"
                : "text-[#999] hover:text-black"
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
                <div className="border border-[#e5e5e2] rounded-lg p-4 hover:border-black transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-sm font-light">
                          Get it by <span className="font-medium text-black">{delivery.express}</span>
                        </div>
                        {delivery.showExpress && (
                          <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Express
                          </span>
                        )}
                      </div>
                      {delivery.cutoffMessage && (
                        <p className="text-xs text-[#767676] font-light">
                          {delivery.cutoffMessage}
                        </p>
                      )}
                    </div>
                    <div className="text-xs font-light">
                      FREE
                    </div>
                  </div>
                </div>

                {/* Standard Delivery */}
                <div className="border border-transparent rounded-lg p-4 hover:border-[#e5e5e2] transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-light text-[#999]">
                        Standard: {delivery.standard}
                      </div>
                    </div>
                    <div className="text-xs font-light text-[#999]">
                      FREE
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="pt-4 border-t border-[#e5e5e2] space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-medium text-black/70">
                    Delivery Address
                  </h4>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                      maxLength={2}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={deliveryAddress.zip}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zip: e.target.value })}
                    maxLength={5}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-black/10 focus:border-black focus:outline-none transition-colors font-light"
                  />
                </div>
              </>
            ) : (
              <div className="py-4 text-sm text-[#999] font-light">
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
                  className="w-full text-left py-3 px-4 border border-[#e5e5e2] rounded-lg shadow-subtle hover:border-black hover:shadow-elevated transition-all duration-300 bg-white"
                >
                  {currentStore && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-light mb-1">
                          {currentStore.name}
                        </div>
                        <div className="text-xs text-[#999] font-light">
                          {currentStore.address_line_1}
                          {currentStore.city && `, ${currentStore.city}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <span className={`text-xs font-light ${currentStoreQuantity > 0 ? "text-black" : "text-[#999]"}`}>
                          {currentStoreQuantity > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                        <svg
                          className={`w-3 h-3 text-[#999] transition-transform ${
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
                    <span className="text-[#767676]">Ready for pickup</span>
                    <span className="text-black font-medium ml-1">today</span>
                  </div>
                )}

                {/* Store Dropdown */}
                {isDropdownOpen && (
                  <div className="border border-[#e5e5e2] rounded-lg overflow-hidden max-h-64 overflow-y-auto shadow-elevated animate-fadeIn bg-white">
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
                          className={`w-full text-left py-3 px-4 transition-all duration-200 border-b border-[#e5e5e2] last:border-0 animate-slideIn ${
                            isCurrentlySelected ? "bg-[#f5f5f2]" : "hover:bg-[#f5f5f2]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-light mb-1">
                                {location.name}
                              </div>
                              <div className="text-xs text-[#999] font-light">
                                {location.address_line_1}
                                {location.city && `, ${location.city}`}
                              </div>
                            </div>
                            <div className={`text-xs font-light ml-4 ${quantity > 0 ? "text-black" : "text-[#999]"}`}>
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
              <div className="py-4 text-sm text-[#999] font-light">
                Currently unavailable for pickup
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


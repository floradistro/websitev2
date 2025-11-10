import { logger } from "@/lib/logger";

/**
 * AlpineIQ API Client - Customer & Points Sync Only
 *
 * This client handles ONLY:
 * - Customer creation/lookup
 * - Loyalty points sync
 * - Order creation (for points)
 * - Opt-in management
 *
 * Marketing features (campaigns, SMS, email) have been removed.
 */

export interface AlpineIQConfig {
  apiKey: string;
  userId: string; // 4-digit UID
  agencyId?: string;
  baseUrl?: string;
}

export interface AlpineIQCustomer {
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  metadata?: Record<string, any>;
}

export interface AlpineIQLoyaltyConfig {
  id: string;
  name: string;
  userID: string;
  tiers: Array<{
    points: number;
    discount: number;
    max: number;
  }>;
  accrual: number;
  expiration: number;
}

export class AlpineIQClient {
  private config: AlpineIQConfig;
  private baseUrl: string;

  constructor(config: AlpineIQConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://lab.alpineiq.com";
  }

  /**
   * Make authenticated request to AlpineIQ API
   */
  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "X-APIKEY": this.config.apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.errors?.[0]?.message || `AlpineIQ API error: ${response.statusText}`);
    }

    return data.data;
  }

  // ----------------------------------------------------------------------------
  // CUSTOMERS (CONTACTS)
  // ----------------------------------------------------------------------------

  /**
   * Create or update a customer in AlpineIQ
   */
  async upsertCustomer(customer: AlpineIQCustomer): Promise<any> {
    return this.request("POST", "/api/v2/contact", {
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      birthdate: customer.birthdate,
      ...customer.metadata,
    });
  }

  /**
   * Lookup customer by phone number
   */
  async lookupCustomerByPhone(phone: string): Promise<string | null> {
    try {
      const data = await this.request<{ contactID: string }>("GET", `/api/v2/lookup/${phone}`);
      return data.contactID;
    } catch (error) {
      return null; // Customer not found
    }
  }

  /**
   * Lookup customer by email
   */
  async lookupCustomerByEmail(email: string): Promise<string | null> {
    try {
      const data = await this.request<{ contactID: string }>(
        "GET",
        `/api/v2/lookup/email/${email}`,
      );
      return data.contactID;
    } catch (error) {
      return null; // Customer not found
    }
  }

  // ----------------------------------------------------------------------------
  // LOYALTY POINTS
  // ----------------------------------------------------------------------------

  /**
   * Get loyalty program configuration
   */
  async getLoyaltyConfig(): Promise<AlpineIQLoyaltyConfig> {
    return this.request("GET", `/api/v2/loyalty/default/${this.config.userId}`);
  }

  /**
   * Lookup customer loyalty status
   */
  async getLoyaltyStatus(emailOrPhone: string): Promise<any> {
    return this.request("POST", `/api/v2/loyalty/lookup/${emailOrPhone}`, {});
  }

  /**
   * Adjust loyalty points for a customer
   */
  async adjustLoyaltyPoints(params: {
    contactId: string;
    points: number;
    note: string;
    orderId?: string;
  }): Promise<any> {
    return this.request(
      "PUT",
      `/api/v1.1/adjust/loyaltyPoints/${this.config.userId}/${params.contactId}`,
      {
        value: params.points,
        note: params.note,
        cmpID: params.orderId,
        ts: Math.floor(Date.now() / 1000),
      },
    );
  }

  /**
   * Get loyalty points timeline for a customer
   */
  async getLoyaltyTimeline(contactId: string): Promise<any> {
    return this.request(
      "GET",
      `/api/v1.1/contact/loyaltyPoints/timeline/${this.config.userId}/${contactId}`,
    );
  }

  /**
   * Lookup loyalty status for a specific customer by email or phone
   */
  async lookupCustomerLoyalty(emailOrPhone: string): Promise<{
    id: string;
    email: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    points: number;
    tier: string;
    tierLevel: number;
    lifetimePoints: number;
  } | null> {
    try {
      const response = await this.request<any>(
        "POST",
        `/api/v2/loyalty/lookup/${emailOrPhone}`,
        {},
      );

      if (response && response.contact) {
        return {
          id: response.contact.id || response.contact.universalID,
          email: response.contact.email || "",
          phone: response.contact.phone || "",
          firstName: response.contact.firstName,
          lastName: response.contact.lastName,
          points: response.wallet?.points || 0,
          tier: response.wallet?.tier || "Member",
          tierLevel: response.wallet?.tierLevel || 1,
          lifetimePoints: response.wallet?.lifetimePoints || 0,
        };
      }

      return null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to lookup customer loyalty", error instanceof Error ? error : new Error(String(error)), { emailOrPhone });
      }
      return null;
    }
  }

  // ----------------------------------------------------------------------------
  // ORDERS & SALES (for points sync)
  // ----------------------------------------------------------------------------

  /**
   * Create or update a sale (order) in AlpineIQ
   * This syncs the order and awards loyalty points
   * Note: Submissions take 24 hours to appear in Alpine IQ dashboard
   */
  async createSale(sale: {
    member: {
      email: string;
      mobilePhone?: string;
      firstName?: string;
      lastName?: string;
    };
    visit: {
      pos_id: string;
      pos_user: string;
      pos_type: string; // 'online' | 'in-store'
      transaction_date: string; // 'YYYY-MM-DD HH:mm:ss +0000'
      location: string;
      budtenderName?: string;
      budtenderID?: string;
      visit_details_attributes: Array<{
        sku: string;
        size?: string;
        category: string;
        subcategory?: string;
        brand?: string;
        name: string;
        strain?: string;
        grade?: string;
        species?: string;
        price: number;
        discount?: number;
        quantity: number;
        customAttributes?: Array<{
          key: string;
          value: string;
        }>;
      }>;
      transaction_total: number;
      send_notification?: boolean;
    };
  }): Promise<any> {
    return this.request("POST", `/api/v1.1/createUpdateSale/${this.config.userId}`, sale);
  }

  /**
   * Sign up a new loyalty member
   */
  async signupLoyaltyMember(member: {
    email: string;
    mobilePhone: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    favoriteStore?: string;
  }): Promise<any> {
    return this.request("POST", "/api/v2/loyalty", {
      uid: this.config.userId,
      email: member.email,
      mobilePhone: member.mobilePhone,
      firstName: member.firstName,
      lastName: member.lastName,
      address: member.address,
      favoriteStore: member.favoriteStore,
      loyalty: true,
    });
  }

  /**
   * Get all orders for a contact
   */
  async getCustomerOrders(
    contactId: string,
    params?: {
      start?: number;
      limit?: number;
    },
  ): Promise<any[]> {
    const query = new URLSearchParams({
      start: params?.start?.toString() || "0",
      limit: params?.limit?.toString() || "100",
    });
    return this.request(
      "GET",
      `/api/v1.1/contact/orders/${this.config.userId}/${contactId}?${query}`,
    );
  }

  // ----------------------------------------------------------------------------
  // OPT-IN MANAGEMENT
  // ----------------------------------------------------------------------------

  /**
   * Set email opt-in status
   */
  async setEmailOptIn(email: string, optedIn: boolean): Promise<any> {
    return this.request("POST", `/api/v2/optin/${email}`, {
      optIn: optedIn,
      channel: "email",
    });
  }

  /**
   * Set SMS opt-in status
   */
  async setSMSOptIn(phone: string, optedIn: boolean, doubleOpt: boolean = false): Promise<any> {
    return this.request("POST", `/api/v2/optin/${phone}`, {
      optIn: optedIn,
      channel: "text",
      doubleOpt,
    });
  }

  /**
   * Get opt-in status for email/phone
   */
  async getOptInStatus(emailOrPhone: string): Promise<any> {
    return this.request("GET", `/api/v2/optin/${emailOrPhone}`);
  }

  // ----------------------------------------------------------------------------
  // UTILITY METHODS
  // ----------------------------------------------------------------------------

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getLoyaltyConfig();
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("AlpineIQ connection test failed", error instanceof Error ? error : new Error(String(error)));
      }
      return false;
    }
  }
}

/**
 * Factory function to create AlpineIQ client from vendor config
 */
export function createAlpineIQClient(vendorConfig: {
  api_key: string;
  user_id: string;
  agency_id?: string;
}): AlpineIQClient {
  return new AlpineIQClient({
    apiKey: vendorConfig.api_key,
    userId: vendorConfig.user_id,
    agencyId: vendorConfig.agency_id,
  });
}

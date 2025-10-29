/**
 * AlpineIQ API Client
 * Official API wrapper for AlpineIQ marketing platform
 *
 * Tested endpoints:
 * - GET /api/v2/campaigns (✅ Working)
 * - GET /api/v1.1/audiences/:uid (✅ Working)
 * - GET /api/v1.1/stores/:uid (✅ Working)
 * - GET /api/v2/loyalty/default/:uid (✅ Working)
 * - GET /api/v2/discount/groups (✅ Working)
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

export interface AlpineIQOrder {
  customerId: string; // AlpineIQ Universal ID
  orderId: string;
  total: number;
  items: any[];
  locationId?: string;
  createdAt: string;
  pointsEarned?: number;
  metadata?: Record<string, any>;
}

export interface AlpineIQCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  summary: {
    msgsSent: number;
    clicks: number;
    revenue: number;
    convs: number;
  };
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
    this.baseUrl = config.baseUrl || 'https://lab.alpineiq.com';
  }

  /**
   * Make authenticated request to AlpineIQ API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'X-APIKEY': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.errors?.[0]?.message || `AlpineIQ API error: ${response.statusText}`
      );
    }

    return data.data;
  }

  // ----------------------------------------------------------------------------
  // CAMPAIGNS
  // ----------------------------------------------------------------------------

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<AlpineIQCampaign[]> {
    return this.request('GET', '/api/v2/campaigns');
  }

  /**
   * Get campaign stats by ID
   */
  async getCampaignStats(campaignId: string): Promise<any> {
    return this.request(
      'GET',
      `/api/v1.1/campaigns/${this.config.userId}/stats/${campaignId}`
    );
  }

  // ----------------------------------------------------------------------------
  // CUSTOMERS (CONTACTS)
  // ----------------------------------------------------------------------------

  /**
   * Create or update a customer in AlpineIQ
   */
  async upsertCustomer(customer: AlpineIQCustomer): Promise<any> {
    return this.request('POST', '/api/v2/contact', {
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
      const data = await this.request<{ contactID: string }>(
        'GET',
        `/api/v2/lookup/${phone}`
      );
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
        'GET',
        `/api/v2/lookup/email/${email}`
      );
      return data.contactID;
    } catch (error) {
      return null; // Customer not found
    }
  }

  /**
   * Search for customers
   */
  async searchCustomers(query: {
    email?: string;
    phone?: string;
    name?: string;
  }): Promise<any[]> {
    return this.request('POST', `/api/v1.1/contacts/search/${this.config.userId}`, query);
  }

  // ----------------------------------------------------------------------------
  // LOYALTY
  // ----------------------------------------------------------------------------

  /**
   * Get loyalty program configuration
   */
  async getLoyaltyConfig(): Promise<AlpineIQLoyaltyConfig> {
    return this.request('GET', `/api/v2/loyalty/default/${this.config.userId}`);
  }

  /**
   * Lookup customer loyalty status
   */
  async getLoyaltyStatus(emailOrPhone: string): Promise<any> {
    return this.request('POST', `/api/v2/loyalty/lookup/${emailOrPhone}`, {});
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
      'PUT',
      `/api/v1.1/adjust/loyaltyPoints/${this.config.userId}/${params.contactId}`,
      {
        value: params.points,
        note: params.note,
        cmpID: params.orderId,
        ts: Math.floor(Date.now() / 1000),
      }
    );
  }

  /**
   * Get loyalty points timeline for a customer
   */
  async getLoyaltyTimeline(contactId: string): Promise<any> {
    return this.request(
      'GET',
      `/api/v1.1/contact/loyaltyPoints/timeline/${this.config.userId}/${contactId}`
    );
  }

  // ----------------------------------------------------------------------------
  // ORDERS & SALES
  // ----------------------------------------------------------------------------

  /**
   * Create or update a sale (order) in AlpineIQ
   */
  async createSale(order: AlpineIQOrder): Promise<any> {
    return this.request('POST', `/api/v1.1/sale/${this.config.userId}`, {
      contactID: order.customerId,
      orderID: order.orderId,
      total: order.total,
      items: order.items,
      storeID: order.locationId,
      timestamp: order.createdAt,
      ...order.metadata,
    });
  }

  /**
   * Get all orders for a contact
   */
  async getCustomerOrders(contactId: string, params?: {
    start?: number;
    limit?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams({
      start: params?.start?.toString() || '0',
      limit: params?.limit?.toString() || '100',
    });
    return this.request(
      'GET',
      `/api/v1.1/contact/orders/${this.config.userId}/${contactId}?${query}`
    );
  }

  // ----------------------------------------------------------------------------
  // AUDIENCES (SEGMENTS)
  // ----------------------------------------------------------------------------

  /**
   * Get all audiences/segments
   */
  async getAudiences(params?: {
    start?: number;
    limit?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams({
      start: params?.start?.toString() || '0',
      limit: params?.limit?.toString() || '100',
    });
    return this.request('GET', `/api/v1.1/audiences/${this.config.userId}?${query}`);
  }

  /**
   * Get specific audience by ID
   */
  async getAudience(audienceId: string): Promise<any> {
    return this.request(
      'GET',
      `/api/v1.1/audience/${this.config.userId}/${audienceId}`
    );
  }

  /**
   * Get all members of an audience
   */
  async getAudienceMembers(audienceId: string): Promise<string[]> {
    return this.request('GET', `/api/v2/audience/members/${audienceId}`);
  }

  // ----------------------------------------------------------------------------
  // STORES/LOCATIONS
  // ----------------------------------------------------------------------------

  /**
   * Get all retail stores
   */
  async getStores(): Promise<any[]> {
    const data = await this.request<{ stores: any[] }>(
      'GET',
      `/api/v1.1/stores/${this.config.userId}`
    );
    return data.stores;
  }

  /**
   * Add a retail store
   */
  async createStore(store: {
    name: string;
    nickname?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
    };
    phone?: string;
  }): Promise<any> {
    return this.request('POST', `/api/v1.1/stores/${this.config.userId}`, {
      name: store.name,
      nickname: store.nickname,
      addr: store.address,
      voiceNumber: store.phone,
    });
  }

  // ----------------------------------------------------------------------------
  // DISCOUNTS
  // ----------------------------------------------------------------------------

  /**
   * Get all discount groups
   */
  async getDiscountGroups(): Promise<any[]> {
    return this.request('GET', '/api/v2/discount/groups');
  }

  /**
   * Get discount redemptions
   */
  async getDiscountRedemptions(params: {
    start: number; // Unix timestamp
    end: number; // Unix timestamp
  }): Promise<any[]> {
    return this.request(
      'GET',
      `/api/v1.1/discountRedemptions/${this.config.userId}/${params.start}/${params.end}`
    );
  }

  // ----------------------------------------------------------------------------
  // OPT-IN MANAGEMENT
  // ----------------------------------------------------------------------------

  /**
   * Set email opt-in status
   */
  async setEmailOptIn(email: string, optedIn: boolean): Promise<any> {
    return this.request('POST', `/api/v2/optin/${email}`, {
      optIn: optedIn,
      channel: 'email',
    });
  }

  /**
   * Set SMS opt-in status
   */
  async setSMSOptIn(phone: string, optedIn: boolean, doubleOpt: boolean = false): Promise<any> {
    return this.request('POST', `/api/v2/optin/${phone}`, {
      optIn: optedIn,
      channel: 'text',
      doubleOpt,
    });
  }

  /**
   * Get opt-in status for email/phone
   */
  async getOptInStatus(emailOrPhone: string): Promise<any> {
    return this.request('GET', `/api/v2/optin/${emailOrPhone}`);
  }

  // ----------------------------------------------------------------------------
  // WALLET
  // ----------------------------------------------------------------------------

  /**
   * Get wallet for a contact (loyalty points, discounts, etc)
   */
  async getWallet(params: {
    contactId?: string;
    phone?: string;
  }): Promise<any> {
    if (params.contactId) {
      return this.request('GET', `/api/v1.1/wallet/${this.config.userId}/${params.contactId}`);
    } else if (params.phone) {
      return this.request('GET', `/api/v1.1/walletOffers/${params.phone}`);
    }
    throw new Error('Must provide contactId or phone');
  }

  /**
   * Get Apple/Google wallet pass download links
   */
  async getWalletPassLinks(contactId: string): Promise<{
    apple?: string;
    google?: string;
  }> {
    return this.request('GET', `/api/v1.1/walletPass/${this.config.userId}/${contactId}`);
  }

  // ----------------------------------------------------------------------------
  // LOYALTY MEMBERS
  // ----------------------------------------------------------------------------

  /**
   * Get loyalty program member count and audience ID
   * Note: Alpine IQ doesn't provide a bulk export API for security reasons.
   * Use lookupLoyaltyStatus() to get individual customer data by email/phone.
   */
  async getLoyaltyAudienceInfo(): Promise<{
    audienceId: string;
    totalMembers: number;
    name: string;
  } | null> {
    // Get audiences to find "Signed Up" loyalty members audience
    const audiences = await this.request<any>('GET', `/api/v1.1/audiences/${this.config.userId}`);

    // Find the "Signed Up" audience (loyaltyMember = true)
    const loyaltyAudience = audiences.data?.find((a: any) =>
      a.name === 'Signed Up' || a.traits?.some((t: any) => t.type === 'loyaltyMember' && t.value === true)
    );

    if (!loyaltyAudience) {
      return null;
    }

    return {
      audienceId: loyaltyAudience.id,
      totalMembers: loyaltyAudience.audienceSize,
      name: loyaltyAudience.name,
    };
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
      // Use the loyalty lookup endpoint
      const response = await this.request<any>(
        'POST',
        `/api/v2/loyalty/lookup/${emailOrPhone}`,
        {}
      );

      if (response && response.contact) {
        return {
          id: response.contact.id || response.contact.universalID,
          email: response.contact.email || '',
          phone: response.contact.phone || '',
          firstName: response.contact.firstName,
          lastName: response.contact.lastName,
          points: response.wallet?.points || 0,
          tier: response.wallet?.tier || 'Member',
          tierLevel: response.wallet?.tierLevel || 1,
          lifetimePoints: response.wallet?.lifetimePoints || 0,
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to lookup customer ${emailOrPhone}:`, error);
      return null;
    }
  }

  // ----------------------------------------------------------------------------
  // UTILITY METHODS
  // ----------------------------------------------------------------------------

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getStores();
      return true;
    } catch (error) {
      console.error('AlpineIQ connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API rate limit status
   */
  getRateLimits(): { second: number; minute: number; hour: number } {
    return {
      second: 5,
      minute: 120,
      hour: 2000,
    };
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

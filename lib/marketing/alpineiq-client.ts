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
    return this.request('POST', `/api/v1.1/createUpdateSale/${this.config.userId}`, sale);
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
    return this.request('POST', '/api/v2/loyalty', {
      uid: this.config.userId,
      email: member.email,
      mobilePhone: member.mobilePhone,
      firstName: member.firstName,
      lastName: member.lastName,
      address: member.address,
      favoriteStore: member.favoriteStore,
      loyalty: true
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
    const result = await this.request<any>('GET', `/api/v1.1/audiences/${this.config.userId}?${query}`);
    return result.data || result;
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

  /**
   * Create a custom audience from contact IDs
   * This is required before creating campaigns
   */
  async createAudience(params: {
    name: string;
    contactIDs: string[];
  }): Promise<{ audienceId: string }> {
    const result = await this.request<{ id: string; audienceId: string }>(
      'POST',
      `/api/v1.1/audience/${this.config.userId}`,
      {
        name: params.name,
        contactIDs: params.contactIDs,
      }
    );
    return { audienceId: result.id || result.audienceId };
  }

  /**
   * Create audience from phone numbers
   * Looks up contact IDs first, then creates audience
   */
  async createAudienceFromPhones(params: {
    name: string;
    phoneNumbers: string[];
  }): Promise<{ audienceId: string; matchedCount: number }> {
    // Lookup contact IDs for each phone number
    const contactIDs: string[] = [];

    for (const phone of params.phoneNumbers) {
      const contactId = await this.lookupCustomerByPhone(phone);
      if (contactId) {
        contactIDs.push(contactId);
      }
    }

    // Create audience with matched contacts
    if (contactIDs.length === 0) {
      throw new Error('No contacts found for provided phone numbers');
    }

    const result = await this.createAudience({
      name: params.name,
      contactIDs,
    });

    return {
      audienceId: result.audienceId,
      matchedCount: contactIDs.length,
    };
  }

  /**
   * Create audience from email addresses
   */
  async createAudienceFromEmails(params: {
    name: string;
    emails: string[];
  }): Promise<{ audienceId: string; matchedCount: number }> {
    const contactIDs: string[] = [];

    for (const email of params.emails) {
      const contactId = await this.lookupCustomerByEmail(email);
      if (contactId) {
        contactIDs.push(contactId);
      }
    }

    if (contactIDs.length === 0) {
      throw new Error('No contacts found for provided emails');
    }

    const result = await this.createAudience({
      name: params.name,
      contactIDs,
    });

    return {
      audienceId: result.audienceId,
      matchedCount: contactIDs.length,
    };
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
    const response = await this.request<any>('GET', `/api/v1.1/audiences/${this.config.userId}`);

    console.log('📊 Response from audiences endpoint:', response ? 'OK' : 'NULL');

    const audiences = response.data || response;
    console.log(`📊 Total audiences: ${audiences?.length || 0}`);

    if (!audiences || audiences.length === 0) {
      console.log('⚠️  No audiences found');
      return null;
    }

    // Find the "Signed Up" audience (loyaltyMember = true)
    const loyaltyAudience = audiences.find((a: any) => {
      const isSignedUp = a.name === 'Signed Up';
      const hasLoyaltyTrait = a.traits?.some((t: any) => t.type === 'loyaltyMember' && t.value === true);
      if (isSignedUp || hasLoyaltyTrait) {
        console.log(`✅ Found loyalty audience: ${a.name} (ID: ${a.id}, Size: ${a.audienceSize})`);
      }
      return isSignedUp || hasLoyaltyTrait;
    });

    if (!loyaltyAudience) {
      console.log('⚠️  No loyalty audience found in', audiences.length, 'audiences');
      console.log('First 3 audience names:', audiences.slice(0, 3).map((a: any) => a.name).join(', '));
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
  // CAMPAIGNS - CREATE & SEND (NEW)
  // ----------------------------------------------------------------------------

  /**
   * Create SMS campaign with optional landing page
   *
   * NOTE: Message content must use pre-approved templates due to 10DLC compliance
   *
   * How it works:
   * 1. messageContent must be an approved template from Alpine IQ dashboard
   * 2. Template can include {link} placeholder for landing page
   * 3. If landingHTML provided, Alpine IQ generates short link and replaces {link}
   * 4. Customer receives SMS with link to your landing page
   *
   * Example:
   *   messageContent: "Special offer! {link}"  (approved template)
   *   landingHTML: "<h1>25% Off Today!</h1>"
   *   Customer gets: "Special offer! https://aiq.co/abc123"
   *
   * Contact Alpine IQ support to get list of approved message templates
   */
  async createSMSCampaign(params: {
    campaignName: string;
    messageContent: string;  // Must be approved template (e.g., "Special offer! {link}")
    landingHTML?: string;    // Optional: HTML for landing page (if template has {link})
    landingType?: string;    // Optional: 'custom' | 'template'
    phoneList?: string[];    // Array of phone numbers
    emailList?: string[];    // Or array of emails
    contactIDs?: string[];   // Or array of contact IDs
    audienceId?: string;     // Or use audience
    startDate?: Date;        // When to send (default: now + 1 hour)
    sendNow?: boolean;       // Send immediately
  }): Promise<{ campaignId: string }> {
    const startDate = params.startDate || new Date(Date.now() + 3600000);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    const payload: any = {
      campaignName: params.campaignName,
      campaignType: 'TEXT',
      messageContent: params.messageContent,
      userId: this.config.userId,
      startDate: startTimestamp,
    };

    // Add landing page if provided
    if (params.landingHTML) {
      payload.landingHTML = params.landingHTML;
      payload.landingType = params.landingType || 'custom';
    }

    // Add targeting (at least one required)
    if (params.phoneList) payload.phoneList = params.phoneList;
    if (params.emailList) payload.emailList = params.emailList;
    if (params.contactIDs) payload.contactIDs = params.contactIDs;
    if (params.audienceId) payload.audienceId = params.audienceId;

    const result = await this.request<{ id: string; campaignId: string }>(
      'POST',
      '/api/v2/campaign',
      payload
    );

    return { campaignId: result.id || result.campaignId };
  }

  /**
   * Create email campaign
   */
  async createEmailCampaign(params: {
    campaignName: string;
    subject: string;
    messageContent: string; // HTML content
    emailList?: string[];
    contactIDs?: string[];
    audienceId?: string;
    startDate?: Date;
  }): Promise<{ campaignId: string }> {
    const startDate = params.startDate || new Date(Date.now() + 3600000);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    const payload: any = {
      campaignName: params.campaignName,
      campaignType: 'EMAIL',
      messageContent: params.messageContent,
      subject: params.subject,
      userId: this.config.userId,
      startDate: startTimestamp,
    };

    if (params.emailList) payload.emailList = params.emailList;
    if (params.contactIDs) payload.contactIDs = params.contactIDs;
    if (params.audienceId) payload.audienceId = params.audienceId;

    const result = await this.request<{ id: string; campaignId: string }>(
      'POST',
      '/api/v2/campaign',
      payload
    );

    return { campaignId: result.id || result.campaignId };
  }

  /**
   * Send SMS to a list of customers using your database
   * This wraps createSMSCampaign with a simpler interface
   */
  async sendBulkSMS(params: {
    customers: Array<{ phone: string }>;
    message: string;           // Approved template (e.g., "Special offer! {link}")
    landingHTML?: string;      // Optional: Landing page HTML
    campaignName?: string;
    sendAt?: Date;
  }): Promise<{ campaignId: string; recipientCount: number }> {
    const phoneList = params.customers.map(c => c.phone).filter(Boolean);

    const result = await this.createSMSCampaign({
      campaignName: params.campaignName || `SMS ${new Date().toLocaleDateString()}`,
      messageContent: params.message,
      landingHTML: params.landingHTML,
      phoneList,
      startDate: params.sendAt,
    });

    return {
      campaignId: result.campaignId,
      recipientCount: phoneList.length,
    };
  }

  /**
   * Send email to a list of customers
   */
  async sendBulkEmail(params: {
    customers: Array<{ email: string }>;
    subject: string;
    htmlContent: string;
    campaignName?: string;
    sendAt?: Date;
  }): Promise<{ campaignId: string; recipientCount: number }> {
    const emailList = params.customers.map(c => c.email).filter(Boolean);

    const result = await this.createEmailCampaign({
      campaignName: params.campaignName || `Email ${new Date().toLocaleDateString()}`,
      subject: params.subject,
      messageContent: params.htmlContent,
      emailList,
      startDate: params.sendAt,
    });

    return {
      campaignId: result.campaignId,
      recipientCount: emailList.length,
    };
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

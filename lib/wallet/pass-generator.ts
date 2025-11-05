// Apple Wallet Pass Generator
// Generates .pkpass files for customers

import { PKPass } from 'passkit-generator';
import fs from 'fs';
import path from 'path';
import { WALLET_CONFIG, getVendorWalletBranding } from './config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Type definitions
interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  loyalty_points: number;
  loyalty_tier: string;
  created_at: string;
}

interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  brand_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

interface VendorWalletSettings {
  pass_type_identifier: string;
  team_identifier: string;
  organization_name: string;
  logo_text?: string;
  description?: string;
  foreground_color?: string;
  background_color?: string;
  fields_config?: any;
}

interface WalletPass {
  id: string;
  serial_number: string;
  authentication_token: string;
  customer_id: string;
  vendor_id: string;
  pass_data: {
    points: number;
    tier: string;
    member_name: string;
    member_since: string;
    barcode_message: string;
  };
}

export class WalletPassGenerator {
  private certPath: string;
  private wwdrPath: string;
  private certPassword: string;

  constructor() {
    this.certPath = WALLET_CONFIG.certificates.signerCert;
    this.wwdrPath = WALLET_CONFIG.certificates.wwdr;
    this.certPassword = WALLET_CONFIG.certificates.signerKeyPassphrase;
  }

  /**
   * Generate a new Apple Wallet pass for a customer
   */
  async generatePass(
    customer: Customer,
    vendor: Vendor,
    passRecord: WalletPass
  ): Promise<Buffer> {
    try {
      // Get vendor wallet settings or use defaults
      const vendorSettings = await this.getVendorWalletSettings(vendor.id);
      const branding = getVendorWalletBranding(vendor);

      // Download vendor logo if available
      const logoBuffer = await this.downloadImage(vendor.logo_url);

      // Generate icon from logo (simplified square version)
      const iconBuffer = logoBuffer; // In production, you'd resize this

      // Create pass template
      const pass = await this.createPassFromTemplate({
        customer,
        vendor,
        passRecord,
        vendorSettings,
        branding,
        logoBuffer,
        iconBuffer,
      });

      // Generate the .pkpass file
      const buffer = pass.getAsBuffer();

      // Log event
      await this.logPassEvent(passRecord.id, customer.id, 'generated');

      return buffer;
    } catch (error) {
      console.error('Failed to generate wallet pass:', error);
      throw new Error(`Pass generation failed: ${error}`);
    }
  }

  /**
   * Create pass from template with all required fields
   */
  private async createPassFromTemplate(params: {
    customer: Customer;
    vendor: Vendor;
    passRecord: WalletPass;
    vendorSettings: VendorWalletSettings | null;
    branding: any;
    logoBuffer: Buffer | null;
    iconBuffer: Buffer | null;
  }) {
    const {
      customer,
      vendor,
      passRecord,
      vendorSettings,
      branding,
      logoBuffer,
      iconBuffer,
    } = params;

    // Read certificates
    const wwdr = fs.readFileSync(this.wwdrPath);

    // Check if we have separate cert and key files
    const certDir = path.dirname(this.certPath);
    const certPemPath = path.join(certDir, 'cert.pem');
    const keyPemPath = path.join(certDir, 'key.pem');

    let signerCert, signerKey;

    if (fs.existsSync(certPemPath) && fs.existsSync(keyPemPath)) {
      // Use separate PEM files
      signerCert = fs.readFileSync(certPemPath);
      signerKey = fs.readFileSync(keyPemPath);
    } else {
      // Use P12 file
      signerCert = fs.readFileSync(this.certPath);
      signerKey = signerCert;
    }

    // Template folder path
    const templatePath = path.join(process.cwd(), 'lib/wallet/pass-template.pass');

    // Create pass instance from template folder
    const pass = await PKPass.from({
      model: templatePath,
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: this.certPassword,
      },
    });

    // Set pass properties
    pass.serialNumber = passRecord.serial_number;
    pass.authenticationToken = passRecord.authentication_token;
    pass.organizationName = vendorSettings?.organization_name || branding.organizationName;
    pass.description = vendorSettings?.description || `${vendor.store_name} Loyalty Card`;
    pass.logoText = vendorSettings?.logo_text || branding.logoText;
    pass.foregroundColor = vendorSettings?.foreground_color || branding.foregroundColor;
    pass.backgroundColor = vendorSettings?.background_color || branding.backgroundColor;
    pass.webServiceURL = `${WALLET_CONFIG.webServiceURL}/api/wallet/v1`;

    // Update primary field (points)
    pass.primaryFields.push({
      key: 'points',
      label: 'Points',
      value: passRecord.pass_data.points,
      changeMessage: 'Your points balance is now %@',
    });

    // Update secondary fields
    pass.secondaryFields.push(
      {
        key: 'tier',
        label: 'Tier',
        value: passRecord.pass_data.tier.toUpperCase(),
      },
      {
        key: 'member',
        label: 'Member',
        value: passRecord.pass_data.member_name,
      }
    );

    // Update barcode
    pass.barcodes = {
      format: 'PKBarcodeFormatQR',
      message: passRecord.pass_data.barcode_message,
      messageEncoding: 'iso-8859-1',
    };

    // Add logo and icon images
    if (logoBuffer) {
      pass.addBuffer('logo.png', logoBuffer);
      pass.addBuffer('logo@2x.png', logoBuffer);
    }

    if (iconBuffer) {
      pass.addBuffer('icon.png', iconBuffer);
      pass.addBuffer('icon@2x.png', iconBuffer);
    }

    return pass;
  }

  /**
   * Create the pass.json model
   */
  private async createPassModel(params: {
    customer: Customer;
    vendor: Vendor;
    passRecord: WalletPass;
    vendorSettings: VendorWalletSettings | null;
    branding: any;
  }) {
    const { customer, vendor, passRecord, vendorSettings, branding } = params;

    const model = {
      formatVersion: 1,
      passTypeIdentifier:
        vendorSettings?.pass_type_identifier || WALLET_CONFIG.passTypeIdentifier,
      teamIdentifier:
        vendorSettings?.team_identifier || WALLET_CONFIG.teamIdentifier,
      serialNumber: passRecord.serial_number,
      authenticationToken: passRecord.authentication_token,

      // Branding
      organizationName:
        vendorSettings?.organization_name || branding.organizationName,
      description: vendorSettings?.description || `${vendor.store_name} Loyalty Card`,
      logoText: vendorSettings?.logo_text || branding.logoText,

      // Colors
      foregroundColor:
        vendorSettings?.foreground_color ||
        WALLET_CONFIG.defaultColors.foregroundColor,
      backgroundColor:
        vendorSettings?.background_color || branding.backgroundColor,

      // Web Service for pass updates
      webServiceURL: `${WALLET_CONFIG.webServiceURL}/api/wallet/v1`,

      // Pass Structure (Store Card)
      storeCard: {
        // Primary field - Points
        primaryFields: [
          {
            key: 'points',
            label: 'Points',
            value: passRecord.pass_data.points.toString(),
            changeMessage: 'Your points balance is now %@',
          },
        ],

        // Secondary fields
        secondaryFields: [
          {
            key: 'tier',
            label: 'Tier',
            value: passRecord.pass_data.tier.toUpperCase(),
          },
          {
            key: 'member',
            label: 'Member',
            value: passRecord.pass_data.member_name,
          },
        ],

        // Auxiliary fields
        auxiliaryFields: [
          {
            key: 'member_since',
            label: 'Member Since',
            value: new Date(customer.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            }),
          },
        ],

        // Back fields
        backFields: [
          {
            key: 'email',
            label: 'Email',
            value: customer.email,
          },
          {
            key: 'store',
            label: 'Store',
            value: vendor.store_name,
          },
          {
            key: 'terms',
            label: 'Terms & Conditions',
            value: `Visit ${vendor.slug}.com for full terms and conditions.`,
          },
        ],
      },

      // Barcode
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: passRecord.pass_data.barcode_message,
        messageEncoding: 'iso-8859-1',
      },

      // Also support newer barcodes array for iOS 9+
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: passRecord.pass_data.barcode_message,
          messageEncoding: 'iso-8859-1',
        },
      ],
    };

    return model;
  }

  /**
   * Get vendor wallet settings from database
   */
  private async getVendorWalletSettings(
    vendorId: string
  ): Promise<VendorWalletSettings | null> {
    try {
      const { data, error } = await supabase
        .from('vendor_wallet_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .single();

      if (error) {
        console.log('No vendor wallet settings found, using defaults');
        return null;
      }

      return data as VendorWalletSettings;
    } catch (error) {
      console.error('Error fetching vendor wallet settings:', error);
      return null;
    }
  }

  /**
   * Download image from URL and return as buffer
   */
  private async downloadImage(url?: string): Promise<Buffer | null> {
    if (!url) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Failed to download image:', error);
      return null;
    }
  }

  /**
   * Log wallet pass event
   */
  private async logPassEvent(
    passId: string,
    customerId: string,
    eventType: string
  ) {
    try {
      await supabase.from('wallet_pass_events').insert({
        pass_id: passId,
        customer_id: customerId,
        event_type: eventType,
      });
    } catch (error) {
      console.error('Failed to log pass event:', error);
    }
  }

  /**
   * Update existing pass (generates new .pkpass with updated data)
   */
  async updatePass(
    passId: string
  ): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
    try {
      // Get pass record
      const { data: passRecord, error: passError } = await supabase
        .from('wallet_passes')
        .select('*, customers(*), vendors(*)')
        .eq('id', passId)
        .single();

      if (passError || !passRecord) {
        return { success: false, error: 'Pass not found' };
      }

      // Get latest customer data
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', passRecord.customer_id)
        .single();

      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Update pass data
      const updatedPassData = {
        points: customer.loyalty_points,
        tier: customer.loyalty_tier,
        member_name: `${customer.first_name} ${customer.last_name}`,
        member_since: customer.created_at,
        barcode_message: `CUSTOMER-${customer.id.substring(0, 8).toUpperCase()}`,
      };

      // Update database
      await supabase
        .from('wallet_passes')
        .update({
          pass_data: updatedPassData,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', passId);

      // Generate new pass
      const buffer = await this.generatePass(
        customer,
        passRecord.vendors,
        { ...passRecord, pass_data: updatedPassData }
      );

      // Log event
      await this.logPassEvent(passId, customer.id, 'updated');

      return { success: true, buffer };
    } catch (error) {
      console.error('Failed to update pass:', error);
      return { success: false, error: String(error) };
    }
  }
}

// Export singleton instance
export const walletPassGenerator = new WalletPassGenerator();

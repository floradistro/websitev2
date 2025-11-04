/**
 * Setup Charlotte DejaVoo Terminal in Whaletools
 *
 * This script configures the actual DejaVoo P8 terminal for Flora Distro Charlotte
 * with the real credentials from the iPOS Pays dashboard.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Flora Distro IDs
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Real DejaVoo Terminal Details from iPOS Pays
const DEJAVOO_CONFIG = {
  authkey: 'xaDMg7bN3f',
  tpn: '253525983231',
  register_id: '4990101',
  // You'll need to provide these from your VAR sheet:
  merchant_id: '', // TODO: Get from VAR sheet
  store_number: '', // TODO: Get from VAR sheet
  v_number: '', // TODO: Get from VAR sheet
};

async function main() {
  console.log('🚀 Setting up Charlotte DejaVoo Terminal in Whaletools...\n');

  // 1. Find Charlotte location
  console.log('📍 Finding Charlotte location...');
  const { data: locations, error: locationError } = await supabase
    .from('locations')
    .select('id, name')
    .eq('vendor_id', VENDOR_ID)
    .ilike('name', '%charlotte%');

  if (locationError || !locations || locations.length === 0) {
    console.error('❌ Error finding Charlotte location:', locationError);
    return;
  }

  const charlotteLocation = locations[0];
  console.log(`✅ Found location: ${charlotteLocation.name} (${charlotteLocation.id})\n`);

  // 2. Check if payment processor already exists
  console.log('💳 Checking for existing payment processor...');
  const { data: existingProcessors } = await supabase
    .from('payment_processors')
    .select('*')
    .eq('location_id', charlotteLocation.id)
    .eq('processor_type', 'dejavoo');

  let processorId: string;

  if (existingProcessors && existingProcessors.length > 0) {
    // Update existing processor
    processorId = existingProcessors[0].id;
    console.log(`📝 Updating existing processor (${processorId})...`);

    const { error: updateError } = await supabase
      .from('payment_processors')
      .update({
        processor_name: 'DejaVoo - Charlotte Terminal',
        dejavoo_authkey: DEJAVOO_CONFIG.authkey,
        dejavoo_tpn: DEJAVOO_CONFIG.tpn,
        dejavoo_register_id: DEJAVOO_CONFIG.register_id,
        dejavoo_merchant_id: DEJAVOO_CONFIG.merchant_id || existingProcessors[0].dejavoo_merchant_id,
        dejavoo_store_number: DEJAVOO_CONFIG.store_number || existingProcessors[0].dejavoo_store_number,
        dejavoo_v_number: DEJAVOO_CONFIG.v_number || existingProcessors[0].dejavoo_v_number,
        is_active: true,
        is_default: true,
        environment: 'production',
        updated_at: new Date().toISOString(),
      })
      .eq('id', processorId);

    if (updateError) {
      console.error('❌ Error updating processor:', updateError);
      return;
    }
    console.log('✅ Payment processor updated\n');
  } else {
    // Create new processor
    console.log('📝 Creating new payment processor...');

    const { data: newProcessor, error: createError } = await supabase
      .from('payment_processors')
      .insert({
        vendor_id: VENDOR_ID,
        location_id: charlotteLocation.id,
        processor_type: 'dejavoo',
        processor_name: 'DejaVoo - Charlotte Terminal',
        dejavoo_authkey: DEJAVOO_CONFIG.authkey,
        dejavoo_tpn: DEJAVOO_CONFIG.tpn,
        dejavoo_register_id: DEJAVOO_CONFIG.register_id,
        dejavoo_merchant_id: DEJAVOO_CONFIG.merchant_id || '000000069542',
        dejavoo_store_number: DEJAVOO_CONFIG.store_number || '3133',
        dejavoo_v_number: DEJAVOO_CONFIG.v_number || 'V7979944',
        is_active: true,
        is_default: true,
        environment: 'production',
      })
      .select()
      .single();

    if (createError || !newProcessor) {
      console.error('❌ Error creating processor:', createError);
      return;
    }

    processorId = newProcessor.id;
    console.log(`✅ Payment processor created (${processorId})\n`);
  }

  // 3. Find or create Register #1
  console.log('🖥️  Checking for Register #1...');
  const { data: existingRegisters } = await supabase
    .from('pos_registers')
    .select('*')
    .eq('location_id', charlotteLocation.id)
    .order('created_at', { ascending: true });

  let registerId: string;

  if (existingRegisters && existingRegisters.length > 0) {
    // Update first register
    registerId = existingRegisters[0].id;
    console.log(`📝 Updating existing register (${registerId})...`);

    const { error: updateRegError } = await supabase
      .from('pos_registers')
      .update({
        register_name: 'Register 1',
        device_name: 'DejaVoo P8 - Charlotte',
        payment_processor_id: processorId,
        processor_type: 'dejavoo',
        hardware_model: 'Dejavoo P8',
        device_type: 'android_tablet',
        status: 'active',
        allow_cash: true,
        allow_card: true,
        allow_refunds: true,
        allow_voids: true,
        supports_nfc: true,
        supports_emv: true,
        supports_magstripe: true,
        supports_ebt: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registerId);

    if (updateRegError) {
      console.error('❌ Error updating register:', updateRegError);
      return;
    }
    console.log('✅ Register updated\n');
  } else {
    // Create new register
    console.log('📝 Creating new register...');

    const { data: newRegister, error: createRegError } = await supabase
      .from('pos_registers')
      .insert({
        vendor_id: VENDOR_ID,
        location_id: charlotteLocation.id,
        register_number: 'REG-CHA-001',
        register_name: 'Register 1',
        device_name: 'DejaVoo P8 - Charlotte',
        payment_processor_id: processorId,
        processor_type: 'dejavoo',
        hardware_model: 'Dejavoo P8',
        device_type: 'android_tablet',
        status: 'active',
        allow_cash: true,
        allow_card: true,
        allow_refunds: true,
        allow_voids: true,
        supports_nfc: true,
        supports_emv: true,
        supports_magstripe: true,
        supports_ebt: true,
      })
      .select()
      .single();

    if (createRegError || !newRegister) {
      console.error('❌ Error creating register:', createRegError);
      return;
    }

    registerId = newRegister.id;
    console.log(`✅ Register created (${registerId})\n`);
  }

  // 4. Verify configuration
  console.log('🔍 Verifying configuration...');
  const { data: verification } = await supabase
    .from('terminal_overview')
    .select('*')
    .eq('register_id', registerId)
    .single();

  if (verification) {
    console.log('✅ Configuration verified!\n');
    console.log('📊 Terminal Configuration:');
    console.log(`   Location: ${verification.location_name}`);
    console.log(`   Register: ${verification.register_name} (${verification.register_number})`);
    console.log(`   Device: ${verification.device_name}`);
    console.log(`   Hardware: ${verification.hardware_model}`);
    console.log(`   Processor: ${verification.processor_name}`);
    console.log(`   Status: ${verification.register_status}`);
    console.log(`\n✅ DejaVoo terminal is now configured and ready to use!`);
    console.log(`\n📱 You can manage it at: /vendor/terminals`);
  } else {
    console.log('⚠️  Could not verify configuration');
  }
}

main().catch(console.error);

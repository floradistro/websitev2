-- Add header and footer sections to vendor_page_sections for all vendors
-- This migration adds editable header and footer sections to the component registry

-- First, add component templates for smart_header and smart_footer
INSERT INTO component_templates (
  component_key, 
  name, 
  description, 
  category, 
  fetches_real_data,
  is_public
) VALUES 
  (
    'smart_header',
    'Smart Header',
    'Fully editable header with logo, navigation, cart, and search functionality',
    'smart',
    true,
    true
  ),
  (
    'smart_footer',
    'Smart Footer',
    'Fully editable footer with links, social media, and legal sections',
    'smart',
    false,
    true
  )
ON CONFLICT (component_key) DO NOTHING;

DO $$
DECLARE
  vendor_record RECORD;
  header_section_id UUID;
  footer_section_id UUID;
BEGIN
  -- Loop through all vendors
  FOR vendor_record IN SELECT id, store_name FROM vendors
  LOOP
    -- Create HEADER section for each vendor (order -100 to appear first)
    INSERT INTO vendor_storefront_sections (vendor_id, section_key, section_order, page_type, content_data)
    VALUES (vendor_record.id, 'header', -100, 'all', '{}'::jsonb)
    ON CONFLICT (vendor_id, page_type, section_key) DO NOTHING
    RETURNING id INTO header_section_id;
    
    -- Create default header component instance if section was created
    IF header_section_id IS NOT NULL THEN
      INSERT INTO vendor_component_instances (
        vendor_id, 
        section_id, 
        component_key, 
        props, 
        position_order, 
        is_enabled, 
        is_visible
      )
      SELECT 
        vendor_record.id,
        header_section_id,
        'smart_header',
        jsonb_build_object(
          'vendorId', vendor_record.id,
          'vendorSlug', v.slug,
          'vendorName', vendor_record.store_name,
          'logoUrl', COALESCE(v.logo_url, '/yacht-club-logo.png'),
          'showAnnouncement', true,
          'announcementText', 'Free shipping over $45',
          'showSearch', true,
          'showCart', true,
          'showAccount', true,
          'hideOnScroll', true,
          'sticky', true,
          'navLinks', jsonb_build_array(
            jsonb_build_object('label', 'Shop', 'href', '/shop', 'showDropdown', true),
            jsonb_build_object('label', 'About', 'href', '/about'),
            jsonb_build_object('label', 'Contact', 'href', '/contact')
          )
        ),
        0,
        true,
        true
      FROM vendors v
      WHERE v.id = vendor_record.id
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Create FOOTER section for each vendor (order 9999 to appear last)
    INSERT INTO vendor_storefront_sections (vendor_id, section_key, section_order, page_type, content_data)
    VALUES (vendor_record.id, 'footer', 9999, 'all', '{}'::jsonb)
    ON CONFLICT (vendor_id, page_type, section_key) DO NOTHING
    RETURNING id INTO footer_section_id;
    
    -- Create default footer component instance if section was created
    IF footer_section_id IS NOT NULL THEN
      INSERT INTO vendor_component_instances (
        vendor_id, 
        section_id, 
        component_key, 
        props, 
        position_order, 
        is_enabled, 
        is_visible
      )
      SELECT 
        vendor_record.id,
        footer_section_id,
        'smart_footer',
        jsonb_build_object(
          'vendorId', vendor_record.id,
          'vendorSlug', v.slug,
          'vendorName', vendor_record.store_name,
          'showLegalCompliance', true,
          'showCopyright', true,
          'showPoweredBy', true,
          'columns', jsonb_build_array(
            jsonb_build_object(
              'title', 'Company',
              'links', jsonb_build_array(
                jsonb_build_object('label', 'About', 'href', '/about'),
                jsonb_build_object('label', 'Contact', 'href', '/contact')
              )
            ),
            jsonb_build_object(
              'title', 'Shop',
              'links', jsonb_build_array(
                jsonb_build_object('label', 'All Products', 'href', '/shop'),
                jsonb_build_object('label', 'Flower', 'href', '/shop?category=flower'),
                jsonb_build_object('label', 'Concentrate', 'href', '/shop?category=concentrate'),
                jsonb_build_object('label', 'Edibles', 'href', '/shop?category=edibles'),
                jsonb_build_object('label', 'Vape', 'href', '/shop?category=vape')
              )
            ),
            jsonb_build_object(
              'title', 'Support',
              'links', jsonb_build_array(
                jsonb_build_object('label', 'Shipping', 'href', '/shipping'),
                jsonb_build_object('label', 'Returns', 'href', '/returns'),
                jsonb_build_object('label', 'FAQ', 'href', '/faq'),
                jsonb_build_object('label', 'Lab Results', 'href', '/lab-results')
              )
            ),
            jsonb_build_object(
              'title', 'Legal',
              'links', jsonb_build_array(
                jsonb_build_object('label', 'Privacy', 'href', '/privacy'),
                jsonb_build_object('label', 'Terms', 'href', '/terms'),
                jsonb_build_object('label', 'Cookies', 'href', '/cookies')
              )
            )
          )
        ),
        0,
        true,
        true
      FROM vendors v
      WHERE v.id = vendor_record.id
      ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Added header and footer sections for vendor: %', vendor_record.store_name;
  END LOOP;
END $$;


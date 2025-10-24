interface MetaData {
  key: string;
  value: string;
}

interface FloraFieldsProps {
  metaData?: MetaData[];
  fields?: { [key: string]: any };
}

export default function FloraFields({ metaData, fields: blueprintFields }: FloraFieldsProps) {
  // Define the fields we want to display and their labels
  const fieldConfig: { [key: string]: string } = {
    // Flower fields
    'strain_type': 'Type',
    'lineage': 'Lineage',
    'nose': 'Nose',
    'terpene_profile': 'Terpenes',
    'terpenes': 'Terpenes',
    'effects': 'Effects',
    'effect': 'Effects',
    'thca_percentage': 'THCa %',
    'delta_9_percentage': 'Δ9 %',
    'delta9_percentage': 'Δ9 %',
    // Vape fields
    'hardware_type': 'Hardware',
    'oil_type': 'Oil',
    'capacity': 'Capacity',
    // Edible fields
    'dosage_per_serving': 'Dosage',
    'servings_per_package': 'Servings',
    'total_dosage': 'Total',
    'ingredients': 'Ingredients',
    'allergens': 'Allergens',
    'dietary': 'Dietary',
    // Concentrate fields
    'extract_type': 'Type',
    'extraction_method': 'Method',
  };

  // Build display fields from either new blueprintFields or old metaData
  const fields: { key: string; label: string; value: string }[] = [];
  
  // New format: direct fields object
  if (blueprintFields && Object.keys(blueprintFields).length > 0) {
    Object.entries(blueprintFields).forEach(([key, value]) => {
      const label = fieldConfig[key];
      if (!label) return;
      
      const existingField = fields.find(f => f.label === label);
      if (!existingField && value !== null && value !== undefined) {
        let displayValue: string;
        
        // Handle arrays (terpenes, effects, etc.)
        if (Array.isArray(value)) {
          displayValue = value.length > 0 ? value.join(', ') : '—';
        } 
        // Handle numbers
        else if (typeof value === 'number') {
          displayValue = value.toString();
          // Add 'mg' for dosage fields
          if (key.includes('dosage') || key.includes('total')) {
            displayValue += 'mg';
          }
        }
        // Handle strings
        else if (typeof value === 'string') {
          displayValue = value.trim() !== '' ? value : '—';
        }
        // Handle other types
        else {
          displayValue = String(value);
        }
        
        fields.push({
          key,
          label,
          value: displayValue,
        });
      }
    });
  }
  // Old format: metaData array with _field_ prefix
  else if (metaData && metaData.length > 0) {
    metaData.forEach((meta) => {
      if (meta.key && meta.key.startsWith('_field_')) {
        const fieldName = meta.key.replace('_field_', '');
        const label = fieldConfig[fieldName];
        
        if (!label) return;
        
        const existingField = fields.find(f => f.label === label);
        if (!existingField) {
          const displayValue = (meta.value && meta.value.trim() !== '') ? meta.value : '—';
          fields.push({
            key: fieldName,
            label: label,
            value: displayValue,
          });
        }
      }
    });
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[24px] p-6">
      <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/60">Product Details</h3>
      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.key} className="flex items-center justify-between gap-3">
            <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-xs whitespace-nowrap">
              {field.label}
            </span>
            <span className="text-sm tracking-wide text-white font-normal text-right truncate">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


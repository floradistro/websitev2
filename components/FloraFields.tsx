interface MetaData {
  key: string;
  value: string;
}

interface FloraFieldsProps {
  metaData: MetaData[];
}

export default function FloraFields({ metaData }: FloraFieldsProps) {
  // Define the fields we want to display and their labels
  const fieldConfig: { [key: string]: string } = {
    // Flower fields
    'strain_type': 'Strain',
    'thc_percentage': 'THCa %',
    'delta9_percentage': 'Δ9 %',
    'thca_%': 'THCa %',
    'thca_percentage': 'THCa %',
    'lineage': 'Lineage',
    'nose': 'Aroma',
    'terpene': 'Terpenes',
    'terpenes': 'Terpenes',
    'effects': 'Effects',
    'effect': 'Effects',
    // Edible fields
    'edible_type': 'Type',
    'thc_per_serving': 'THC/Serving',
    'servings_per_package': 'Servings',
    'total_thc': 'Total THC',
    'ingredients': 'Ingredients',
    'allergens': 'Allergens',
    'flavor': 'Flavor',
    'calories_per_serving': 'Calories',
    // Concentrate fields
    'consistency': 'Type',
    'extraction_method': 'Method',
    'thc_concentration': 'THC %',
    // Vape fields
    'vape_type': 'Type',
    'battery_type': 'Battery',
    'volume_ml': 'Volume',
    // Generic
    'description': 'Description'
  };

  // Extract flora fields from metadata (only _field_ prefixed ones)
  const fields: { key: string; label: string; value: string }[] = [];
  
  metaData.forEach((meta) => {
    if (meta.key && meta.key.startsWith('_field_')) {
      const fieldName = meta.key.replace('_field_', '');
      const label = fieldConfig[fieldName];
      
      // Only show fields we have labels for
      if (!label) return;
      
      // Check if we already added this label
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

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 pt-2 border-t border-white/10">
      {fields.map((field, idx) => (
        <div key={field.key} className="flex items-center justify-between gap-2">
          <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-[10px] sm:text-xs whitespace-nowrap">
            {field.label}
          </span>
          <span className="text-xs sm:text-sm tracking-wide text-white/90 font-normal text-right truncate">
            {field.value}
          </span>
        </div>
      ))}
    </div>
  );
}


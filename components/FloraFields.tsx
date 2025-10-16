interface MetaData {
  key: string;
  value: string;
}

interface FloraFieldsProps {
  metaData: MetaData[];
}

export default function FloraFields({ metaData }: FloraFieldsProps) {
  // Define the fields we want to display and their labels
  const fieldConfig = [
    { key: "strain_type", label: "Strain Type" },
    { key: "thca_%", label: "THCa" },
    { key: "thca_percentage", label: "THCa" },
    { key: "lineage", label: "Lineage" },
    { key: "nose", label: "Nose" },
    { key: "terpene", label: "Terpenes" },
    { key: "terpenes", label: "Terpenes" },
    { key: "effects", label: "Effects" },
    { key: "effect", label: "Effects" },
  ];

  // Extract flora fields from metadata
  const fields: { key: string; label: string; value: string }[] = [];
  
  fieldConfig.forEach((config) => {
    const metaItem = metaData.find(
      (meta) => meta.key.toLowerCase() === config.key.toLowerCase()
    );
    
    if (metaItem && metaItem.value && !fields.find(f => f.label === config.label)) {
      fields.push({
        key: config.key,
        label: config.label,
        value: metaItem.value,
      });
    }
  });

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 pt-2 border-t border-white/10">
      {fields.map((field, idx) => (
        <div key={field.key} className="flex items-center justify-between gap-2">
          <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-[10px] whitespace-nowrap">
            {field.label}
          </span>
          <span className="text-[11px] tracking-wide text-white/90 font-normal text-right truncate">
            {field.value}
          </span>
        </div>
      ))}
    </div>
  );
}


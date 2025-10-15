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
    <div className="mb-6 md:mb-8">
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-elevated p-4 md:p-6 border border-white/10">
        <h3 className="text-sm font-light tracking-wide mb-4 pb-3 border-b border-white/10 text-white">
          Product Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {fields.map((field, idx) => (
            <div
              key={field.key}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="animate-fadeIn"
            >
              <div className="text-[10px] uppercase tracking-[0.1em] text-white/50 font-light mb-1.5">
                {field.label}
              </div>
              <div className="text-base font-light leading-relaxed text-white/90">
                {field.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


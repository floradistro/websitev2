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
    <div className="-mx-3 md:mx-0 mb-6 md:mb-8">
      <div className="bg-white/5 backdrop-blur-sm md:rounded-lg border-y md:border border-white/10">
        <div className="px-6 py-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white uppercase tracking-[0.15em]">
            Specifications
          </h3>
        </div>
        <div className="divide-y divide-white/10">
          {fields.map((field, idx) => (
            <div
              key={field.key}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="animate-fadeIn px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
            >
              <div className="text-sm uppercase tracking-wider text-white/50 font-light">
                {field.label}
              </div>
              <div className="text-base font-semibold text-white">
                {field.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


"use client";

interface FloraFieldsProps {
  fields: any;
  metaData?: any;
}

export default function FloraFields({ fields, metaData }: FloraFieldsProps) {
  if (!fields && !metaData) {
    return null;
  }

  const displayData = { ...fields, ...metaData };
  const entries = Object.entries(displayData).filter(([_, value]) => value);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">Product Details</h3>
      <div className="grid gap-2">
        {entries.map(([key, value]: [string, any]) => (
          <div key={key} className="flex justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-white/60 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-white font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


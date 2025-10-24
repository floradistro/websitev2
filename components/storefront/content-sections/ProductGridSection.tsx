interface ProductGridSectionProps {
  content: {
    headline?: string;
    subheadline?: string;
    show_filters?: boolean;
    columns?: number;
  };
}

export function ProductGridSection({ content }: ProductGridSectionProps) {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-black" />
      <div className="max-w-7xl mx-auto relative z-10">
        {content.headline && (
          <div className="mb-8 sm:mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-3 tracking-[-0.02em]">
              {content.headline}
            </h2>
            {content.subheadline && (
              <p className="text-base sm:text-lg text-neutral-400 font-light">
                {content.subheadline}
              </p>
            )}
          </div>
        )}
        
        {/* Products will be injected here by the shop page */}
        <div className="text-white/40 text-sm text-center py-8">
          Products display below
        </div>
      </div>
    </section>
  );
}


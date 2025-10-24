interface ShopHeaderSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    show_filters?: boolean;
    show_category_bar?: boolean;
    show_location_filter?: boolean;
    show_sort?: boolean;
  };
}

export function ShopHeaderSection({ content }: ShopHeaderSectionProps) {
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8">
          {content.title && (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-3 tracking-[-0.02em]">
              {content.title}
            </h1>
          )}
          {content.subtitle && (
            <p className="text-base sm:text-lg text-neutral-400 font-light">
              {content.subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}


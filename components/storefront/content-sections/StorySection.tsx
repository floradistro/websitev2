interface StorySectionProps {
  content: {
    headline?: string;
    paragraphs?: string[];
    background_color?: string;
    image_url?: string;
  };
  templateStyle?: string;
  basePath?: string;
}

export function StorySection({ content, templateStyle = 'minimalist' }: StorySectionProps) {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {content.headline && (
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12 text-center tracking-[-0.02em]">
            {content.headline}
          </h2>
        )}
        
        <div className="space-y-6 text-lg md:text-xl text-white/90 leading-relaxed font-light">
          {content.paragraphs?.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}


import { getPage } from "@/lib/wordpress";

export default async function AboutPage() {
  const page = await getPage("about");

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] bg-[#9a9a97] flex items-center justify-center">
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 text-white">
            {page?.title?.rendered || "About Flora Distro"}
          </h1>
          <p className="text-xl md:text-2xl font-light max-w-3xl mx-auto text-gray-200">
            Cultivating excellence in floral distribution since our inception
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-6 py-24 bg-[#c5c5c2]">
        {page?.content?.rendered ? (
          <div
            className="prose prose-lg max-w-4xl mx-auto text-[#767676] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content.rendered }}
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
              <h2 className="text-3xl font-light uppercase tracking-wider mb-6">
                Our Story
              </h2>
              <p className="text-lg text-[#767676] leading-relaxed">
                Flora Distro represents the pinnacle of floral distribution excellence.
                Our commitment to quality, sustainability, and innovation has established
                us as the premier choice for discerning clients worldwide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
              <div className="text-center">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">
                  Quality
                </h3>
                <p className="text-[#767676]">
                  Every product meets our rigorous standards for excellence and beauty.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">
                  Sustainability
                </h3>
                <p className="text-[#767676]">
                  Committed to environmental responsibility in every aspect of our business.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">
                  Innovation
                </h3>
                <p className="text-[#767676]">
                  Pioneering new approaches to floral distribution and presentation.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Values Section */}
      <section className="bg-black text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-light tracking-wider uppercase mb-16">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="p-8 border border-white/20">
              <h3 className="text-lg uppercase tracking-wider mb-4">Excellence</h3>
              <p className="text-sm text-[#aaa]">
                Uncompromising standards in every detail
              </p>
            </div>
            <div className="p-8 border border-white/20">
              <h3 className="text-lg uppercase tracking-wider mb-4">Integrity</h3>
              <p className="text-sm text-[#aaa]">
                Transparency and honesty in all relationships
              </p>
            </div>
            <div className="p-8 border border-white/20">
              <h3 className="text-lg uppercase tracking-wider mb-4">Passion</h3>
              <p className="text-sm text-[#aaa]">
                Dedicated to the art and science of florals
              </p>
            </div>
            <div className="p-8 border border-white/20">
              <h3 className="text-lg uppercase tracking-wider mb-4">Service</h3>
              <p className="text-sm text-[#aaa]">
                Exceeding expectations with every interaction
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

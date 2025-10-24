import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { getVendorPageSections } from '@/lib/storefront/content-api';
import { DifferentiatorsSection, StatsSection, CTASection } from './content-sections';

interface ContentDrivenAboutPageProps {
  vendor: VendorStorefront;
}

export async function ContentDrivenAboutPage({ vendor }: ContentDrivenAboutPageProps) {
  // Fetch all content sections for about page
  const sections = await getVendorPageSections(vendor.id, 'about');
  
  // Get template style from vendor
  const templateStyle = vendor.template_id === 'luxury' ? 'luxury' 
                      : vendor.template_id === 'bold' ? 'bold'
                      : vendor.template_id === 'organic' ? 'organic'
                      : 'minimalist';

  // Organize sections by key
  const sectionMap = sections.reduce((acc, section) => {
    acc[section.section_key] = section.content_data;
    return acc;
  }, {} as Record<string, any>);

  const basePath = `/storefront`;

  // Template-specific styles
  const styles = {
    minimalist: {
      container: 'bg-black min-h-screen',
      heroSection: 'py-20 bg-black',
      heroImage: 'w-32 h-32 mx-auto mb-8 opacity-50',
      heroHeadline: 'text-5xl md:text-6xl font-light text-white mb-4 text-center',
      heroSubheadline: 'text-white/60 text-lg text-center max-w-2xl mx-auto',
      storySection: 'py-20 bg-[#0a0a0a]',
      storyIntro: 'text-white/70 text-xl mb-8 text-center',
      storyParagraph: 'text-white/60 text-lg mb-6 leading-relaxed max-w-3xl',
    },
    luxury: {
      container: 'bg-gradient-to-b from-black via-neutral-900 to-black min-h-screen',
      heroSection: 'py-32 bg-gradient-to-b from-black to-neutral-900',
      heroImage: 'w-40 h-40 mx-auto mb-10 opacity-80',
      heroHeadline: 'text-6xl md:text-7xl font-serif font-light text-amber-100 mb-6 text-center',
      heroSubheadline: 'text-amber-200/70 text-2xl text-center max-w-3xl mx-auto font-light',
      storySection: 'py-24 bg-neutral-900/50',
      storyIntro: 'text-amber-200/80 text-2xl mb-10 text-center font-light italic',
      storyParagraph: 'text-amber-200/70 text-xl mb-8 leading-relaxed max-w-3xl font-light',
    },
    bold: {
      container: 'bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 min-h-screen',
      heroSection: 'py-28 bg-gradient-to-br from-purple-900/50 to-transparent',
      heroImage: 'w-48 h-48 mx-auto mb-10',
      heroHeadline: 'text-7xl md:text-8xl font-black text-white mb-6 text-center',
      heroSubheadline: 'text-white/90 text-3xl text-center max-w-3xl mx-auto font-bold',
      storySection: 'py-24 bg-black/30 backdrop-blur',
      storyIntro: 'text-white/90 text-3xl mb-10 text-center font-bold',
      storyParagraph: 'text-white/80 text-2xl mb-8 leading-relaxed max-w-3xl font-semibold',
    },
    organic: {
      container: 'bg-gradient-to-b from-green-950 via-emerald-900 to-teal-950 min-h-screen',
      heroSection: 'py-28 bg-green-950/50',
      heroImage: 'w-36 h-36 mx-auto mb-8 opacity-70 rounded-full',
      heroHeadline: 'text-5xl md:text-6xl font-light text-green-100 mb-4 text-center',
      heroSubheadline: 'text-green-200/70 text-xl text-center max-w-2xl mx-auto',
      storySection: 'py-24 bg-emerald-950/50',
      storyIntro: 'text-green-200/80 text-xl mb-8 text-center',
      storyParagraph: 'text-green-200/70 text-lg mb-6 leading-relaxed max-w-3xl',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container}>
      {/* Hero Section */}
      {sectionMap.hero && (
        <div className={style.heroSection}>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            {vendor.logo_url && (
              <img 
                src={vendor.logo_url} 
                alt={vendor.store_name}
                className={style.heroImage}
              />
            )}
            <h1 className={style.heroHeadline}>{sectionMap.hero.headline}</h1>
            <p className={style.heroSubheadline}>{sectionMap.hero.subheadline}</p>
          </div>
        </div>
      )}

      {/* Story Section */}
      {sectionMap.story && (
        <div className={style.storySection}>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <p className={style.storyIntro}>{sectionMap.story.intro}</p>
            <div className="mx-auto">
              {sectionMap.story.paragraphs.map((paragraph: string, index: number) => (
                <p key={index} className={style.storyParagraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Differentiators Section */}
      {sectionMap.differentiators && (
        <DifferentiatorsSection
          content={sectionMap.differentiators}
          templateStyle={templateStyle}
        />
      )}

      {/* Stats Section */}
      {sectionMap.stats && (
        <StatsSection
          content={sectionMap.stats}
          templateStyle={templateStyle}
        />
      )}

      {/* Bottom CTA */}
      {sectionMap.cta && (
        <CTASection
          content={sectionMap.cta}
          templateStyle={templateStyle}
          basePath={basePath}
        />
      )}
    </div>
  );
}


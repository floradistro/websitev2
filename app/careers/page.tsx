'use client';

import { useEffect, useRef } from 'react';

export default function Careers() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#b5b5b2]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#b5b5b2]/20"></div>
        <div className="relative z-10 text-center px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4 animate-fadeIn">Join Our Team</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-wider uppercase mb-6 premium-text animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Careers
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto animate-scaleIn" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="space-y-20 text-black leading-relaxed">
          <section ref={(el) => { sectionsRef.current[0] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-8 md:p-12 shadow-elevated-lg">
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Join Our Team</h2>
              <p className="text-lg md:text-xl font-light leading-relaxed text-black/80">
                At Flora Distro, we're building more than just a business—we're cultivating a culture of innovation, 
                integrity, and excellence in the hemp and THCA industry. We're looking for passionate individuals 
                who share our commitment to quality and customer satisfaction.
              </p>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[1] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black text-white p-8 md:p-10 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">Competitive Benefits</h3>
                <p className="text-sm text-white/70 font-light">Health insurance, wellness programs, and employee discounts</p>
              </div>
              <div className="bg-black text-white p-8 md:p-10 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">Growth Opportunities</h3>
                <p className="text-sm text-white/70 font-light">Professional development and career advancement</p>
              </div>
              <div className="bg-black text-white p-8 md:p-10 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">Flexible Work</h3>
                <p className="text-sm text-white/70 font-light">Work-life balance with flexible arrangements</p>
              </div>
              <div className="bg-black text-white p-8 md:p-10 group hover:bg-[#1a1a1a] transition-colors duration-300">
                <h3 className="text-xl uppercase tracking-wider mb-4 font-light">Inclusive Culture</h3>
                <p className="text-sm text-white/70 font-light">Collaborative environment that values diversity</p>
              </div>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[2] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">Current Opportunities</h2>
              <p className="text-base md:text-lg font-light leading-relaxed text-black/70 mb-8">
                We're always looking for talented individuals to join our team. While we may not have specific 
                openings at this time, we encourage you to submit your resume for future consideration.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 hover:shadow-elevated-lg transition-all duration-300">
                <p className="text-sm font-light">Customer Service Representatives</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 hover:shadow-elevated-lg transition-all duration-300">
                <p className="text-sm font-light">Fulfillment & Warehouse Staff</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 hover:shadow-elevated-lg transition-all duration-300">
                <p className="text-sm font-light">Quality Assurance Specialists</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 hover:shadow-elevated-lg transition-all duration-300">
                <p className="text-sm font-light">Marketing & Social Media</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 hover:shadow-elevated-lg transition-all duration-300">
                <p className="text-sm font-light">Compliance & Regulatory Affairs</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 hover:shadow-elevated-lg transition-all duration-300">
                <p className="text-sm font-light">Sales & Business Development</p>
              </div>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[3] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-black text-white p-12 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-light uppercase tracking-wider mb-6">How to Apply</h2>
              <p className="text-base md:text-lg font-light leading-relaxed text-white/70 mb-6 max-w-2xl mx-auto">
                To apply, please send your resume and cover letter to
              </p>
              <a href="mailto:careers@floradistro.com" className="inline-block bg-white text-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium">
                careers@floradistro.com
              </a>
            </div>
          </section>

          <section ref={(el) => { sectionsRef.current[4] = el; }} className="opacity-0 translate-y-8 transition-all duration-1000 ease-out">
            <div className="bg-white/20 backdrop-blur-sm border border-black/10 p-8 md:p-10">
              <p className="text-sm font-light text-black/60 text-center leading-relaxed">
                Flora Distro is an equal opportunity employer. We celebrate diversity and are committed to creating 
                an inclusive environment for all employees. All qualified applicants will receive consideration for 
                employment without regard to race, color, religion, gender, gender identity or expression, sexual 
                orientation, national origin, genetics, disability, age, or veteran status.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

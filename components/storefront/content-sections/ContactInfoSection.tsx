// @ts-nocheck
import { Mail, Phone, Clock, MapPin } from 'lucide-react';

interface ContactInfoSectionProps {
  content: {
    email?: string;
    phone?: string;
    hours?: string;
    address?: string;
  };
  vendor?: any;
}

export function ContactInfoSection({ content, vendor }: ContactInfoSectionProps) {
  return (
    <section className="py-16 px-6 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
            <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-white mb-3 tracking-tight uppercase">Email Us</h3>
            <a 
              href={`mailto:${content.email || vendor?.social_links?.email || 'info@example.com'}`} 
              className="text-sm text-neutral-400 hover:text-white font-light transition-colors"
            >
              {content.email || vendor?.social_links?.email || 'info@example.com'}
            </a>
          </div>

          {/* Phone */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
            <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-white mb-3 tracking-tight uppercase">Call Us</h3>
            <a 
              href={`tel:${content.phone || '1-800-EXAMPLE'}`} 
              className="text-sm text-neutral-400 hover:text-white font-light transition-colors"
            >
              {content.phone || '1-800-EXAMPLE'}
            </a>
          </div>

          {/* Hours */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
            <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-6 mx-auto">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-white mb-3 tracking-tight uppercase">Hours</h3>
            <p className="text-sm text-neutral-400 font-light whitespace-pre-line">
              {typeof content.hours === 'string' ? content.hours : 'Mon-Sat: 9AM-9PM\nSunday: 10AM-6PM'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


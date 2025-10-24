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
    <section className="py-8 sm:py-16 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Email */}
          <div className="bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[32px] p-6 sm:p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
              <Mail className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 tracking-tight uppercase">Email Us</h3>
            <a 
              href={`mailto:${content.email || vendor?.social_links?.email || 'info@example.com'}`} 
              className="text-xs sm:text-sm text-neutral-400 hover:text-white font-light transition-colors break-all"
            >
              {content.email || vendor?.social_links?.email || 'info@example.com'}
            </a>
          </div>

          {/* Phone */}
          <div className="bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[32px] p-6 sm:p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
              <Phone className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 tracking-tight uppercase">Call Us</h3>
            <a 
              href={`tel:${content.phone || '1-800-EXAMPLE'}`} 
              className="text-xs sm:text-sm text-neutral-400 hover:text-white font-light transition-colors"
            >
              {content.phone || '1-800-EXAMPLE'}
            </a>
          </div>

          {/* Hours */}
          <div className="bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[32px] p-6 sm:p-8 hover:bg-white/[0.08] hover:border-white/20 transition-all text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] sm:rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-center mb-4 sm:mb-6 mx-auto">
              <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 tracking-tight uppercase">Hours</h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-light whitespace-pre-line">
              {typeof content.hours === 'string' ? content.hours : 'Mon-Sat: 9AM-9PM\nSunday: 10AM-6PM'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


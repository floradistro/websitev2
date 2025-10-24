import { HelpCircle } from 'lucide-react';

interface FAQItemsSectionProps {
  content: {
    headline?: string;
    subheadline?: string;
    questions?: Array<{
      question: string;
      answer: string;
      category?: string;
    }>;
  };
}

export function FAQItemsSection({ content }: FAQItemsSectionProps) {
  // Group questions by category if they have categories
  const groupedQuestions = content.questions?.reduce((acc, q) => {
    const category = q.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(q);
    return acc;
  }, {} as Record<string, Array<{ question: string; answer: string }>>);

  return (
    <section className="py-16 px-6 relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] border border-white/10 p-8 md:p-12">
          {content.headline && (
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-[-0.03em] text-center">
              {content.headline}
            </h1>
          )}
          {content.subheadline && (
            <p className="text-neutral-400 text-lg mb-12 font-light text-center">
              {content.subheadline}
            </p>
          )}

          <div className="space-y-12">
            {groupedQuestions && Object.entries(groupedQuestions).map(([category, questions], idx) => (
              <div key={idx}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">{category}</h2>
                </div>
                <div className="space-y-4">
                  {questions.map((faq, qIdx) => (
                    <div key={qIdx} className="bg-white/5 border border-white/10 rounded-[20px] p-6">
                      <h3 className="text-white font-semibold mb-3">{faq.question}</h3>
                      <p className="text-neutral-300 text-sm font-light leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


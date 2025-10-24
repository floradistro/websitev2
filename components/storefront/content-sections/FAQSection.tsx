"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  content: {
    headline: string;
    items: FAQItem[];
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
}

export function FAQSection({ content, templateStyle = 'minimalist' }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const styles = {
    minimalist: {
      container: 'py-20 bg-black',
      headline: 'text-4xl md:text-5xl font-light text-white mb-12',
      list: 'max-w-3xl mx-auto space-y-4',
      item: 'border border-white/10 rounded-lg overflow-hidden',
      question: 'flex items-center justify-between w-full text-left px-6 py-4 text-white hover:bg-white/5 transition-colors',
      questionText: 'text-lg font-medium',
      answer: 'px-6 pb-4 text-white/60 leading-relaxed',
    },
    luxury: {
      container: 'py-32 bg-gradient-to-b from-black to-neutral-900',
      headline: 'text-5xl md:text-6xl font-serif font-light text-amber-100 mb-16 text-center',
      list: 'max-w-4xl mx-auto space-y-6',
      item: 'bg-gradient-to-br from-amber-950/20 to-transparent border border-amber-500/10 rounded-xl overflow-hidden',
      question: 'flex items-center justify-between w-full text-left px-8 py-6 text-amber-100 hover:bg-amber-500/5 transition-colors',
      questionText: 'text-xl font-serif',
      answer: 'px-8 pb-6 text-amber-200/70 leading-relaxed text-lg',
    },
    bold: {
      container: 'py-24 bg-gradient-to-br from-indigo-900 to-purple-900',
      headline: 'text-6xl md:text-7xl font-black text-white mb-16 text-center',
      list: 'max-w-4xl mx-auto space-y-4',
      item: 'bg-white/10 backdrop-blur border-2 border-white/20 rounded-2xl overflow-hidden',
      question: 'flex items-center justify-between w-full text-left px-8 py-6 text-white hover:bg-white/5 transition-colors',
      questionText: 'text-xl font-bold',
      answer: 'px-8 pb-6 text-white/80 leading-relaxed text-lg font-medium',
    },
    organic: {
      container: 'py-28 bg-teal-950',
      headline: 'text-4xl md:text-5xl font-light text-green-100 mb-14 text-center',
      list: 'max-w-3xl mx-auto space-y-4',
      item: 'bg-green-900/20 border border-green-500/10 rounded-3xl overflow-hidden',
      question: 'flex items-center justify-between w-full text-left px-6 py-5 text-green-100 hover:bg-green-500/5 transition-colors',
      questionText: 'text-lg font-medium',
      answer: 'px-6 pb-5 text-green-200/70 leading-relaxed',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <h2 className={style.headline}>{content.headline}</h2>
        <div className={style.list}>
          {content.items.map((item, index) => (
            <div key={index} className={style.item}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={style.question}
              >
                <span className={style.questionText}>{item.question}</span>
                <ChevronDown 
                  className={`transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  size={20}
                />
              </button>
              {openIndex === index && (
                <div className={style.answer}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


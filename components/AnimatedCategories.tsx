'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HorizontalScroll from "./HorizontalScroll";

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: {
    src: string;
  };
}

export default function AnimatedCategories({ categories }: { categories: Category[] }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#c5c5c2] py-8">
      <h2 
        className="text-2xl md:text-3xl font-light text-center uppercase tracking-wider mb-6 px-3"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        Explore Categories
      </h2>

      <HorizontalScroll className="flex overflow-x-auto gap-px scrollbar-hide">
        {categories.map((category, index) => (
          <Link 
            key={category.id} 
            href={`/products?category=${category.slug}`} 
            className="group flex-shrink-0 w-[45vw] md:w-[30vw] lg:w-[23vw] transition-all duration-700 bg-[#2a2a2a] hover:bg-[#333333] border border-white/5"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <div className="aspect-[3/4] bg-[#1a1a1a] mb-3 overflow-hidden relative shadow-sm transition-all duration-300 group-hover:shadow-md border-b border-white/5">
              {category.image ? (
                <img
                  src={category.image.src}
                  alt={category.name}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a]" />
              )}
            </div>
            <h3 className="text-sm md:text-base uppercase tracking-[0.25em] font-light text-center px-2 pb-3 transition-opacity duration-300 group-hover:opacity-60 text-white">
              {category.name}
            </h3>
          </Link>
        ))}
      </HorizontalScroll>
    </section>
  );
}


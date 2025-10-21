"use client";

import Script from "next/script";

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
}

export function OrganizationSchema({ 
  name = "Yacht Club",
  url = "https://floradistro.com",
  logo = "https://floradistro.com/yacht-club-logo.png"
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    "logo": logo,
    "sameAs": [
      "https://www.facebook.com/floradistro",
      "https://www.instagram.com/floradistro",
      "https://twitter.com/floradistro",
      "https://www.youtube.com/@floradistro"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": "English"
    }
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  product: any;
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const price = product.price ? parseFloat(product.price) : 0;
  const image = product.images?.[0]?.src || "https://floradistro.com/yacht-club-logo.png";
  const category = product.categories?.[0]?.name || "Products";

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": image,
    "description": product.short_description 
      ? product.short_description.replace(/<[^>]*>/g, '')
      : product.name,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "Yacht Club"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://floradistro.com/products/${product.id}`,
      "priceCurrency": "USD",
      "price": price,
      "availability": product.stock_status === "instock" 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "category": category
  };

  // Add aggregateRating if reviews exist
  if (product.average_rating && product.rating_count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.average_rating,
      "reviewCount": product.rating_count
    };
  }

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface LocalBusinessSchemaProps {
  location: any;
}

export function LocalBusinessSchema({ location }: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": `Yacht Club - ${location.name}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": location.address,
      "addressLocality": location.city,
      "addressRegion": location.state,
      "postalCode": location.zip,
      "addressCountry": "US"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday", 
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "11:00",
      "closes": "21:00"
    },
    "priceRange": "$$"
  };

  return (
    <Script
      id={`location-schema-${location.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


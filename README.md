# Flora Distro - Luxury Headless WordPress Site

A premium headless WordPress e-commerce site built with Next.js 15, React 19, TypeScript, and Tailwind CSS. Inspired by high-end luxury brand design aesthetics like Prada.

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **React**: v19.1.0
- **TypeScript**: v5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Backend**: WordPress/WooCommerce REST API
- **API Client**: @woocommerce/woocommerce-rest-api

## WordPress API Configuration

The site connects to: `https://api.floradistro.com`

Environment variables are configured in `.env.local`:
- `WORDPRESS_API_URL`
- `WORDPRESS_CONSUMER_KEY`
- `WORDPRESS_CONSUMER_SECRET`

## Project Structure

```
WEBSITE/
├── app/
│   ├── layout.tsx          # Root layout with Header/Footer
│   ├── page.tsx            # Homepage with hero sections & featured products
│   ├── products/
│   │   ├── page.tsx        # Luxury products grid with filters
│   │   └── [id]/
│   │       └── page.tsx    # Detailed product page
│   ├── about/
│   │   └── page.tsx        # Brand story & values
│   └── contact/
│       └── page.tsx        # Contact form & information
├── components/
│   ├── Header.tsx          # Sticky navigation with mobile menu
│   └── Footer.tsx          # Footer with newsletter & social links
└── lib/
    └── wordpress.ts        # WordPress/WooCommerce API client
```

## Design Features

- ✨ **Luxury Brand Aesthetic**: Inspired by Prada's minimal, sophisticated design
- 🎨 **Monochrome Color Scheme**: Clean black, white, and gray palette
- 📱 **Fully Responsive**: Optimized for all devices
- 🖼️ **High-Quality Imagery**: Large product images with hover effects
- ⚡ **Smooth Animations**: Elegant transitions and hover states
- 🔤 **Premium Typography**: Light weights with generous tracking
- 🧭 **Intuitive Navigation**: Sticky header with mobile menu
- 📐 **Spacious Layout**: Generous whitespace for breathing room

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm start` - Start production server on port 3000

## Features

- ✅ Headless WordPress/WooCommerce integration
- ✅ Server-side rendering (SSR)
- ✅ Full product catalog with categories
- ✅ Individual product detail pages
- ✅ Shopping bag & wishlist functionality (UI)
- ✅ Luxury-inspired design system
- ✅ Mobile-first responsive design
- ✅ TypeScript for type safety
- ✅ SEO optimized
- ✅ Performance optimized with Next.js 15

## Development

The dev server is running on: **http://localhost:3000**

Hot-reloading is enabled for instant updates during development.

## Design Inspiration

The design is inspired by luxury fashion houses like [Prada](https://www.prada.com), featuring:
- Minimal, clean aesthetic
- High-end typography
- Sophisticated color palette
- Premium user experience
- Elegant product presentation

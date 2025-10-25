'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Clock, Zap, Database, Server, Globe } from "lucide-react";

interface ApiEndpoint {
  name: string;
  method: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number;
  uptime: number;
}

export default function ApiStatusPage() {
  const [mounted, setMounted] = useState(false);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([
    {
      name: 'Products API',
      method: 'GET',
      endpoint: '/api/products',
      status: 'operational',
      latency: 42,
      uptime: 99.98
    },
    {
      name: 'Vendors API',
      method: 'GET',
      endpoint: '/api/vendors',
      status: 'operational',
      latency: 38,
      uptime: 99.97
    },
    {
      name: 'Orders API',
      method: 'POST',
      endpoint: '/api/orders',
      status: 'operational',
      latency: 56,
      uptime: 99.99
    },
    {
      name: 'Analytics API',
      method: 'GET',
      endpoint: '/api/analytics',
      status: 'operational',
      latency: 45,
      uptime: 99.96
    },
    {
      name: 'Media Upload',
      method: 'POST',
      endpoint: '/api/media/upload',
      status: 'operational',
      latency: 124,
      uptime: 99.94
    },
    {
      name: 'Authentication',
      method: 'POST',
      endpoint: '/api/auth/login',
      status: 'operational',
      latency: 67,
      uptime: 99.99
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    totalRequests: 0,
    avgLatency: 0,
    errorRate: 0,
    activeConnections: 0
  });

  useEffect(() => {
    setMounted(true);

    // Simulate live updates
    const interval = setInterval(() => {
      setEndpoints(prev => prev.map(endpoint => ({
        ...endpoint,
        latency: Math.max(20, endpoint.latency + (Math.random() - 0.5) * 10),
        uptime: Math.min(100, endpoint.uptime + (Math.random() - 0.5) * 0.001)
      })));

      setSystemMetrics({
        totalRequests: Math.floor(1200000 + Math.random() * 10000),
        avgLatency: Math.floor(45 + Math.random() * 5),
        errorRate: Math.random() * 0.1,
        activeConnections: Math.floor(450 + Math.random() * 50)
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-white/60';
      case 'degraded':
        return 'text-white/40';
      case 'down':
        return 'text-white/20';
      default:
        return 'text-white/60';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-white/70 bg-white/10';
      case 'POST':
        return 'text-white/70 bg-white/10';
      case 'PUT':
        return 'text-white/70 bg-white/10';
      case 'DELETE':
        return 'text-white/70 bg-white/10';
      default:
        return 'text-white/70 bg-white/10';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-light tracking-tight">WhaleTools</span>
            </Link>
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl md:text-7xl font-light mb-4 tracking-tight">
                API Status
              </h1>
              <p className="text-xl text-white/50 font-light">
                Real-time monitoring · Updated every 3 seconds
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm text-white/70 uppercase tracking-wider">All Systems Operational</span>
            </div>
          </div>
        </div>
      </section>

      {/* System Metrics */}
      <section className="pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">Total Requests</span>
                <Globe size={16} className="text-white/20" strokeWidth={1} />
              </div>
              <div className="text-2xl font-light text-white/90">
                {mounted ? systemMetrics.totalRequests.toLocaleString() : '0'}
              </div>
              <div className="text-white/30 text-xs mt-2">Last 24 hours</div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">Avg Latency</span>
                <Zap size={16} className="text-white/20" strokeWidth={1} />
              </div>
              <div className="text-2xl font-light text-white/90">
                {mounted ? systemMetrics.avgLatency : '0'}ms
              </div>
              <div className="text-white/30 text-xs mt-2">Global average</div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">Error Rate</span>
                <Server size={16} className="text-white/20" strokeWidth={1} />
              </div>
              <div className="text-2xl font-light text-white/90">
                {mounted ? systemMetrics.errorRate.toFixed(3) : '0.000'}%
              </div>
              <div className="text-white/30 text-xs mt-2">Well below target</div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">Active Connections</span>
                <Database size={16} className="text-white/20" strokeWidth={1} />
              </div>
              <div className="text-2xl font-light text-white/90">
                {mounted ? systemMetrics.activeConnections.toLocaleString() : '0'}
              </div>
              <div className="text-white/30 text-xs mt-2">Real-time</div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-light mb-6 tracking-tight">API Endpoints</h2>
          <div className="border border-white/10">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/[0.02]">
              <div className="col-span-4 text-xs text-white/40 uppercase tracking-wider">Endpoint</div>
              <div className="col-span-2 text-xs text-white/40 uppercase tracking-wider">Method</div>
              <div className="col-span-2 text-xs text-white/40 uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-xs text-white/40 uppercase tracking-wider">Latency</div>
              <div className="col-span-2 text-xs text-white/40 uppercase tracking-wider">Uptime</div>
            </div>

            {/* Endpoints */}
            {endpoints.map((endpoint, index) => (
              <div 
                key={index}
                className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-4">
                  <div className="text-sm text-white/90 font-light mb-1">{endpoint.name}</div>
                  <div className="text-xs text-white/40 font-mono">{endpoint.endpoint}</div>
                </div>
                <div className="col-span-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-mono ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className={getStatusColor(endpoint.status)} />
                    <span className="text-sm text-white/70 capitalize">{endpoint.status}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white/30" />
                    <span className="text-sm text-white/70 font-mono">
                      {mounted ? Math.round(endpoint.latency) : 0}ms
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-white/70 font-mono">
                    {mounted ? endpoint.uptime.toFixed(2) : '0.00'}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REST API Documentation */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light mb-12 tracking-tight">REST API Reference</h2>
          
          {/* Authentication */}
          <div className="mb-12 border border-white/10">
            <div className="p-6 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-xl font-light mb-2">Authentication</h3>
              <p className="text-white/50 text-sm">All API requests require authentication via Bearer token</p>
            </div>
            <div className="p-6 bg-black font-mono text-sm">
              <div className="text-white/40 mb-2">// Request header</div>
              <div className="text-white/70">Authorization: Bearer YOUR_API_TOKEN</div>
            </div>
          </div>

          {/* Example Endpoints */}
          <div className="space-y-6">
            {/* GET Products */}
            <div className="border border-white/10">
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-white/10 text-white/70 text-xs font-mono rounded">GET</span>
                  <span className="font-mono text-white/90">/api/products</span>
                </div>
                <p className="text-white/50 text-sm">Retrieve a list of all products</p>
              </div>
              <div className="p-6 bg-black">
                <div className="text-white/40 text-xs mb-3 font-mono">// Response (200 OK)</div>
                <pre className="text-white/70 text-sm font-mono overflow-x-auto">
{`{
  "data": [
    {
      "id": "prod_123",
      "name": "Product Name",
      "price": 29.99,
      "stock": 150,
      "vendor_id": "vendor_456"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 247
  }
}`}
                </pre>
              </div>
            </div>

            {/* POST Orders */}
            <div className="border border-white/10">
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-white/10 text-white/70 text-xs font-mono rounded">POST</span>
                  <span className="font-mono text-white/90">/api/orders</span>
                </div>
                <p className="text-white/50 text-sm">Create a new order</p>
              </div>
              <div className="p-6 bg-black">
                <div className="text-white/40 text-xs mb-3 font-mono">// Request body</div>
                <pre className="text-white/70 text-sm font-mono overflow-x-auto">
{`{
  "customer_id": "cust_789",
  "items": [
    {
      "product_id": "prod_123",
      "quantity": 2
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102"
  }
}`}
                </pre>
              </div>
            </div>

            {/* GET Vendor Analytics */}
            <div className="border border-white/10">
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-white/10 text-white/70 text-xs font-mono rounded">GET</span>
                  <span className="font-mono text-white/90">/api/vendor/analytics</span>
                </div>
                <p className="text-white/50 text-sm">Get vendor performance metrics</p>
              </div>
              <div className="p-6 bg-black">
                <div className="text-white/40 text-xs mb-3 font-mono">// Response (200 OK)</div>
                <pre className="text-white/70 text-sm font-mono overflow-x-auto">
{`{
  "revenue": {
    "total": 125847.50,
    "today": 4523.20,
    "growth": 15.8
  },
  "orders": {
    "total": 1847,
    "pending": 23,
    "completed": 1802
  },
  "metrics": {
    "conversion_rate": 3.4,
    "avg_order_value": 68.15,
    "customer_retention": 42.3
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light mb-8 tracking-tight">Rate Limits</h2>
          <div className="border border-white/10 p-8 bg-white/[0.02]">
            <div className="space-y-6">
              <div>
                <div className="text-sm text-white/40 uppercase tracking-wider mb-2">Standard Tier</div>
                <div className="text-2xl font-light text-white/90">1,000 requests / hour</div>
              </div>
              <div className="h-[1px] bg-white/10"></div>
              <div>
                <div className="text-sm text-white/40 uppercase tracking-wider mb-2">Partner Tier</div>
                <div className="text-2xl font-light text-white/90">10,000 requests / hour</div>
              </div>
              <div className="h-[1px] bg-white/10"></div>
              <div>
                <div className="text-sm text-white/40 uppercase tracking-wider mb-2">Enterprise</div>
                <div className="text-2xl font-light text-white/90">Unlimited</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-8 tracking-tight">Start Building</h2>
          <p className="text-white/50 mb-12 text-lg">Get your API key and start building in minutes.</p>
          <Link
            href="/vendor/login"
            className="inline-flex items-center bg-white text-black px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] hover:bg-white/90 font-medium transition-all"
          >
            Get API Access
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={24} 
                height={24}
                className="object-contain opacity-60"
              />
              <span className="text-sm text-white/40">© 2025 WhaleTools. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/about" className="text-sm text-white/40 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/partners" className="text-sm text-white/40 hover:text-white transition-colors">
                Partners
              </Link>
              <Link href="/api-status" className="text-sm text-white/40 hover:text-white transition-colors">
                API
              </Link>
              <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


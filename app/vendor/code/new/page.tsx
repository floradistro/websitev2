'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppAuth } from '@/context/AppAuthContext'
import {
  ArrowLeft,
  Store,
  Settings,
  Users,
  Smartphone,
  LayoutDashboard,
  Code2,
  Sparkles,
  Check
} from 'lucide-react'
import Link from 'next/link'

interface AppTemplate {
  type: 'storefront' | 'admin-panel' | 'customer-portal' | 'mobile' | 'dashboard' | 'custom'
  name: string
  description: string
  icon: any
  features: string[]
  gradient: string
  popular?: boolean
}

const TEMPLATES: AppTemplate[] = [
  {
    type: 'storefront',
    name: 'Storefront',
    description: 'Customer-facing online store with products, cart, and checkout',
    icon: Store,
    features: [
      'Product catalog',
      'Shopping cart',
      'Checkout flow',
      'Customer accounts',
      'Order tracking'
    ],
    gradient: 'from-blue-500 to-cyan-500',
    popular: true
  },
  {
    type: 'admin-panel',
    name: 'Admin Panel',
    description: 'Internal management tool for orders, inventory, and analytics',
    icon: Settings,
    features: [
      'Order management',
      'Inventory control',
      'Analytics dashboard',
      'Staff permissions',
      'Real-time updates'
    ],
    gradient: 'from-purple-500 to-pink-500',
    popular: true
  },
  {
    type: 'customer-portal',
    name: 'Customer Portal',
    description: 'Self-service portal for customers to manage orders and account',
    icon: Users,
    features: [
      'Order history',
      'Loyalty points',
      'Reorder favorites',
      'Support tickets',
      'Profile management'
    ],
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    type: 'mobile',
    name: 'Mobile App',
    description: 'iOS/Android app built with React Native',
    icon: Smartphone,
    features: [
      'Mobile shopping',
      'Push notifications',
      'Biometric auth',
      'Camera features',
      'Offline mode'
    ],
    gradient: 'from-orange-500 to-red-500'
  },
  {
    type: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Data visualization and reporting tool',
    icon: LayoutDashboard,
    features: [
      'Sales charts',
      'KPI tracking',
      'Custom reports',
      'Data export',
      'Real-time metrics'
    ],
    gradient: 'from-indigo-500 to-violet-500'
  },
  {
    type: 'custom',
    name: 'Custom App',
    description: 'Start from scratch and build anything you need',
    icon: Code2,
    features: [
      'Full flexibility',
      'AI assistance',
      'Any framework',
      'Custom features',
      'Your vision'
    ],
    gradient: 'from-teal-500 to-cyan-500'
  }
]

export default function NewAppPage() {
  const router = useRouter()
  const { vendor } = useAppAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [appName, setAppName] = useState('')
  const [appDescription, setAppDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function createApp() {
    if (!appName || !selectedTemplate || !vendor?.id) return

    setCreating(true)

    try {
      const response = await fetch('/api/vendor/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          name: appName,
          description: appDescription,
          app_type: selectedTemplate
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to editor
        router.push(`/vendor/code/${data.app.id}`)
      } else {
        alert('Failed to create app: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating app:', error)
      alert('Failed to create app')
    } finally {
      setCreating(false)
    }
  }

  const selectedTemplateData = TEMPLATES.find(t => t.type === selectedTemplate)

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-8">
          <Link
            href="/vendor/code"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Apps
          </Link>

          <h1 className="text-4xl font-black text-white tracking-tight mb-2" style={{ fontWeight: 900 }}>
            Create New App
          </h1>
          <p className="text-white/60 text-sm">
            Choose a template to get started, then customize with AI
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Templates Selection */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-black text-white mb-6 tracking-tight" style={{ fontWeight: 900 }}>
              Select Template
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {TEMPLATES.map(template => {
                const Icon = template.icon
                const isSelected = selectedTemplate === template.type

                return (
                  <button
                    key={template.type}
                    onClick={() => setSelectedTemplate(template.type)}
                    className={`relative group text-left bg-white/5 border ${
                      isSelected ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-white/20'
                    } rounded-2xl p-6 transition-all duration-300 overflow-hidden`}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 ${
                      isSelected ? 'opacity-10' : 'group-hover:opacity-10'
                    } transition-opacity duration-300`} />

                    {/* Popular Badge */}
                    {template.popular && (
                      <div className="absolute top-4 right-4 px-2.5 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-yellow-400">
                          Popular
                        </span>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 left-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 mt-8">
                      <div className={`w-12 h-12 bg-gradient-to-br ${template.gradient} bg-opacity-20 border border-white/10 rounded-xl flex items-center justify-center mb-4`}>
                        <Icon size={24} className="text-white" strokeWidth={1.5} />
                      </div>

                      <h3 className="text-white font-black text-lg mb-2 uppercase tracking-tight" style={{ fontWeight: 900 }}>
                        {template.name}
                      </h3>

                      <p className="text-white/60 text-sm leading-relaxed mb-4">
                        {template.description}
                      </p>

                      <div className="space-y-1.5">
                        {template.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-white/40">
                            <div className="w-1 h-1 bg-white/40 rounded-full" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* App Details Form */}
          <div>
            <div className="sticky top-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={20} className="text-emerald-400" />
                  <h2 className="text-lg font-black text-white tracking-tight" style={{ fontWeight: 900 }}>
                    App Details
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      App Name *
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="My Awesome App"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={appDescription}
                      onChange={(e) => setAppDescription(e.target.value)}
                      placeholder="What does this app do?"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Selected Template Summary */}
                {selectedTemplateData && (
                  <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <selectedTemplateData.icon size={20} className="text-white/60" />
                      <span className="text-sm font-bold text-white">
                        {selectedTemplateData.name}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      {selectedTemplateData.description}
                    </p>
                  </div>
                )}

                <button
                  onClick={createApp}
                  disabled={!appName || !selectedTemplate || creating}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
                >
                  {creating ? 'Creating...' : 'Create App'}
                </button>

                <p className="text-xs text-white/40 text-center mt-4">
                  You'll be able to customize everything with AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

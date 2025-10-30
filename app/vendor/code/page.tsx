'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/context/AppAuthContext'
import {
  Plus,
  Code2,
  Smartphone,
  LayoutDashboard,
  Store,
  Users,
  Settings,
  ExternalLink,
  Edit,
  Trash2,
  Globe
} from 'lucide-react'

interface VendorApp {
  id: string
  name: string
  slug: string
  app_type: 'storefront' | 'admin-panel' | 'customer-portal' | 'mobile' | 'dashboard' | 'custom'
  description: string
  deployment_url: string | null
  status: 'draft' | 'building' | 'deployed' | 'archived'
  created_at: string
  updated_at: string
}

const APP_TYPE_CONFIG = {
  storefront: {
    name: 'Storefront',
    icon: Store,
    color: 'from-blue-500 to-cyan-500'
  },
  'admin-panel': {
    name: 'Admin Panel',
    icon: Settings,
    color: 'from-purple-500 to-pink-500'
  },
  'customer-portal': {
    name: 'Customer Portal',
    icon: Users,
    color: 'from-green-500 to-emerald-500'
  },
  mobile: {
    name: 'Mobile App',
    icon: Smartphone,
    color: 'from-orange-500 to-red-500'
  },
  dashboard: {
    name: 'Dashboard',
    icon: LayoutDashboard,
    color: 'from-indigo-500 to-violet-500'
  },
  custom: {
    name: 'Custom App',
    icon: Code2,
    color: 'from-teal-500 to-cyan-500'
  }
}

export default function CodePlatformPage() {
  const { vendor } = useAppAuth()
  const [apps, setApps] = useState<VendorApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vendor?.id) return

    loadApps()
  }, [vendor?.id])

  async function loadApps() {
    try {
      const response = await fetch(`/api/vendor/apps?vendorId=${vendor?.id}`)
      const data = await response.json()

      if (data.success) {
        setApps(data.apps || [])
      }
    } catch (error) {
      console.error('Error loading apps:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteApp(appId: string) {
    if (!confirm('Are you sure you want to delete this app?')) return

    try {
      const response = await fetch(`/api/vendor/apps/${appId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApps(apps.filter(app => app.id !== appId))
      }
    } catch (error) {
      console.error('Error deleting app:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                  <Code2 size={28} className="text-emerald-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontWeight: 900 }}>
                    Code Platform
                  </h1>
                  <p className="text-white/60 text-sm mt-1">
                    Build custom apps with AI assistance
                  </p>
                </div>
              </div>
              <p className="text-white/40 text-sm max-w-2xl">
                Create storefronts, admin panels, customer portals, mobile apps, and more—all connected to your backend data.
                Use AI to build and customize without writing code.
              </p>
            </div>

            <Link
              href="/vendor/code/new"
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-2xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={20} strokeWidth={2.5} />
              Create New App
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-12">
        {apps.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6">
              <Code2 size={40} className="text-white/40" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontWeight: 900 }}>
              No Apps Yet
            </h2>
            <p className="text-white/60 text-sm text-center max-w-md mb-8">
              Get started by creating your first app. Choose from templates or build something custom.
            </p>
            <Link
              href="/vendor/code/new"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium text-white transition-all"
            >
              <Plus size={18} />
              Create Your First App
            </Link>
          </div>
        ) : (
          /* Apps Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map(app => {
              const config = APP_TYPE_CONFIG[app.app_type]
              const Icon = config.icon

              return (
                <div
                  key={app.id}
                  className="group relative bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${config.color} bg-opacity-20 border border-white/10 rounded-xl flex items-center justify-center`}>
                        <Icon size={24} className="text-white" strokeWidth={1.5} />
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold ${
                        app.status === 'deployed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        app.status === 'building' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-white/10 text-white/60 border border-white/20'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* App Info */}
                    <h3 className="text-white font-black text-lg mb-1 uppercase tracking-tight" style={{ fontWeight: 900 }}>
                      {app.name}
                    </h3>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
                      {config.name}
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      {app.description || 'No description'}
                    </p>

                    {/* Deployment URL */}
                    {app.deployment_url && (
                      <div className="flex items-center gap-2 mb-4 p-2 bg-white/5 border border-white/10 rounded-lg">
                        <Globe size={14} className="text-white/40" />
                        <a
                          href={app.deployment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/60 hover:text-white truncate flex-1"
                        >
                          {app.deployment_url.replace('https://', '')}
                        </a>
                        <ExternalLink size={14} className="text-white/40" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <Link
                        href={`/vendor/code/${app.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium text-white transition-all"
                      >
                        <Edit size={16} />
                        Edit Code
                      </Link>

                      <button
                        onClick={() => deleteApp(app.id)}
                        className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Updated Date */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">
                        Updated {new Date(app.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

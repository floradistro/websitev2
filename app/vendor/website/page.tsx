'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Github, Code2, Globe } from 'lucide-react';
import { ds, cn } from '@/components/ds';
import { Button } from '@/components/ui/Button';
import axios from 'axios';

interface WebsiteStatus {
  hasGithub: boolean;
  githubUsername?: string;
  hasRepo: boolean;
  repoName?: string;
  repoUrl?: string;
}

export default function VendorWebsitePage() {
  const [status, setStatus] = useState<WebsiteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get('/api/vendor/website/status', {
        withCredentials: true,
      });
      setStatus(data);
    } catch (error) {
      console.error('Error fetching website status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGithub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const vendorId = localStorage.getItem('vendorId'); // Or get from session
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${vendorId}&scope=repo`;

    window.location.href = githubAuthUrl;
  };

  const createWebsite = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post('/api/vendor/website/create', {}, {
        withCredentials: true,
      });
      await fetchStatus();
      alert('Website repository created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create website');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-8", ds.colors.bg.primary)}>
      <div className="max-w-4xl mx-auto">
        <h1 className={cn("text-3xl font-bold mb-2", ds.colors.text.primary)}>
          Your Website
        </h1>
        <p className={cn("mb-8", ds.colors.text.secondary)}>
          Manage your storefront repository and deployments
        </p>

        {/* GitHub Connection Status */}
        <div className={cn("rounded-2xl p-6 mb-6", ds.components.card)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={cn("text-xl font-semibold mb-2", ds.colors.text.primary)}>
                <Github className="inline mr-2" size={24} />
                GitHub Connection
              </h2>
              {status?.hasGithub ? (
                <p className={cn(ds.colors.text.secondary)}>
                  Connected as <span className="text-green-400">@{status.githubUsername}</span>
                </p>
              ) : (
                <p className={cn(ds.colors.text.secondary)}>
                  Connect your GitHub account to create and manage your website
                </p>
              )}
            </div>
            {!status?.hasGithub && (
              <Button onClick={connectGithub}>
                Connect GitHub
              </Button>
            )}
          </div>
        </div>

        {/* Website Repository */}
        {status?.hasGithub && (
          <div className={cn("rounded-2xl p-6", ds.components.card)}>
            {status.hasRepo ? (
              <div>
                <h2 className={cn("text-xl font-semibold mb-4", ds.colors.text.primary)}>
                  <Globe className="inline mr-2" size={24} />
                  Your Website Repository
                </h2>

                <div className={cn("rounded-xl p-4 mb-4", ds.colors.bg.elevated)}>
                  <p className={cn("text-sm mb-2", ds.colors.text.quaternary)}>Repository</p>
                  <a
                    href={status.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("text-lg hover:underline flex items-center gap-2", ds.colors.text.primary)}
                  >
                    {status.repoName}
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href={`vscode://vscode.git/clone?url=${status.repoUrl}.git`}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-colors",
                      "hover:border-white/30",
                      ds.colors.bg.elevated,
                      ds.colors.border.default
                    )}
                  >
                    <Code2 size={24} />
                    <div>
                      <p className={cn("font-medium", ds.colors.text.primary)}>Open in VS Code</p>
                      <p className={cn("text-xs", ds.colors.text.quaternary)}>Clone and edit locally</p>
                    </div>
                  </a>

                  <a
                    href={`cursor://clone?url=${status.repoUrl}.git`}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-colors",
                      "hover:border-white/30",
                      ds.colors.bg.elevated,
                      ds.colors.border.default
                    )}
                  >
                    <Code2 size={24} />
                    <div>
                      <p className={cn("font-medium", ds.colors.text.primary)}>Open in Cursor</p>
                      <p className={cn("text-xs", ds.colors.text.quaternary)}>AI-powered coding</p>
                    </div>
                  </a>

                  <a
                    href={status.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-colors",
                      "hover:border-white/30",
                      ds.colors.bg.elevated,
                      ds.colors.border.default
                    )}
                  >
                    <Github size={24} />
                    <div>
                      <p className={cn("font-medium", ds.colors.text.primary)}>View on GitHub</p>
                      <p className={cn("text-xs", ds.colors.text.quaternary)}>Browse files online</p>
                    </div>
                  </a>

                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-colors",
                      "hover:border-white/30",
                      ds.colors.bg.elevated,
                      ds.colors.border.default
                    )}
                  >
                    <Globe size={24} />
                    <div>
                      <p className={cn("font-medium", ds.colors.text.primary)}>Deploy to Vercel</p>
                      <p className={cn("text-xs", ds.colors.text.quaternary)}>One-click deployment</p>
                    </div>
                  </a>
                </div>

                <div className={cn("mt-6 p-4 rounded-xl", ds.colors.bg.elevated)}>
                  <h3 className={cn("font-semibold mb-2", ds.colors.text.secondary)}>Next Steps</h3>
                  <ol className={cn("list-decimal list-inside space-y-2 text-sm", ds.colors.text.quaternary)}>
                    <li>Clone your repository using one of the buttons above</li>
                    <li>Customize your storefront using your favorite code editor</li>
                    <li>Push changes to GitHub</li>
                    <li>Deploy to Vercel for free hosting</li>
                    <li>Your products will automatically sync from this dashboard</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <h2 className={cn("text-2xl font-semibold mb-4", ds.colors.text.primary)}>
                  Create Your Website
                </h2>
                <p className={cn("mb-6", ds.colors.text.secondary)}>
                  We'll create a Next.js storefront in your GitHub account
                </p>
                <Button
                  onClick={createWebsite}
                  disabled={creating}
                  size="lg"
                >
                  {creating ? 'Creating...' : 'Create Website Repository'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Vendor Website Deployment Dashboard
 * Steve Jobs style - clean, simple, powerful
 */

'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Github, Code2, Globe, Rocket, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ds, cn } from '@/components/ds';
import { Button } from '@/components/ui/Button';
import axios from 'axios';

interface WebsiteStatus {
  hasGithub: boolean;
  githubUsername?: string;
  hasRepo: boolean;
  repoName?: string;
  repoUrl?: string;
  deploymentStatus?: string;
  deploymentUrl?: string;
  lastDeploymentAt?: string;
  vercelProjectId?: string;
}

interface Deployment {
  id: string;
  status: string;
  deployment_url: string;
  vercel_deployment_id: string;
  commit_sha?: string;
  commit_message?: string;
  started_at: string;
  completed_at?: string;
}

export default function VendorWebsitePage() {
  const [status, setStatus] = useState<WebsiteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [recentDeployments, setRecentDeployments] = useState<Deployment[]>([]);
  const [currentDeployment, setCurrentDeployment] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchStatus();
    fetchDeployments();

    // Check for success/error params in URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'github_connected') {
      console.log('✅ GitHub connected successfully!');
      // Refetch status to show updated connection
      setTimeout(() => fetchStatus(), 500);
    } else if (error) {
      console.error('❌ GitHub connection error:', error);
      alert(`GitHub connection failed: ${error}`);
    }
  }, []);

  // Poll for deployment status if one is in progress
  useEffect(() => {
    const hasActiveDeployment = recentDeployments.some(
      d => d.status === 'BUILDING' || d.status === 'QUEUED'
    );

    if (hasActiveDeployment) {
      const interval = setInterval(() => {
        console.log('🔄 Polling Vercel for deployment updates...');
        fetchDeployments();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [recentDeployments]);

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get('/api/vendor/website/status', {
        withCredentials: true,
      });
      setStatus(data);
    } catch (error: any) {
      console.error('Error fetching website status:', error);
      console.error('Status code:', error.response?.status);
      console.error('Error data:', error.response?.data);

      // If unauthorized, user needs to log in first
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication required - please log in first');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async () => {
    try {
      // Fetch actual Vercel deployments
      const { data } = await axios.get('/api/vendor/website/vercel-deployments', {
        withCredentials: true,
      });
      if (data.success) {
        const vercelDeployments = data.deployments || [];
        // Map Vercel format to our format
        const mapped = vercelDeployments.map((d: any) => ({
          id: d.uid,
          status: d.state,
          deployment_url: `https://${d.url}`,
          vercel_deployment_id: d.uid,
          commit_sha: d.meta?.githubCommitSha,
          commit_message: d.meta?.githubCommitMessage,
          started_at: new Date(d.created).toISOString(),
          completed_at: d.ready ? new Date(d.ready).toISOString() : null,
        }));
        setRecentDeployments(mapped);

        // Check if any are building
        const building = vercelDeployments.find((d: any) => d.state === 'BUILDING' || d.state === 'QUEUED');
        if (building) {
          setStatus(prev => prev ? { ...prev, deploymentStatus: building.state.toLowerCase() } : null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching deployments:', error);
    }
  };

  const fetchDeploymentStatus = async (deploymentId: string) => {
    try {
      const { data } = await axios.get(`/api/vendor/website/deploy?deploymentId=${deploymentId}`, {
        withCredentials: true,
      });

      if (data.success) {
        setCurrentDeployment(data);
        setLogs(data.logs || []);

        // Refresh if deployment completed
        if (data.status === 'READY' || data.status === 'ERROR') {
          fetchStatus();
          fetchDeployments();
        }
      }
    } catch (error: any) {
      console.error('Error fetching deployment status:', error);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);

    try {
      const { data } = await axios.post('/api/vendor/website/sync-and-deploy', {}, {
        withCredentials: true,
      });

      if (data.success) {
        alert(data.message + '\n\nView live deployment logs at:\n' + data.vercelUrl);

        // Refresh deployments to show latest
        setTimeout(() => fetchDeployments(), 2000);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error syncing:', error);
      alert(`Sync failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setDeploying(false);
    }
  };

  const connectGithub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

    // Get vendor ID from localStorage (set during login)
    // Try multiple sources: app_user (vendor login), flora-user (customer login), or direct vendor_id key
    let vendorId = null;

    // Try app_user first (vendor dashboard login)
    const appUserStr = localStorage.getItem('app_user');
    if (appUserStr) {
      try {
        const appUser = JSON.parse(appUserStr);
        vendorId = appUser.vendor_id;
      } catch (e) {
        console.error('Failed to parse app_user:', e);
      }
    }

    // Fallback to flora-user (customer login)
    if (!vendorId) {
      const floraUserStr = localStorage.getItem('flora-user');
      if (floraUserStr) {
        try {
          const floraUser = JSON.parse(floraUserStr);
          vendorId = floraUser.vendor_id || floraUser.vendorId;
        } catch (e) {
          console.error('Failed to parse flora-user:', e);
        }
      }
    }

    // Fallback to direct vendor_id key
    if (!vendorId) {
      vendorId = localStorage.getItem('vendor_id');
    }

    if (!vendorId) {
      alert('Please log in first to connect GitHub');
      return;
    }

    // Use environment variable or default to localhost for development
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/github/callback`
      : 'http://localhost:3000/api/auth/github/callback';

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${vendorId}&scope=repo`;

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

  const pushTemplate = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post('/api/vendor/website/push-template', {}, {
        withCredentials: true,
      });
      alert(`Template pushed successfully! ${data.filesCount} files committed to your repository.`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to push template');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return cn('text-white/90', ds.colors.bg.elevated, 'border border-white/10');
      case 'building':
      case 'queued':
        return cn('text-white/70', ds.colors.bg.elevated, 'border border-white/5');
      case 'error':
      case 'canceled':
        return cn('text-red-400/90', ds.colors.bg.elevated, 'border border-red-500/20');
      default:
        return cn('text-white/50', ds.colors.bg.elevated, 'border border-white/5');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'building':
      case 'queued':
        return (
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-white/90 animate-spin" />
          </div>
        );
      case 'error':
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

        {/* Deployment Status */}
        {status?.hasGithub && status.hasRepo && (
          <div className={cn("rounded-2xl p-6 mb-6", ds.components.card)}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn("text-xl font-semibold", ds.colors.text.primary)}>
                <Rocket className="inline mr-2" size={24} />
                Deployment
              </h2>

              <Button
                onClick={handleDeploy}
                disabled={deploying || status?.deploymentStatus === 'building'}
                size="sm"
              >
                {deploying || status?.deploymentStatus === 'building' ? 'Deploying...' : 'Deploy Now'}
              </Button>
            </div>

            {status?.deploymentStatus && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2',
                      getStatusColor(status.deploymentStatus)
                    )}
                  >
                    {getStatusIcon(status.deploymentStatus)}
                    {status.deploymentStatus.toUpperCase()}
                  </span>

                  {status.lastDeploymentAt && (
                    <span className={cn("text-sm", ds.colors.text.quaternary)}>
                      Last deployed {new Date(status.lastDeploymentAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {status.deploymentUrl && status.deploymentStatus === 'ready' && (
                  <div>
                    <p className={cn("text-sm mb-2", ds.colors.text.tertiary)}>Live URL</p>
                    <a
                      href={status.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("text-blue-400 hover:underline flex items-center gap-2", ds.colors.text.primary)}
                    >
                      {status.deploymentUrl}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Build Logs */}
                {status?.deploymentStatus === 'building' && logs.length > 0 && (
                  <div>
                    <p className={cn("text-sm font-medium mb-2", ds.colors.text.tertiary)}>Build Logs</p>
                    <div className={cn("rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto", ds.colors.bg.elevated)}>
                      {logs.map((log) => (
                        <div key={log.id} className="mb-1">
                          <span className={cn(ds.colors.text.quaternary)}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>{' '}
                          <span className={cn(ds.colors.text.tertiary)}>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Deployment History */}
        {status?.hasGithub && status.hasRepo && recentDeployments.length > 0 && (
          <div className={cn("rounded-2xl p-6 mb-6", ds.components.card)}>
            <h2 className={cn("text-xl font-semibold mb-4", ds.colors.text.primary)}>
              Deployment History
            </h2>

            <div className="space-y-3">
              {recentDeployments.slice(0, 10).map((deployment) => (
                <div
                  key={deployment.id}
                  className={cn("flex items-center justify-between py-3 border-b last:border-0", ds.colors.border.default)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1',
                          getStatusColor(deployment.status)
                        )}
                      >
                        {getStatusIcon(deployment.status)} {deployment.status}
                      </span>

                      {deployment.commit_message && (
                        <span className={cn("text-sm truncate max-w-md", ds.colors.text.tertiary)}>
                          {deployment.commit_message}
                        </span>
                      )}
                    </div>

                    <div className={cn("flex items-center space-x-4 text-xs", ds.colors.text.quaternary)}>
                      {deployment.commit_sha && (
                        <span className="font-mono">{deployment.commit_sha.substring(0, 7)}</span>
                      )}
                      <span>{new Date(deployment.started_at).toLocaleString()}</span>
                      {deployment.completed_at && (
                        <span>
                          Duration:{' '}
                          {Math.round(
                            (new Date(deployment.completed_at).getTime() -
                              new Date(deployment.started_at).getTime()) /
                              1000
                          )}
                          s
                        </span>
                      )}
                    </div>
                  </div>

                  {deployment.deployment_url && deployment.status === 'ready' && (
                    <a
                      href={deployment.deployment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("text-sm text-blue-400 hover:underline ml-4", ds.colors.text.primary)}
                    >
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={cn("font-semibold", ds.colors.text.secondary)}>Storefront Template</h3>
                    <Button
                      onClick={pushTemplate}
                      disabled={creating}
                      size="sm"
                    >
                      {creating ? 'Pushing...' : 'Push Template to Repo'}
                    </Button>
                  </div>
                  <p className={cn("text-sm mb-4", ds.colors.text.quaternary)}>
                    Push the WhaleTools storefront template to your repository. This includes a fully working Next.js storefront with your branding.
                  </p>
                </div>

                <div className={cn("mt-6 p-4 rounded-xl", ds.colors.bg.elevated)}>
                  <h3 className={cn("font-semibold mb-2", ds.colors.text.secondary)}>Next Steps</h3>
                  <ol className={cn("list-decimal list-inside space-y-2 text-sm", ds.colors.text.quaternary)}>
                    <li>Click "Push Template to Repo" to add storefront files</li>
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

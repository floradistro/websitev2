'use client';

import { useState, useEffect } from 'react';
import { Globe, Check, Clock, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ds, cn } from '@/components/ds';
import axios from 'axios';

interface DomainSetupProps {
  onDomainVerified?: () => void;
}

export function DomainSetup({ onDomainVerified }: DomainSetupProps) {
  const [domain, setDomain] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // Auto-verify every 5 seconds when DNS records are shown
  useEffect(() => {
    if (!dnsRecords || verified) return;

    const interval = setInterval(async () => {
      console.log('🔄 Auto-verifying domain...');
      await checkDomainVerification(domain, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [dnsRecords, verified, domain]);

  const handleSetupDomain = async () => {
    if (!domain) {
      alert('Please enter your domain');
      return;
    }

    setSettingUp(true);

    try {
      const { data } = await axios.post('/api/vendor/website/setup-domain', {
        domain,
      }, {
        withCredentials: true,
      });

      setDnsRecords(data);
      setSetupComplete(true);
    } catch (error: any) {
      console.error('Error setting up domain:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to setup domain: ${errorMsg}`);
    } finally {
      setSettingUp(false);
    }
  };

  const checkDomainVerification = async (domainToCheck: string, silent = false) => {
    if (!silent) setVerifying(true);

    try {
      const { data } = await axios.post('/api/vendor/website/verify-domain', {
        domain: domainToCheck,
      }, {
        withCredentials: true,
      });

      if (data.verified) {
        setVerified(true);
        setVerificationStatus(data);

        if (!silent) {
          alert(data.message);
        }

        if (onDomainVerified) {
          onDomainVerified();
        }
      } else {
        setVerificationStatus(data);

        if (!silent) {
          alert('DNS records not fully configured yet. Please wait 1-5 minutes after adding records.');
        }
      }
    } catch (error: any) {
      console.error('Error verifying domain:', error);

      if (!silent) {
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
        alert(`Verification failed: ${errorMsg}`);
      }
    } finally {
      if (!silent) setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (verified) {
    return (
      <div className={cn(
        'rounded-xl border-2 border-green-500 p-8',
        'bg-green-50 dark:bg-green-900/10'
      )}>
        <div className="flex items-center gap-3 mb-4">
          <Check className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
              Domain Verified! 🎉
            </h3>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Your site is live at <strong>{domain}</strong>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-green-600 text-white hover:bg-green-700',
              'transition-colors'
            )}
          >
            Visit Your Site
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div className={cn(
        'rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8',
        'bg-white dark:bg-gray-800'
      )}>
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-xl font-semibold">
              Add Custom Domain
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Use your own domain for your storefront
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
              placeholder="floradistro.com"
              className={cn(
                'w-full px-4 py-3 rounded-lg border-2',
                'border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-900',
                'focus:border-blue-500 focus:outline-none',
                'transition-colors'
              )}
            />
            <p className="text-sm text-gray-500 mt-2">
              Enter your domain without "https://" or "www"
            </p>
          </div>

          <Button
            onClick={handleSetupDomain}
            disabled={!domain || settingUp}
            className="w-full"
          >
            {settingUp ? 'Setting up...' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  }

  // Show DNS instructions
  return (
    <div className={cn(
      'rounded-xl border-2 border-blue-500 p-8',
      'bg-blue-50 dark:bg-blue-900/10'
    )}>
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
        <div>
          <h3 className="text-xl font-semibold">
            Add DNS Records
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            We'll auto-verify every 5 seconds
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-3">Quick Setup:</h4>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li>Go to your domain registrar (GoDaddy, Namecheap, etc.)</li>
          <li>Find DNS settings for <strong>{domain}</strong></li>
          <li>Add the 3 records below</li>
          <li>Wait here - we'll verify automatically!</li>
        </ol>
      </div>

      {/* DNS Records */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">DNS Records to Add:</h4>

        {/* Verification TXT Record */}
        <DNSRecord
          type="TXT"
          name="_whale-verify"
          value={dnsRecords?.verificationRecord?.value}
          ttl={3600}
          description="Proves you own this domain"
          onCopy={copyToClipboard}
          status={verificationStatus?.checks?.txtRecord}
        />

        {/* A Record */}
        <DNSRecord
          type="A"
          name="@"
          value="76.76.21.21"
          ttl={3600}
          description="Points your domain to Vercel"
          onCopy={copyToClipboard}
          status={verificationStatus?.checks?.aRecord}
        />

        {/* CNAME Record */}
        <DNSRecord
          type="CNAME"
          name="www"
          value="cname.vercel-dns.com"
          ttl={3600}
          description="Points www subdomain to Vercel"
          onCopy={copyToClipboard}
          status={verificationStatus?.checks?.cnameRecord}
        />
      </div>

      {/* Registrar Guides */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">Need Help?</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Find your registrar's DNS guide:
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(dnsRecords?.guides || {}).map(([name, url]) => (
            <a
              key={name}
              href={url as string}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'px-3 py-1 rounded-full text-sm',
                'bg-white dark:bg-gray-700',
                'hover:bg-gray-50 dark:hover:bg-gray-600',
                'border border-gray-200 dark:border-gray-600',
                'capitalize transition-colors',
                'inline-flex items-center gap-1'
              )}
            >
              {name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Manual Verify Button */}
      <div className="mt-6">
        <Button
          onClick={() => checkDomainVerification(domain)}
          disabled={verifying}
          variant="secondary"
          className="w-full"
        >
          {verifying ? 'Verifying...' : 'Verify Now'}
        </Button>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Or wait - we're checking automatically every 5 seconds
        </p>
      </div>

      {/* Verification Status */}
      {verificationStatus && !verificationStatus.verified && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Still configuring...
              </p>
              <ul className="space-y-1 text-yellow-800 dark:text-yellow-200">
                {Object.entries(verificationStatus.missing || {})
                  .filter(([, message]) => message)
                  .map(([key, message]) => (
                    <li key={key}>• {message as string}</li>
                  ))}
              </ul>
              <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                DNS changes can take 1-5 minutes to propagate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DNSRecordProps {
  type: string;
  name: string;
  value: string;
  ttl: number;
  description: string;
  onCopy: (text: string) => void;
  status?: boolean;
}

function DNSRecord({ type, name, value, ttl, description, onCopy, status }: DNSRecordProps) {
  return (
    <div className={cn(
      'p-4 rounded-lg border-2',
      status === true
        ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
        : status === false
        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'px-2 py-0.5 rounded text-xs font-mono font-bold',
              'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
            )}>
              {type}
            </span>
            {status !== undefined && (
              <span className={cn(
                'text-xs font-semibold',
                status ? 'text-green-600' : 'text-red-600'
              )}>
                {status ? '✓ Configured' : '✗ Not Found'}
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-16">Name:</span>
              <span className="font-mono font-semibold">{name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-16">Value:</span>
              <span className="font-mono text-xs break-all">{value}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-16">TTL:</span>
              <span className="font-mono">{ttl}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {description}
          </p>
        </div>

        <Button
          onClick={() => onCopy(value)}
          variant="secondary"
          size="sm"
          className="flex-shrink-0"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

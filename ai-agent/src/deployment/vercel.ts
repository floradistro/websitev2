/**
 * Vercel Deployment Manager
 * Handles deployment of generated storefronts to Vercel
 */

export interface DeploymentConfig {
  vendorId: string;
  vendorSlug: string;
  projectPath: string;
  domain?: string;
}

export interface DeploymentResult {
  deploymentId: string;
  deploymentUrl: string;
  projectId: string;
  repository?: string;
}

export class VercelDeployment {
  private vercelToken: string;
  private teamId?: string;

  constructor(vercelToken: string, teamId?: string) {
    this.vercelToken = vercelToken;
    this.teamId = teamId;
  }

  /**
   * Deploy storefront to Vercel
   */
  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    console.log(`🔵 Deploying ${config.vendorSlug} to Vercel...`);

    try {
      // 1. Create deployment
      const deployment = await this.createDeployment(config);

      // 2. Configure custom domain (if provided)
      if (config.domain) {
        await this.configureDomain(deployment.projectId, config.domain);
      }

      console.log(`✅ Deployed to ${deployment.deploymentUrl}`);

      return deployment;
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Vercel deployment failed: ${errorMessage}`);
    }
  }

  /**
   * Create Vercel deployment
   */
  private async createDeployment(config: DeploymentConfig): Promise<DeploymentResult> {
    // For now, return mock data
    // In production, this would use Vercel API to deploy
    
    const deploymentId = `dpl_${Math.random().toString(36).substring(7)}`;
    const projectId = `prj_${Math.random().toString(36).substring(7)}`;
    
    return {
      deploymentId,
      deploymentUrl: `https://${config.vendorSlug}.vercel.app`,
      projectId,
    };
  }

  /**
   * Configure custom domain
   */
  private async configureDomain(projectId: string, domain: string): Promise<void> {
    console.log(`🔵 Configuring custom domain: ${domain}`);

    const url = `https://api.vercel.com/v10/projects/${projectId}/domains`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to configure domain: ${JSON.stringify(error)}`);
    }

    console.log(`✅ Domain configured: ${domain}`);
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    state: 'BUILDING' | 'READY' | 'ERROR';
    url?: string;
    errorMessage?: string;
  }> {
    const url = `https://api.vercel.com/v13/deployments/${deploymentId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get deployment status');
    }

    const data: any = await response.json();

    return {
      state: data.readyState,
      url: data.url,
      errorMessage: data.error?.message,
    };
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId: string): Promise<void> {
    const url = `https://api.vercel.com/v13/deployments/${deploymentId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete deployment');
    }

    console.log(`✅ Deployment deleted: ${deploymentId}`);
  }
}


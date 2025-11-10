import { logger } from "@/lib/logger";

export interface CreateProjectOptions {
  name: string;
  gitRepo: string; // e.g., "yourorg/repo-name"
  environmentVariables?: Record<string, string>;
  framework?: "nextjs" | "react" | "vue" | "angular";
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: "BUILDING" | "ERROR" | "READY" | "QUEUED" | "CANCELED";
  created: number;
  ready?: number;
  creator: {
    username: string;
  };
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
}

export async function createVercelProject(options: CreateProjectOptions) {
  const { name, gitRepo, environmentVariables = {}, framework = "nextjs" } = options;

  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch("https://api.vercel.com/v9/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        gitRepository: {
          type: "github",
          repo: gitRepo,
        },
        framework,
        environmentVariables: Object.entries(environmentVariables).map(([key, value]) => ({
          key,
          value,
          type: "plain",
          target: ["production", "preview", "development"],
        })),
        buildCommand: "npm run build",
        outputDirectory: ".next",
        installCommand: "npm install",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const project = await response.json();

    // Wait a moment for initial deployment to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get deployment URL
    const deploymentUrl = `https://${project.name}.vercel.app`;

    return {
      projectId: project.id,
      projectName: project.name,
      deploymentUrl,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error creating Vercel project:", error);
    }
    throw new Error(`Failed to create Vercel project: ${error.message}`);
  }
}

export async function triggerDeployment(projectId: string) {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectId,
        target: "production",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const deployment = await response.json();

    return deployment;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error triggering deployment:", error);
    }
    throw new Error(`Failed to trigger deployment: ${error.message}`);
  }
}

export async function getDeploymentStatus(deploymentId: string) {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const deployment = await response.json();
    return deployment;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error getting deployment status:", error);
    }
    throw new Error(`Failed to get deployment status: ${error.message}`);
  }
}

/**
 * Get build logs for a deployment (Steve Jobs style - clean, readable)
 */
export async function getDeploymentLogs(deploymentId: string) {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.vercel.com/v2/deployments/${deploymentId}/events`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const data = await response.json();

    // Clean up and format logs for display
    return data
      .filter(
        (log: any) => log.type === "stdout" || log.type === "stderr" || log.type === "command",
      )
      .map((log: any) => ({
        id: log.id || `${Date.now()}-${Math.random()}`,
        message: log.payload?.text || log.text || "",
        timestamp: log.created || Date.now(),
        type: log.type,
      }));
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error getting deployment logs:", error);
    }
    // Return empty array instead of throwing - logs are nice-to-have
    return [];
  }
}

/**
 * Add custom domain to Vercel project
 */
export async function addCustomDomain(projectId: string, domain: string) {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const domainData = await response.json();

    return domainData;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error adding custom domain:", error);
    }
    throw new Error(`Failed to add custom domain: ${error.message}`);
  }
}

/**
 * Get recent deployments for a project
 */
export async function getRecentDeployments(projectId: string, limit: number = 10) {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const data = await response.json();
    return data.deployments || [];
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error getting deployments:", error);
    }
    throw new Error(`Failed to get deployments: ${error.message}`);
  }
}

/**
 * Remove a domain from a Vercel project
 */
export async function removeDomainFromProject(projectId: string, domain: string) {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      // Don't throw if domain doesn't exist - that's what we want anyway
      if (!error.includes("not found") && !error.includes("does not exist")) {
        throw new Error(`Vercel API error: ${error}`);
      }
    }

    return true;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error removing domain:", error);
    }
    throw new Error(`Failed to remove domain: ${error.message}`);
  }
}

/**
 * Check which project owns a domain (if any)
 * Returns the project ID or null
 */
export async function checkDomainOwnership(domain: string): Promise<string | null> {
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!vercelToken) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  try {
    const response = await fetch(`https://api.vercel.com/v9/projects?limit=100`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${error}`);
    }

    const data = await response.json();
    const projects = data.projects || [];

    // Check each project for the domain
    for (const project of projects) {
      if (project.alias?.includes(domain)) {
        return project.id;
      }
    }

    return null;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error checking domain ownership:", error);
    }
    return null;
  }
}

/**
 * Transfer domain from one project to another
 * Removes from old project and adds to new project atomically
 */
export async function transferDomain(
  domain: string,
  fromProjectId: string,
  toProjectId: string,
): Promise<void> {
  // Remove from old project
  await removeDomainFromProject(fromProjectId, domain);

  // Small delay to let Vercel process the removal
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Add to new project
  await addCustomDomain(toProjectId, domain);
}

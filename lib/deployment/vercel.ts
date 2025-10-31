export interface CreateProjectOptions {
  name: string
  gitRepo: string // e.g., "yourorg/repo-name"
  environmentVariables?: Record<string, string>
  framework?: 'nextjs' | 'react' | 'vue' | 'angular'
}

export async function createVercelProject(options: CreateProjectOptions) {
  const {
    name,
    gitRepo,
    environmentVariables = {},
    framework = 'nextjs'
  } = options

  const vercelToken = process.env.VERCEL_TOKEN

  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN environment variable is not set')
  }

  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        gitRepository: {
          type: 'github',
          repo: gitRepo
        },
        framework,
        environmentVariables: Object.entries(environmentVariables).map(([key, value]) => ({
          key,
          value,
          type: 'plain',
          target: ['production', 'preview', 'development']
        })),
        buildCommand: 'npm run build',
        outputDirectory: '.next',
        installCommand: 'npm install'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vercel API error: ${error}`)
    }

    const project = await response.json()
    console.log(`Created Vercel project: ${project.name}`)

    // Wait a moment for initial deployment to start
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get deployment URL
    const deploymentUrl = `https://${project.name}.vercel.app`

    return {
      projectId: project.id,
      projectName: project.name,
      deploymentUrl
    }
  } catch (error: any) {
    console.error('Error creating Vercel project:', error)
    throw new Error(`Failed to create Vercel project: ${error.message}`)
  }
}

export async function triggerDeployment(projectId: string) {
  const vercelToken = process.env.VERCEL_TOKEN

  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN environment variable is not set')
  }

  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectId,
        target: 'production'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vercel API error: ${error}`)
    }

    const deployment = await response.json()
    console.log(`Triggered deployment: ${deployment.url}`)

    return deployment
  } catch (error: any) {
    console.error('Error triggering deployment:', error)
    throw new Error(`Failed to trigger deployment: ${error.message}`)
  }
}

export async function getDeploymentStatus(deploymentId: string) {
  const vercelToken = process.env.VERCEL_TOKEN

  if (!vercelToken) {
    throw new Error('VERCEL_TOKEN environment variable is not set')
  }

  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${vercelToken}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vercel API error: ${error}`)
    }

    const deployment = await response.json()
    return deployment
  } catch (error: any) {
    console.error('Error getting deployment status:', error)
    throw new Error(`Failed to get deployment status: ${error.message}`)
  }
}

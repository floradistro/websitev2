import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_BOT_TOKEN
})

const GITHUB_ORG = process.env.GITHUB_ORG || 'yourplatform'

export interface CreateRepoOptions {
  name: string
  description: string
  templateRepo?: string
  isPrivate?: boolean
}

export async function createRepositoryFromTemplate(options: CreateRepoOptions) {
  const { name, description, templateRepo = 'template-nextjs-app', isPrivate = true } = options

  try {
    // Create repo from template
    const { data: repo } = await octokit.repos.createUsingTemplate({
      template_owner: GITHUB_ORG,
      template_repo: templateRepo,
      owner: GITHUB_ORG,
      name,
      description,
      private: isPrivate,
      include_all_branches: false
    })

    console.log(`Created repo: ${repo.full_name}`)
    return repo
  } catch (error: any) {
    console.error('Error creating GitHub repo:', error)
    throw new Error(`Failed to create repository: ${error.message}`)
  }
}

export interface CommitFileOptions {
  repo: string
  path: string
  content: string
  message: string
  branch?: string
}

export async function commitFile(options: CommitFileOptions) {
  const { repo, path, content, message, branch = 'main' } = options

  try {
    // Check if file exists
    let sha: string | undefined
    try {
      const { data: existing } = await octokit.repos.getContent({
        owner: GITHUB_ORG,
        repo,
        path,
        ref: branch
      })

      if ('sha' in existing) {
        sha = existing.sha
      }
    } catch (error) {
      // File doesn't exist, that's ok
    }

    // Create or update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_ORG,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha,
      committer: {
        name: 'YourPlatform AI',
        email: 'ai@yourplatform.com'
      }
    })

    console.log(`Committed file: ${path} to ${repo}`)
    return data
  } catch (error: any) {
    console.error('Error committing file:', error)
    throw new Error(`Failed to commit file: ${error.message}`)
  }
}

export async function commitMultipleFiles(
  repo: string,
  files: { path: string; content: string }[],
  message: string,
  branch = 'main'
) {
  try {
    // Get current commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_ORG,
      repo,
      ref: `heads/${branch}`
    })

    const currentCommitSha = ref.object.sha

    // Get current commit tree
    const { data: currentCommit } = await octokit.git.getCommit({
      owner: GITHUB_ORG,
      repo,
      commit_sha: currentCommitSha
    })

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: GITHUB_ORG,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        })
        return { path: file.path, sha: blob.sha }
      })
    )

    // Create new tree
    const { data: newTree } = await octokit.git.createTree({
      owner: GITHUB_ORG,
      repo,
      base_tree: currentCommit.tree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      }))
    })

    // Create new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner: GITHUB_ORG,
      repo,
      message,
      tree: newTree.sha,
      parents: [currentCommitSha],
      committer: {
        name: 'YourPlatform AI',
        email: 'ai@yourplatform.com'
      }
    })

    // Update reference
    await octokit.git.updateRef({
      owner: GITHUB_ORG,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha
    })

    console.log(`Committed ${files.length} files to ${repo}`)
    return newCommit
  } catch (error: any) {
    console.error('Error committing multiple files:', error)
    throw new Error(`Failed to commit files: ${error.message}`)
  }
}

export async function getRepositoryFiles(repo: string, path = '', branch = 'main') {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_ORG,
      repo,
      path,
      ref: branch
    })

    return Array.isArray(data) ? data : [data]
  } catch (error: any) {
    console.error('Error getting repository files:', error)
    throw new Error(`Failed to get files: ${error.message}`)
  }
}

export async function getFileContent(repo: string, filepath: string, branch = 'main'): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_ORG,
      repo,
      path: filepath,
      ref: branch
    })

    // Handle file content
    if ('content' in data && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }

    return null
  } catch (error: any) {
    console.error('Error getting file content:', error)
    return null
  }
}

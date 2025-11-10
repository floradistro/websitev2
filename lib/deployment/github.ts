import { Octokit } from "@octokit/rest";

const TEMPLATE_OWNER = process.env.GITHUB_TEMPLATE_ORG || "floradistro";
const TEMPLATE_REPO =
  process.env.GITHUB_TEMPLATE_REPO || "cannabis-storefront-template";

/**
 * Create Octokit instance with vendor's access token
 */
function getVendorOctokit(accessToken: string) {
  return new Octokit({
    auth: accessToken,
  });
}

export interface CreateRepoOptions {
  vendorAccessToken: string;
  vendorUsername: string;
  name: string;
  description: string;
  isPrivate?: boolean;
}

export async function createRepositoryFromTemplate(options: CreateRepoOptions) {
  const {
    vendorAccessToken,
    vendorUsername,
    name,
    description,
    isPrivate = true,
  } = options;

  try {
    const octokit = getVendorOctokit(vendorAccessToken);

    // Try to create repo from template in VENDOR's account
    try {
      const { data: repo } = await octokit.repos.createUsingTemplate({
        template_owner: TEMPLATE_OWNER,
        template_repo: TEMPLATE_REPO,
        owner: vendorUsername,
        name,
        description,
        private: isPrivate,
        include_all_branches: false,
      });

      return repo;
    } catch (templateError: any) {
      // If template doesn't exist (404), create a simple empty repo
      if (templateError.status === 404) {
        const { data: repo } = await octokit.repos.createForAuthenticatedUser({
          name,
          description,
          private: isPrivate,
          auto_init: true,
          gitignore_template: "Node",
        });

        return repo;
      }

      // If it's not a 404, throw the error
      throw templateError;
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating GitHub repo:", error);
    }
    throw new Error(`Failed to create repository: ${error.message}`);
  }
}

export interface CommitFileOptions {
  vendorAccessToken: string;
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
}

export async function commitFile(options: CommitFileOptions) {
  const {
    vendorAccessToken,
    owner,
    repo,
    path,
    content,
    message,
    branch = "main",
  } = options;

  try {
    const octokit = getVendorOctokit(vendorAccessToken);

    // Check if file exists
    let sha: string | undefined;
    try {
      const { data: existing } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if ("sha" in existing) {
        sha = existing.sha;
      }
    } catch (error) {
      // File doesn't exist, that's ok
    }

    // Create or update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      sha,
    });

    return data;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error committing file:", error);
    }
    throw new Error(`Failed to commit file: ${error.message}`);
  }
}

export async function commitMultipleFiles(
  vendorAccessToken: string,
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  message: string,
  branch = "main",
) {
  try {
    const octokit = getVendorOctokit(vendorAccessToken);

    // Get current commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const currentCommitSha = ref.object.sha;

    // Get current commit tree
    const { data: currentCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha,
    });

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString("base64"),
          encoding: "base64",
        });
        return { path: file.path, sha: blob.sha };
      }),
    );

    // Create new tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: currentCommit.tree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      })),
    });

    // Create new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [currentCommitSha],
    });

    // Update reference
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return newCommit;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error committing multiple files:", error);
    }
    throw new Error(`Failed to commit files: ${error.message}`);
  }
}

export async function getRepositoryFiles(
  vendorAccessToken: string,
  owner: string,
  repo: string,
  path = "",
  branch = "main",
) {
  try {
    const octokit = getVendorOctokit(vendorAccessToken);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    return Array.isArray(data) ? data : [data];
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting repository files:", error);
    }
    throw new Error(`Failed to get files: ${error.message}`);
  }
}

export async function getFileContent(
  vendorAccessToken: string,
  owner: string,
  repo: string,
  filepath: string,
  branch = "main",
): Promise<string | null> {
  try {
    const octokit = getVendorOctokit(vendorAccessToken);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filepath,
      ref: branch,
    });

    // Handle file content
    if ("content" in data && data.type === "file") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }

    return null;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting file content:", error);
    }
    return null;
  }
}

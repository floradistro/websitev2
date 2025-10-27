# GitHub Actions Workflows

This directory contains automated workflows for WhaleTools.

## Workflows

### 1. `nightly-cleanup.yml`
**Schedule:** Every night at 3 AM PST (11 AM UTC)

**Purpose:** Automated code cleanup, formatting, and optimization

**Actions:**
- ESLint auto-fix
- Prettier formatting
- TypeScript compilation check
- Bundle size analysis
- Database optimization (VACUUM, ANALYZE, cleanup)
- Performance analysis
- Auto-commit changes if any

**Manual trigger:** Yes (workflow_dispatch)

### 2. `code-quality.yml`
**Triggers:** Pull requests and pushes to main/develop

**Purpose:** Continuous integration and code quality checks

**Actions:**
- ESLint validation
- TypeScript type checking
- Prettier format validation
- Security audit (npm audit)
- Dependency freshness check

**Manual trigger:** No (automatic on PR/push)

## How to Run Manually

### GitHub UI
1. Go to: Actions tab in your repository
2. Select the workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### GitHub CLI
```bash
# Trigger nightly cleanup
gh workflow run nightly-cleanup.yml

# Trigger code quality checks
gh workflow run code-quality.yml
```

## Viewing Results

- **Workflow runs:** Actions tab → Select workflow → View runs
- **Logs:** Click on any run → Click on job → View step logs
- **Commits:** Look for commits from `github-actions[bot]`
- **Reports:** Check Issues for optimization summaries

## Troubleshooting

**Workflow not appearing?**
- Ensure files are committed to main branch
- Check: Settings → Actions → Allow all actions

**Workflow failing?**
- Check logs in Actions tab
- Verify secrets are set (if needed)
- Ensure scripts have execute permissions

**No auto-commits?**
- Verify GitHub token has write permissions
- Check branch protection rules
- Review workflow logs for git errors

## Configuration

### Change Schedule
Edit the `cron` expression in `nightly-cleanup.yml`:
```yaml
- cron: '0 11 * * *'  # Minute Hour Day Month Weekday (UTC)
```

**Examples:**
- `0 11 * * *` - 3 AM PST daily
- `0 11 * * 1` - 3 AM PST every Monday
- `0 11 1 * *` - 3 AM PST first day of month

### Disable Workflow
Add to top of workflow file:
```yaml
on:
  workflow_dispatch: # Manual only
```

## Secrets (Optional)

Add to: Repository Settings → Secrets and variables → Actions

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for database access

---

For more information, see: `AUTOMATION_SETUP.md`


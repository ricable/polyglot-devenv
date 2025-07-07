# Complete Git Workflow: Local ↔ Remote Operations

## 1. Initial Setup

```bash
git init
```
**Local**: Creates new Git repository in current directory  
**Remote**: No effect

```bash
git clone <url>
```
**Local**: Downloads entire remote repository to local machine  
**Remote**: No change to original repository

```bash
# Fork via GitHub/GitLab UI
```
**Local**: No effect  
**Remote**: Creates copy of repository under your account

## 2. Starting New Work

```bash
git checkout main
```
**Local**: Switches working directory to main branch  
**Remote**: No effect

```bash
git pull origin main
```
**Local**: Downloads latest main from remote and merges into local main  
**Remote**: No change

```bash
git checkout -b feature-branch
```
**Local**: Creates new branch from current HEAD and switches to it  
**Remote**: No effect (branch doesn't exist remotely yet)

## 3. Making Changes

```bash
git add file.txt
# or
git add .
```
**Local**: Moves changes from working directory to staging area  
**Remote**: No effect

```bash
git commit -m "Add new feature"
```
**Local**: Saves staged changes as commit in local repository  
**Remote**: No effect (commits stay local until pushed)

## 4. First Push (Establishing Remote Branch)

```bash
git push -u origin feature-branch
```
**Local**: Sets upstream tracking between local and remote branch  
**Remote**: Creates feature-branch on remote with your commits

**State after push:**
- **Local**: `feature-branch` exists with commits A→B→C
- **Remote**: `origin/feature-branch` exists with same commits A→B→C

## 5. Subsequent Development

```bash
# Make more changes, add, commit...
git push
```
**Local**: No change (already committed)  
**Remote**: Updates `origin/feature-branch` with new commits

## 6. Pull Request Workflow

```bash
# Open PR via GitHub/GitLab UI
```
**Local**: No effect  
**Remote**: Creates merge request from `feature-branch` to `main`

```bash
# After PR is approved and merged remotely
```
**Local**: Still unchanged - your local main is outdated  
**Remote**: `main` now contains your feature commits, `feature-branch` may still exist

## 7. Syncing After Merge

```bash
git checkout main
```
**Local**: Switches to local main branch (still at old state)  
**Remote**: No effect

```bash
git pull origin main
```
**Local**: Updates local main with merged changes from remote  
**Remote**: No change

**State after pull:**
- **Local**: `main` now has commits A→B→C→D (including your feature)
- **Remote**: `main` unchanged (already had these commits)

## 8. Cleanup

```bash
git branch -d feature-branch
```
**Local**: Deletes local feature branch (safe since merged)  
**Remote**: `origin/feature-branch` still exists

```bash
git push origin --delete feature-branch
```
**Local**: No effect  
**Remote**: Deletes `origin/feature-branch` from remote repository

## 9. Alternative Sync Commands

```bash
git fetch origin
```
**Local**: Downloads all remote changes to local cache (doesn't merge)  
**Remote**: No change

```bash
git merge origin/main
```
**Local**: Merges cached remote changes into current branch  
**Remote**: No effect

**Note**: `git pull` = `git fetch` + `git merge`

## 10. Branch Management

```bash
git branch
```
**Local**: Lists local branches only  
**Remote**: No effect

```bash
git branch -r
```
**Local**: Lists remote-tracking branches cached locally  
**Remote**: No effect

```bash
git branch -a
```
**Local**: Lists both local and remote-tracking branches  
**Remote**: No effect

## Summary of Local vs Remote States

### Local Repository Contains:
- Working directory (your current files)
- Staging area (changes ready to commit)
- Local branches with commits
- Remote-tracking branches (cached copies of remote branches)

### Remote Repository Contains:
- Remote branches with commits
- Pull requests/merge requests
- Repository metadata and settings

### Key Rules:
1. **Local → Remote**: Use `push` to send commits
2. **Remote → Local**: Use `fetch`/`pull` to receive commits  
3. **Staging**: Local-only concept before committing
4. **Pull Requests**: Remote platform feature for code review
5. **Tracking**: `-u` flag links local branch to remote branch for easy push/pull

### Critical Workflow Points:
- Always `git pull origin main` before starting new features
- Use `git push -u origin branch-name` for first push of new branch
- After PR merge, sync local main with `git pull origin main`
- Clean up both local and remote branches after merge
# .SYNOPSIS
#   星辞 (StarLit) 一键发布 + 自动归档脚本
#
# .DESCRIPTION
#   自动完成版本升级、提交、打 tag、推送，触发 GitHub Actions 构建部署。
#   用法: .\release.ps1 [-v patch|minor|major]
#
#   示例:
#     .\release.ps1
#     .\release.ps1 -v minor
#     .\release.ps1 -v major

param(
  [ValidateSet('patch', 'minor', 'major')]
  [string]$v = 'patch'
)

$ErrorActionPreference = 'Stop'

# ---- 0. 检查当前工作目录 ----
if (-not (Test-Path ".git")) {
  Write-Host "ERROR: please run in project root" -ForegroundColor Red
  exit 1
}

# ---- 1. 检查是否有未暂存/未跟踪的文件 ----
$status = git status --porcelain
if (-not $status) {
  Write-Host "No changes detected, nothing to release." -ForegroundColor Yellow
  exit 0
}

Write-Host "`nChanges detected:" -ForegroundColor Cyan
git status --short

# ---- 2. 输入提交信息 ----
Write-Host "`nEnter commit message (single line, then Enter):" -ForegroundColor Cyan
$m = Read-Host
if (-not $m) {
  Write-Host "ERROR: commit message cannot be empty" -ForegroundColor Red
  exit 1
}

Write-Host "`nMessage: $m" -ForegroundColor Cyan

# ---- 3. 确认 ----
Write-Host "`nReady to release v$v" -ForegroundColor Cyan
$confirm = Read-Host "Continue? (Y/n)"
if ($confirm -ne '' -and $confirm -ne 'Y' -and $confirm -ne 'y') {
  Write-Host "Cancelled" -ForegroundColor Yellow
  exit 0
}

# ---- 4. 自动升版本号（先 pull 确保最新，避免 tag 冲突） ----
try {
  git pull origin main --no-rebase 2>$null
} catch {
  Write-Host "Warning: pull failed (first time deploy, ignoring)" -ForegroundColor Yellow
}

Write-Host "`nBumping version ($v)..." -ForegroundColor Green
$newVersion = npm version $v --no-git-tag-version
git add package.json package-lock.json
Write-Host "  -> new version: $newVersion" -ForegroundColor Green

# ---- 5. 提交 ----
git add -A
git commit -m "$m"
Write-Host "Commit success: $m" -ForegroundColor Green

# ---- 6. 打 tag 归档 ----
git tag "$newVersion"
Write-Host "Tag: $newVersion" -ForegroundColor Green

# ---- 7. 推送（触发 GitHub Actions 自动部署） ----
Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push origin main --tags

# ---- 8. 输出结果 ----
$commitHash = git rev-parse --short HEAD
Write-Host "`nRelease complete!" -ForegroundColor Green
Write-Host "  version: $newVersion" -ForegroundColor Green
Write-Host "  commit: $commitHash" -ForegroundColor Green
Write-Host "  Actions: https://github.com/Ha2eS1onn/starlit/actions" -ForegroundColor Cyan
Write-Host "  Site will auto-update in ~2 minutes" -ForegroundColor Cyan
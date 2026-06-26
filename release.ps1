<#
.SYNOPSIS
  星辞 (StarLit) 一键发布 + 自动归档脚本

.DESCRIPTION
  自动完成版本升级、提交、打 tag、推送，触发 GitHub Actions 构建部署。
  用法: .\release.ps1 [-v patch|minor|major]

  示例:
    .\release.ps1
    .\release.ps1 -v minor
    .\release.ps1 -v major
#>

param(
  [ValidateSet('patch', 'minor', 'major')]
  [string]$v = 'patch'
)

$ErrorActionPreference = 'Stop'

# ---- 0. 检查当前工作目录 ----
if (-not (Test-Path ".git")) {
  Write-Host "❌ 请在项目根目录 (H:\StarLit) 下运行" -ForegroundColor Red
  exit 1
}

# ---- 1. 检查是否有未暂存/未跟踪的文件 ----
$status = git status --porcelain
if (-not $status) {
  Write-Host "⚠️ 没有检测到任何更改，无需发布" -ForegroundColor Yellow
  exit 0
}

Write-Host "`n📋 检测到以下更改:" -ForegroundColor Cyan
git status --short

# ---- 2. 输入提交信息 ----
Write-Host "`n📝 请输入更新说明（多行以空行结束，单行直接回车）:" -ForegroundColor Cyan
$lines = @()
while ($true) {
  $line = Read-Host
  if (-not $line) { break }
  $lines += $line
}
$m = $lines -join "`n"
if (-not $m) {
  Write-Host "❌ 提交信息不能为空" -ForegroundColor Red
  exit 1
}

Write-Host "`n📋 更新说明:" -ForegroundColor Cyan
$lines | ForEach-Object { Write-Host "  $_" }

# ---- 3. 确认 ----
Write-Host "`n🚀 即将发布 v$v" -ForegroundColor Cyan
$confirm = Read-Host "是否继续？(Y/n)"
if ($confirm -ne '' -and $confirm -ne 'Y' -and $confirm -ne 'y') {
  Write-Host "已取消" -ForegroundColor Yellow
  exit 0
}

# ---- 4. 自动升版本号（先 pull 确保最新，避免 tag 冲突） ----
try {
  git pull origin main --no-rebase 2>$null
} catch {
  Write-Host "⚠️ pull 失败（首次部署忽略）" -ForegroundColor Yellow
}

Write-Host "`n📦 升级版本号 ($v)..." -ForegroundColor Green
$newVersion = npm version $v --no-git-tag-version
git add package.json package-lock.json
Write-Host "   → 新版本: $newVersion" -ForegroundColor Green

# ---- 5. 提交 ----
git add -A
git commit -m "$m`n`nCo-authored-by: starlit-bot <bot@starlit.app>"
Write-Host "✅ 提交成功: $m" -ForegroundColor Green

# ---- 6. 打 tag 归档 ----
git tag "$newVersion"
Write-Host "🏷️ 归档标记: $newVersion" -ForegroundColor Green

# ---- 7. 推送（触发 GitHub Actions 自动部署） ----
Write-Host "`n⬆️ 推送到 GitHub..." -ForegroundColor Green
git push origin main --tags

# ---- 8. 输出结果 ----
$commitHash = git rev-parse --short HEAD
Write-Host "`n✅ 发布完成!" -ForegroundColor Green
Write-Host "   版本: $newVersion" -ForegroundColor Green
Write-Host "   提交: $commitHash" -ForegroundColor Green
Write-Host "   Actions: https://github.com/Ha2eS1onn/starlit/actions" -ForegroundColor Cyan
Write-Host "   站点: 约 2 分钟后自动更新" -ForegroundColor Cyan
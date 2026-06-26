<#
.SYNOPSIS
  星辞 (StarLit) 手动部署脚本（备用）

.DESCRIPTION
  ⚠️ 日常更新请使用 release.ps1 (自动发布 + GitHub Actions CI/CD)
  此脚本仅在 Actions 异常时作为手动部署后备方案使用。
  用法: .\deploy.ps1
#>

Set-Location H:\StarLit

# 清理之前的分支
$branches = git branch --list
if ($branches -match 'gh-pages') {
  git branch -D gh-pages 2>$null
}

# 构建
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build

# 将构建产物推送到 gh-pages 分支
Set-Content -Path dist/CNAME -Value "starlit.xn--r8q546c.top"
Set-Location dist
git init
git checkout -B gh-pages
git add .
git commit -m "deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
try {
  git remote add origin https://github.com/ha2es1onn/starlit.git 2>$null
} catch {}
git push origin gh-pages --force
Set-Location ..

Write-Host "手动部署完成"
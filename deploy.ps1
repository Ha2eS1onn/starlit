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

Write-Host "部署完成"
Write-Host "请在 GitHub Pages 设置中将 Branch 切换为 gh-pages → / (root)"
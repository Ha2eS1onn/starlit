Set-Location H:\StarLit
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build
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
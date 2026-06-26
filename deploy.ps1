cd H:\StarLit
npm run build
echo "starlit.xn--r8q546c.top" > dist/CNAME
cd dist
git init
git checkout -b gh-pages
git add .
git commit -m "deploy"
git remote add origin https://github.com/ha2es1onn/starlit.git
git push -u origin gh-pages --force
cd ..
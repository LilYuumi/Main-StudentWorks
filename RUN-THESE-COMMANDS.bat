@echo off
echo ========================================
echo Railway Deployment Fix
echo ========================================
echo.

echo Step 1: Removing node_modules from git...
git rm -r --cached "node_modules - Copy"
if errorlevel 1 (
    echo node_modules - Copy not found in git, skipping...
)

echo.
echo Step 2: Removing backup folders from git...
git rm -r --cached "api - Copy"
git rm -r --cached "db - Copy"
git rm -r --cached "middleware - Copy"
git rm -r --cached "markdown - Copy"

echo.
echo Step 3: Adding .gitignore and updated files...
git add .gitignore
git add server.js

echo.
echo Step 4: Committing changes...
git commit -m "Fix Railway deployment: remove node_modules and add auto-migrations"

echo.
echo Step 5: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo DONE! Check Railway dashboard now.
echo ========================================
echo.
echo Next steps:
echo 1. Go to Railway dashboard
echo 2. Settings - Deploy section
echo 3. Set Build Command to: (leave empty)
echo 4. Set Start Command to: npm start
echo 5. Click Redeploy
echo.
pause

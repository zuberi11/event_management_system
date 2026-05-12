@echo off
title EventFlow - Verification Check
color 0B

echo.
echo ============================================
echo    EVENTFLOW - Verification Check
echo ============================================
echo.

cd /d D:\eventflow

:: ─── Check Folder Structure
echo [1] Checking Folder Structure ...
echo.

set PASS=0
set FAIL=0

call :checkFolder "D:\eventflow"
call :checkFolder "D:\eventflow\database"
call :checkFolder "D:\eventflow\routes"
call :checkFolder "D:\eventflow\public"
call :checkFolder "D:\eventflow\public\css"
call :checkFolder "D:\eventflow\public\js"

echo.
echo [2] Checking Project Files ...
echo.

call :checkFile "D:\eventflow\server.js"
call :checkFile "D:\eventflow\db.js"
call :checkFile "D:\eventflow\package.json"
call :checkFile "D:\eventflow\routes\auth.js"
call :checkFile "D:\eventflow\routes\events.js"
call :checkFile "D:\eventflow\routes\bookings.js"
call :checkFile "D:\eventflow\public\index.html"
call :checkFile "D:\eventflow\public\admin.html"
call :checkFile "D:\eventflow\public\css\style.css"
call :checkFile "D:\eventflow\public\js\main.js"

echo.
echo [3] Checking node_modules folder ...
echo.

call :checkFolder "D:\eventflow\node_modules"

echo.
echo [4] Checking Installed Packages ...
echo.

call :checkModule "express"
call :checkModule "better-sqlite3"
call :checkModule "bcryptjs"
call :checkModule "express-session"
call :checkModule "nodemon"

echo.
echo [5] Checking package.json scripts ...
echo.

node -e "const p=require('./package.json'); const s=p.scripts||{}; if(s.start&&s.dev){console.log('  [OK] start script  : '+s.start); console.log('  [OK] dev script    : '+s.dev);}else{console.log('  [!!] Scripts missing in package.json');}"

echo.
echo ============================================
echo   RESULT: %PASS% checks passed,  %FAIL% checks failed
echo ============================================
echo.

if %FAIL%==0 (
    color 0A
    echo   ALL GOOD! Project is ready to code.
    echo   Run: cd D:\eventflow
    echo   Run: npm run dev
) else (
    color 0C
    echo   Some checks failed. Share this output
    echo   and we will fix the issues together.
)

echo.
pause
goto :eof

:: ─── Helper: Check Folder
:checkFolder
if exist %1\ (
    echo   [OK] Folder : %~1
    set /a PASS+=1
) else (
    echo   [!!] MISSING Folder : %~1
    set /a FAIL+=1
)
goto :eof

:: ─── Helper: Check File
:checkFile
if exist %1 (
    echo   [OK] File   : %~1
    set /a PASS+=1
) else (
    echo   [!!] MISSING File   : %~1
    set /a FAIL+=1
)
goto :eof

:: ─── Helper: Check npm module
:checkModule
if exist "D:\eventflow\node_modules\%~1" (
    echo   [OK] Package: %~1
    set /a PASS+=1
) else (
    echo   [!!] MISSING Package: %~1
    set /a FAIL+=1
)
goto :eof

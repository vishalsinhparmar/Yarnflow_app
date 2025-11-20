@echo off
echo ========================================
echo  Adding Windows Firewall Rule
echo  for Node.js Backend Port 3050
echo ========================================
echo.
echo This will allow your mobile device to
echo connect to your backend server.
echo.
echo NOTE: This requires Administrator privileges
echo.
pause

netsh advfirewall firewall add rule name="Node.js Port 3050" dir=in action=allow protocol=TCP localport=3050

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Firewall rule added.
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Test from phone browser:
    echo    http://192.168.205.1:3050/api/dashboard/stats
    echo.
    echo 2. If that works, restart Expo:
    echo    npx expo start --clear
    echo.
    echo 3. Scan QR code on your phone
    echo ========================================
) else (
    echo.
    echo ========================================
    echo  ERROR: Failed to add firewall rule
    echo ========================================
    echo.
    echo Please run this file as Administrator:
    echo 1. Right-click ADD_FIREWALL_RULE.bat
    echo 2. Select "Run as administrator"
    echo ========================================
)

echo.
pause

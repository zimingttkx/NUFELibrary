@echo off
echo Checking system type...
echo Detected Windows system.

set "TARGET=%~dp0cli\dist\library-reserve-cli-win.exe"

if exist "%TARGET%" (
    echo Launching Windows version...
    "%TARGET%"
) else (
    echo Error: Windows executable not found at %TARGET%
    echo Please ensure the project has been built using 'npm run build' in the cli directory.
    pause
)

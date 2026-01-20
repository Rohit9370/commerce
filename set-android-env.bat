@echo off
echo Setting Android environment variables...
set ANDROID_HOME=C:\Users\rohit\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\rohit\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools

echo ANDROID_HOME set to: %ANDROID_HOME%
echo ANDROID_SDK_ROOT set to: %ANDROID_SDK_ROOT%
echo.
echo Now you can run: cd android && gradlew assembleRelease
echo.
pause
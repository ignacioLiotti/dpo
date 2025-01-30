@echo off
chcp 65001
setlocal

:: Database credentials
set DB_HOST=localhost
set DB_USER=root
set DB_PASS=Ibl2000
set DB_NAME=dpo_db
set SQL_FOLDER=C:\Users\Usuario\Desktop\projects\test2

:: Disable foreign key checks
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% --default-character-set=utf8mb4 %DB_NAME% -e "SET FOREIGN_KEY_CHECKS=0;"

:: Loop through SQL files
for %%f in ("%SQL_FOLDER%\*.sql") do (
    echo Importing %%f...
    mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% --default-character-set=utf8mb4 %DB_NAME% < "%%f"
    if %errorlevel% equ 0 (
        echo Successfully imported %%f
    ) else (
        echo Error importing %%f
    )
)

:: Re-enable foreign key checks
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASS% --default-character-set=utf8mb4 %DB_NAME% -e "SET FOREIGN_KEY_CHECKS=1;"

echo All files imported.
pause

@echo off
echo Dang vao thu muc backend...
cd apps\backend

echo.
echo Dang day cau truc database len Supabase...
call npx prisma db push

echo.
echo Dang hut du lieu tu MongoDB sang Supabase...
call npx ts-node scripts\migrate-mongo.ts

echo.
echo Hoan thanh!
pause

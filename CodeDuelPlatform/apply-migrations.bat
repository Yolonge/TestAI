@echo off
set CONN_STR=User ID=postgres;Password=5959;Host=localhost;Port=5432;Database=testai;
dotnet ef database update --connection "%CONN_STR%" 
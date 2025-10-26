# Vercel Projects Setup Guide

## 📋 Проверка конфигурации

### ✅ Что уже настроено:

1. **Cron Jobs в `vercel.json`:**
   - `fetch-news` — каждые 10 минут
   - `analyze` — каждую минуту
   - `aggregate` — каждые 30 минут

2. **API Routes:**
   - Все основные endpoints работают
   - SSE endpoint исправлен (убрана Edge runtime)
   - Авторизация для cron jobs реализована

3. **Database migrations:**
   - Все таблицы созданы
   - Индексы настроены
   - RLS политики установлены

### ⚠️ Что нужно сделать перед деплоем:

#### 1. Установить переменные окружения в Vercel Dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ВАЖНО: Сгенерируйте секретный токен для cron jobs
CRON_AUTH_TOKEN=your_secret_random_string_here

# Опционально
REALTIME_ENABLED=true
SSE_ENABLED=true
POLL_MIN_MS=1000
POLL_MAX_MS=15000
STREAM_HEARTBEAT_MS=15000
BANNER_THRESHOLD=3
MAX_BUFFER=200
MAX_VISIBLE=500
```

**Как сгенерировать `CRON_AUTH_TOKEN`:**
```bash
# Используйте один из способов:
openssl rand -base64 32
# или
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 2. Выполнить миграции базы данных:

```bash
# Подключитесь к Supabase и выполните:
supabase db push
# или выполните миграции вручную через Supabase Dashboard
```

#### 3. Проверить что все работает:

```bash
# 1. Проверьте health endpoint
curl https://your-app.vercel.app/api/health

# 2. Проверьте cron jobs работают
# В Vercel Dashboard → Settings → Cron Jobs
# Должны отображаться 3 cron jobs
```

## 🔧 Исправления, которые были внесены:

1. **Убран Edge runtime из SSE endpoint** (`app/api/news/stream/route.ts`)
   - Было: `export const runtime = 'edge'`
   - Теперь: Node.js runtime (по умолчанию)
   - Причина: Supabase JS SDK не работает в Edge runtime

2. **Добавлен `CRON_AUTH_TOKEN` в `env.example`**
   - Теперь понятно, какая переменная нужна для cron jobs

3. **Обновлена документация в `DEPLOY.md`**
   - Добавлены инструкции по настройке `CRON_AUTH_TOKEN`
   - Добавлен troubleshooting для cron jobs

## 🚀 Деплой:

```bash
# 1. Push изменений в репозиторий
git add .
git commit -m "fix: remove edge runtime from SSE endpoint, add CRON_AUTH_TOKEN"
git push origin main

# 2. Деплой через Vercel CLI
npx vercel --prod

# Или деплой автоматически через Vercel Dashboard
# (если настроен GitHub integration)
```

## 📊 Мониторинг после деплоя:

1. **Vercel Dashboard → Functions → Logs**
   - Проверьте логи cron jobs
   - Убедитесь что нет ошибок авторизации (401)

2. **Vercel Dashboard → Settings → Cron Jobs**
   - Должны быть активны 3 cron jobs
   - Проверьте последние выполнения

3. **Supabase Dashboard**
   - Проверьте что данные появляются в таблице `news`
   - Проверьте что создаются записи в `analyses`

## 🐛 Troubleshooting:

### Cron jobs возвращают 401 Unauthorized
- Убедитесь что `CRON_AUTH_TOKEN` установлен в Vercel Dashboard
- Проверьте что значение совпадает с тем, что в коде

### SSE endpoint не работает
- Проверьте что `SSE_ENABLED=true` в переменных окружения
- Проверьте логи в Vercel Dashboard

### Realtime не работает
- Убедитесь что Realtime включен в Supabase Dashboard
- Проверьте что миграция `002_enable_realtime.sql` выполнена

## ✅ Готово к продакшену!

После настройки всех переменных окружения проект готов к деплою.


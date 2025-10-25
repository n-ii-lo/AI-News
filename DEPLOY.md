# 🚀 Realtime News Feed - Деплой инструкция

## ✅ Готово к деплою

Все компоненты реализованы и протестированы:

### 📦 Что было создано

**API Routes:**
- ✅ `app/api/news/route.ts` — ETag, If-None-Match, 304, параметр `after=`
- ✅ `app/api/news/stream/route.ts` — SSE endpoint (Edge runtime)

**Hooks:**
- ✅ `hooks/useBackgroundFeed.ts` — staging buffer, threshold, merge, dedupe
- ✅ `hooks/useRealtimeFeed.ts` — Realtime → SSE → Polling стратегия
- ✅ `hooks/useStableMerge.ts` — anchor-preserving scroll
- ✅ `hooks/useVisibilityClock.ts` — adaptive intervals

**Components:**
- ✅ `components/NewItemsBanner.tsx` — sticky "New (N)" pill
- ✅ `components/NewsFeedItem.tsx` — извлечен из CenterNewsFeed
- ✅ `components/NewsFeed.tsx` — виртуализация + realtime интеграция
- ✅ `components/CenterNewsFeed.tsx` — рефакторинг на новую систему

**Testing:**
- ✅ 36 unit тестов (все проходят)
- ✅ TypeScript проверки (0 ошибок)
- ✅ Build успешен

### 🔧 Переменные окружения

Убедитесь что в `.env.local` настроены:

```bash
# Supabase (обязательно)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Realtime конфигурация (опционально)
REALTIME_ENABLED=true
SSE_ENABLED=true
POLL_MIN_MS=1000
POLL_MAX_MS=15000
STREAM_HEARTBEAT_MS=15000
BANNER_THRESHOLD=3
MAX_BUFFER=200
MAX_VISIBLE=500
```

### 🚀 Деплой на Vercel

1. **Push в репозиторий:**
```bash
git add .
git commit -m "feat: implement realtime news feed with New(N) banner"
git push origin main
```

2. **Деплой через Vercel CLI:**
```bash
npx vercel --prod
```

3. **Или через Vercel Dashboard:**
- Подключите репозиторий к Vercel
- Настройте переменные окружения в Vercel Dashboard
- Деплой автоматически запустится

### 🔍 Проверка после деплоя

1. **Основной функционал:**
- ✅ Лента новостей загружается
- ✅ Баннер "New (N)" появляется при новых элементах
- ✅ Клик по баннеру показывает новые элементы
- ✅ Позиция скролла сохраняется

2. **Realtime функции:**
- ✅ Статус подключения отображается (Live/Syncing/Offline)
- ✅ Новые элементы приходят в реальном времени
- ✅ Переключение между транспортами работает

3. **Performance:**
- ✅ Виртуализация работает для больших списков
- ✅ Нет jank при обновлениях
- ✅ Memory usage в пределах нормы

### 🐛 Troubleshooting

**Если Realtime не работает:**
1. Проверьте Supabase Realtime включен в Dashboard
2. Убедитесь что таблица `news` имеет RLS политики
3. Проверьте переменные окружения

**Если SSE не работает:**
1. Проверьте Edge runtime поддерживается на вашем плане Vercel
2. Убедитесь что `/api/news/stream` доступен

**Если Polling не работает:**
1. Проверьте ETag headers в Network tab
2. Убедитесь что `/api/news?after=` возвращает данные

### 📊 Мониторинг

После деплоя мониторьте:
- Vercel Analytics для performance
- Supabase Dashboard для Realtime usage
- Browser DevTools для network requests

---

## 🎉 Готово к продакшену!

Система полностью реализована согласно техническому заданию и готова к использованию.

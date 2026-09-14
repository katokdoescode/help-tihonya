# Тихоня — сбор на помощь

Статический сайт-сбор для собаки Тихони (Ланы). Astro, статическая сборка без сервера и CMS — весь контент редактируется прямо в `src/pages/index.astro`.

## Разработка

```bash
npm install
npm run dev       # локальный сервер разработки
npm run build     # astro check + сборка в dist/
npm run preview   # предпросмотр собранного dist/
```

## Фото

Положите фотографии Тихони в `public/assets/` под именами `tihonya-1.jpg`, `tihonya-2.jpg`, `tihonya-3.jpg` (или обновите `galleryItems` в `src/pages/index.astro`, если имена файлов другие).

## Деплой

Cloudflare Pages, Git-подключение:
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

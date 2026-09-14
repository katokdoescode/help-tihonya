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

Фотографии Тихони лежат в `public/assets/` (сейчас — `tihonya-4.jpg`). Чтобы добавить ещё, положите файл в `public/assets/` и добавьте его в массив `galleryItems` в `src/pages/index.astro`.

## Деплой

Cloudflare Pages, Git-подключение:
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

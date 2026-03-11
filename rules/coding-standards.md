# Стандарты кодирования

## TypeScript/React

### Общие правила

- Используйте TypeScript для всех файлов
- Используйте только функциональные компоненты (стрелочные функции)
- Используйте хуки для управления состоянием
- Все компоненты пишем через `export const Component: FC<Props>`
- Импортируйте `FC` из React для типизации компонентов
- Используйте `type` для импорта типов: `import type { FC } from 'react'`

### Типы TypeScript

- Используйте только `type` для определения типов (не используйте `interface`)
- Именованные типы: PascalCase с суффиксом (например, `ButtonProps`, `UserData`, `ApiResponse`)

**Пример:**

```typescript
type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
};
```

### Именование

- **Компоненты**: PascalCase (например, `UserProfile`)
- **Переменные и функции**: camelCase (например, `getUserData`)
- **Константы**: UPPER_SNAKE_CASE (например, `API_BASE_URL`)
- **Файлы компонентов**: PascalCase.tsx (например, `UserProfile.tsx`)

### Структура файлов

- Каждый компонент в отдельном файле
- Именованный экспорт для компонентов (`export const Component`)
- Экспорт компонента через `index.ts` для удобного импорта
- Именованный экспорт для утилит и хуков

### Структура компонента

```
src/components/UI/Button/
├── index.ts              # Реэкспорт компонента
├── Button.tsx            # Основной компонент (именованный экспорт)
└── Button.module.scss    # Стили компонента
```

**Пример:**

```typescript
// Button.tsx
import type { FC } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
};

export const Button: FC<ButtonProps> = ({ children, variant = 'primary', onClick }) => {
  const buttonClass = clsx(styles.button, styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`]);

  return (
    <button className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
};

// index.ts
export { Button } from './Button';
```

### Использование clsx

- ✅ Условные классы с объектным синтаксисом
- ✅ Автоматическое удаление falsy значений
- ✅ Поддержка массивов и строк

**Пример:**

```typescript
const buttonClass = clsx(
  styles.button,
  styles[`button${variant}`],
  {
    [styles.disabled]: disabled,
    [styles.active]: isActive,
  },
  className
);
```

### Именование классов

- Используйте camelCase для всех классов: `.buttonPrimary`, `.cardHeader`
- **Базовые элементы**: `.button`, `.card`, `.input`
- **Модификаторы**: `.buttonPrimary`, `.buttonSecondary`, `.inputLarge`
- **Составные элементы**: `.cardHeader`, `.modalContent`, `.navbarItem`

### SCSS правила

- Максимальная вложенность: 3 уровня
- Используйте переменные для цветов, размеров, шрифтов из `@styles/`
- Группируйте свойства логически
- Используйте миксины для повторяющихся паттернов
- **CSS модули**: всегда используйте `.module.scss` для компонентов
- **Глобальные стили**: только в `src/styles/` папке

### Примеры именования классов

```scss
.buttonPrimary {
  // стили
}

.cardHeader {
  // стили
}

.navbarItem {
  // стили
}
```

## Комментарии

### Когда комментировать

- Сложная бизнес-логика
- Неочевидные решения
- TODO и FIXME заметки
- JSDoc для публичных API

### Формат комментариев

```typescript
/**
 * Описание функции
 * @param param1 - описание параметра
 * @returns описание возвращаемого значения
 */
```

## Статические файлы

> **Примечание**: Подробное описание разницы между `src/assets/` и `public/` см. в [project-conventions.md](./project-conventions.md#разница-между-srcassets-и-public).

### SVG-картинки

Проект использует `vite-plugin-svgr` для импорта SVG как React-компонентов.

- **Импорт SVG как компонентов**: импортируйте SVG файлы с суффиксом `?react` — они автоматически преобразуются в React-компоненты
- **Статические SVG**: для SEO-картинок и файлов, которые не нужно стилизовать, используйте `/public/`

**Пример:**

```typescript
// Импорт SVG как React компонента
import SVG_logoIcon from '@assets/icons/logo.svg?react';

// Использование
<SVG_logoIcon className={styles.logo} />
```

### Именование при импорте

При импорте изображений используйте префиксы для указания типа файла:

- **SVG**: `SVG_nameIcon` (например, `SVG_logoIcon`, `SVG_closeIcon`)
- **PNG**: `PNG_pngName` (например, `PNG_backgroundImage`, `PNG_heroBanner`)
- **JPG/JPEG**: `JPG_jpgName` (например, `JPG_photoImage`)
- **WEBP**: `WEBP_webpName` (например, `WEBP_optimizedImage`)

**Пример использования:**

```typescript
// SVG как React компонент
import SVG_logoIcon from '@assets/icons/logo.svg?react';

// Растровые изображения через импорт
import PNG_backgroundImage from '@assets/images/background.png';
import JPG_heroPhoto from '@assets/images/hero.jpg';

// Использование SVG компонента
<SVG_logoIcon className={styles.logo} />

// Использование растровых изображений
<img src={PNG_backgroundImage} alt="Background" />
<img src={JPG_heroPhoto} alt="Hero" />

// Или через путь из public/
<img src="/images/hero.jpg" alt="Hero" />
```

### Когда использовать импорт SVG

- Нужно изменять цвет через CSS (`className`, `style`)
- Требуются анимации или интерактивность
- Нужна кастомизация через пропсы
- Важна оптимизация бандла (tree-shaking)

## Импорты

### Порядок импортов

1. React и внешние библиотеки
2. Внутренние модули (алиасы)
3. Относительные импорты
4. Импорт типов (отдельно с `import type`)

**Пример:**

```typescript
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Button } from '@components/UI';
import { useApiData } from '@hooks';
import styles from './Component.module.scss';
import type { FC } from 'react';
```

### Алиасы путей

Проект использует следующие алиасы для удобного импорта (настраиваются в `vite.config.ts`):

- `@/*` - корень src папки
- `@components/*` - компоненты
- `@styles/*` - стили
- `@assets/*` - статические ресурсы проекта (src/assets)
- `@hooks/*` - кастомные хуки
- `@utils/*` - утилитарные функции
- `@types/*` - TypeScript типы

### Правила использования алиасов

- ✅ Всегда используйте алиасы вместо относительных путей для внутренних модулей
- ✅ Относительные пути только для `./Component.module.scss` в самом компоненте
- ✅ Используйте `@components/UI` для UI компонентов
- ✅ Используйте `@components/Feature` для функциональных компонентов

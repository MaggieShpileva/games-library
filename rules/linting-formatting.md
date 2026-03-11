# Форматирование и линтинг

Проект использует три основных инструмента для обеспечения качества кода:

- **Prettier** - автоматическое форматирование кода
- **ESLint** - линтинг JavaScript/TypeScript
- **Stylelint** - линтинг CSS/SCSS

Все инструменты настроены для автоматической работы и интеграции с Git через pre-commit хуки.

---

## Prettier

### Назначение

Prettier автоматически форматирует код, обеспечивая единообразный стиль во всем проекте.

### Основные правила

- **Отступы**: 2 пробела
- **Ширина строки**: 80 символов
- **Кавычки**: одинарные (`'`)
- **JSX кавычки**: двойные (`"`)
- **Точка с запятой**: всегда
- **Trailing comma**: ES5 (где поддерживается)
- **Скобки в стрелочных функциях**: всегда

### Порядок импортов

Рекомендуемый порядок импортов:

1. React и внешние библиотеки (обычные импорты)
2. Внутренние модули (алиасы) - компоненты, хуки, утилиты
3. Относительные импорты (стили компонента)
4. Импорт типов (отдельно с `import type`)

**Пример:**

```typescript
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Button } from '@components/UI';
import { useApiData } from '@hooks';
import styles from './Component.module.scss';
import type { FC } from 'react';
import type { UserData } from '@/types';
```

### Команды

```bash
# Форматировать все файлы
npm run format

# Проверить форматирование без изменений
npm run format:check
```

### Поддерживаемые форматы

- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- JSON (`.json`)
- CSS (`.css`)
- SCSS (`.scss`)
- Markdown (`.md`)

### Игнорируемые файлы

Prettier автоматически игнорирует файлы из `.gitignore` и следующие паттерны:

- `node_modules/`
- `.vite/`
- `build/`
- `dist/`

---

## ESLint

### Назначение

ESLint проверяет код на наличие ошибок, потенциальных проблем и нарушений стиля.

### Конфигурация

Проект использует конфигурацию ESLint для React и TypeScript:

- `@eslint/js` - базовые правила JavaScript
- `typescript-eslint` - правила для TypeScript
- `eslint-plugin-react-hooks` - правила для React хуков
- `eslint-plugin-react-refresh` - правила для Vite HMR
- `eslint-config-prettier` - интеграция с Prettier

### Игнорируемые файлы

- `node_modules/`
- `.vite/`
- `build/`
- `dist/`

### Команды

```bash
# Проверить код на ошибки
npm run lint

# Автоматически исправить исправимые ошибки
npm run lint:fix
```

### Основные правила

ESLint проверяет:

- ✅ Использование хуков React
- ✅ Отсутствие неиспользуемых переменных
- ✅ Правильное использование TypeScript
- ✅ Производительность (Core Web Vitals)
- ✅ Доступность (a11y)
- ✅ Безопасность

---

## Stylelint

### Назначение

Stylelint проверяет CSS/SCSS код на наличие ошибок и обеспечивает единообразный стиль.

### Конфигурация

Проект использует:

- `stylelint-config-standard-scss` - стандартные правила для SCSS
- `stylelint-order` - сортировка свойств CSS

### Правила сортировки свойств

Stylelint автоматически сортирует CSS свойства в следующем порядке:

1. **Отступы** (padding, margin)
2. **Размеры** (width, height)
3. **Позиционирование** (position, top, right, bottom, left, z-index)
4. **Layout** (display, flex, grid)
5. **Границы** (border, border-radius)
6. **Фон** (background, background-color, box-shadow)
7. **Типографика** (color, font, font-size, line-height, text-align)
8. **Анимации** (transition, transform, animation)
9. **Остальные** (в алфавитном порядке)

### Команды

```bash
# Проверить CSS/SCSS файлы
npm run lint:css

# Автоматически исправить ошибки
npm run lint:css:fix
```

### Основные правила

- ✅ Использование camelCase для классов
- ✅ Правильный порядок свойств
- ✅ Запрет неизвестных at-rules (кроме SCSS)
- ✅ Использование legacy синтаксиса для color функций
- ✅ Числовые значения для alpha (не процентные)

---

## Pre-commit хуки (Husky)

### Назначение

Husky настраивает Git хуки для автоматической проверки кода перед коммитом.

### Настройка

Husky автоматически настраивается при установке зависимостей через команду `npm run prepare`.

### Что проверяется

При каждом коммите автоматически запускаются:

1. **ESLint** - проверка JavaScript/TypeScript кода
2. **Prettier** - проверка форматирования
3. **Stylelint** - проверка CSS/SCSS кода

### Работа с хуками

Если проверки не прошли, коммит будет отклонен. Вам нужно:

1. Исправить ошибки вручную
2. Или запустить автоисправление:
   ```bash
   npm run lint:fix
   npm run format
   npm run lint:css:fix
   ```

### Пропуск хуков (не рекомендуется)

В экстренных случаях можно пропустить хуки, но это не рекомендуется:

```bash
# Пропустить все хуки
git commit --no-verify

# ⚠️ Используйте только в крайних случаях!
```

---

## Интеграция с IDE

### VS Code

Для автоматического форматирования при сохранении добавьте в `.vscode/settings.json`:

```json
{
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### Рекомендуемые расширения

- **Prettier** - `esbenp.prettier-vscode`
- **ESLint** - `dbaeumer.vscode-eslint`
- **Stylelint** - `stylelint.vscode-stylelint`

---

## Workflow разработки

### Рекомендуемый процесс

1. **Перед началом работы:**

   ```bash
   npm install
   ```

2. **Во время разработки:**
   - Пишите код
   - IDE автоматически форматирует при сохранении
   - Исправляйте ошибки линтера по мере появления

3. **Перед коммитом:**

   ```bash
   # Проверить все
   npm run lint
   npm run format:check
   npm run lint:css

   # Или исправить автоматически
   npm run format
   npm run lint:fix
   npm run lint:css:fix
   ```

4. **При коммите:**
   - Husky автоматически проверит код
   - Если есть ошибки - коммит будет отклонен
   - Исправьте ошибки и повторите коммит

---

## Исключения из правил

### Отключение правил для конкретной строки

**ESLint:**

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unused = 'value';
```

**Stylelint:**

```scss
/* stylelint-disable-next-line property-no-unknown */
unknown-property: value;
```

### Отключение правил для файла

**ESLint:**

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
```

**Stylelint:**

```scss
/* stylelint-disable */
// весь файл будет игнорироваться
/* stylelint-enable */
```

**⚠️ Используйте исключения только в крайних случаях и с комментарием, объясняющим причину!**

---

## Чеклист для code review

При проверке кода убедитесь, что:

- ✅ Код отформатирован (Prettier)
- ✅ Нет ошибок ESLint
- ✅ Нет ошибок Stylelint
- ✅ Импорты отсортированы правильно
- ✅ CSS свойства отсортированы правильно
- ✅ Нет неиспользуемых переменных
- ✅ Нет закомментированного кода
- ✅ Исключения из правил обоснованы

---

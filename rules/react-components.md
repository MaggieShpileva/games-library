# Правила написания React компонентов

## Общие принципы

### Стрелочные функции

- Все компоненты пишем через `export const Component: FC<Props>`
- Используем именованный экспорт с типом `FC`
- Импортируем `FC` из React для типизации

### Базовая структура компонента

```typescript
import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import clsx from 'clsx';
import { Button } from '@components/UI';
import styles from './ComponentName.module.scss';

type ComponentNameProps = {
  title: string
  children?: ReactNode
  onClick?: () => void
}

export const ComponentName: FC<ComponentNameProps> = ({ title, children, onClick }) => {
  // Хуки всегда в начале
  const [isVisible, setIsVisible] = useState(false)

  // Обработчики событий
  const handleClick = () => {
    onClick?.()
    setIsVisible(!isVisible)
  }

  // Вычисляемые значения с clsx
  const containerClass = clsx(styles.container, {
    [styles.visible]: isVisible
  })

  return (
    <div className={containerClass}>
      <h2 className={styles.title}>{title}</h2>
      {children && (
        <div className={styles.content}>
          {children}
        </div>
      )}
      <Button variant="secondary" onClick={handleClick}>
        {isVisible ? 'Скрыть' : 'Показать'}
      </Button>
    </div>
  )
}
```

## Типизация компонентов

### Props типы

```typescript
// Простые пропсы
type ButtonProps = {
  text: string;
  disabled?: boolean;
  onClick: () => void;
};

// Расширенные пропсы с дженериками
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onItemClick?: (item: T) => void;
};

// Пропсы с HTML атрибутами
type InputProps = {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;
```

### Использование children

```typescript
// Обязательные children
type CardProps = {
  title: string;
  children: React.ReactNode;
};

// Опциональные children
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

// Типизированные children
type TabsProps = {
  children: React.ReactElement<TabProps>[];
};
```

## Хуки и состояние

### Порядок хуков

```typescript
import { FC, useState, useEffect } from 'react'
import { useApiData } from '@/hooks'

type ComponentProps = {
  initialValue: string
}

export const Component: FC<ComponentProps> = ({ initialValue }) => {
  // 1. useState
  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  // 2. useEffect
  useEffect(() => {
    // side effects
  }, [])

  // 3. Кастомные хуки
  const { data, error } = useApiData()

  // 4. Обработчики событий
  const handleSubmit = () => {
    // logic
  }

  // 5. Вычисляемые значения
  const isValid = value.length > 0

  return (
    // JSX
  )
}
```

### Кастомные хуки

```typescript
// hooks/useCounter.ts
import { useCallback, useState } from 'react';

export const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount((prev) => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
};
```

## Условный рендеринг

### Лучшие практики

```typescript
import { FC } from 'react'
import { ErrorMessage, LoadingSpinner, EmptyState, ItemCard } from '@components/UI'
import styles from './Component.module.scss'

type ComponentProps = {
  items: Item[]
  isLoading: boolean
  error?: string
}

export const Component: FC<ComponentProps> = ({ items, isLoading, error }) => {
  // Ранний возврат для ошибок
  if (error) {
    return <ErrorMessage error={error} />
  }

  // Ранний возврат для загрузки
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Ранний возврат для пустого состояния
  if (!items.length) {
    return <EmptyState />
  }

  return (
    <div className={styles.container}>
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
```

### Условные классы

```typescript
import { FC } from 'react'
import clsx from 'clsx'
import styles from './Button.module.scss'

type ButtonProps = {
  variant: 'primary' | 'secondary'
  size: 'small' | 'medium' | 'large'
  disabled?: boolean
  isActive?: boolean
}

export const Button: FC<ButtonProps> = ({ variant, size, disabled, isActive }) => {
  // С clsx (рекомендуемый подход)
  const buttonClass = clsx(
    styles.button,
    styles[variant],
    styles[size],
    {
      [styles.disabled]: disabled,
      [styles.active]: isActive
    }
  )

  return <button className={buttonClass}>...</button>
}
```

## Оптимизация производительности

### React.memo

```typescript
type ExpensiveComponentProps = {
  data: ComplexData
  onUpdate: (data: ComplexData) => void
}

const ExpensiveComponent = React.memo(({ data, onUpdate }: ExpensiveComponentProps) => {
  return (
    // Expensive rendering logic
  )
})

export default ExpensiveComponent
```

### useCallback и useMemo

```typescript
const Component = ({ items, filter }: Props) => {
  // Мемоизация вычислений
  const filteredItems = React.useMemo(() => {
    return items.filter(item => item.name.includes(filter))
  }, [items, filter])

  // Мемоизация функций
  const handleItemClick = React.useCallback((item: Item) => {
    // handle click
  }, [])

  return (
    <div>
      {filteredItems.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  )
}
```

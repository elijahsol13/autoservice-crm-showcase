// lib/rate-limit.ts

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// Хранилище IP-адресов в оперативной памяти сервера
const memoryStore = new Map<string, RateLimitRecord>();

interface RateLimitOptions {
  limit: number;     // Максимальное количество запросов
  windowMs: number;  // Временное окно в миллисекундах
}

export function isRateLimited(ip: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const record = memoryStore.get(ip);

  // Если это первый запрос с этого IP или окно уже прошло
  if (!record || now > record.resetTime) {
    memoryStore.set(ip, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return false; // Доступ разрешен
  }

  // Если лимит превышен
  if (record.count >= options.limit) {
    return true; // Заблокировано!
  }

  // Если запрос в рамках лимита — увеличиваем счетчик
  record.count += 1;
  return false; // Доступ разрешен
}
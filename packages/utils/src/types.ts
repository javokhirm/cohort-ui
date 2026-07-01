/** Integer primary key — the backend uses integer PKs exclusively, never UUIDs. */
export type ID = number;

/** A value that may be null. */
export type Nullable<T> = T | null;

/** Make selected keys of T optional while keeping the rest as-is. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make selected keys of T required while keeping the rest as-is. */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Sort direction accepted by list endpoints. */
export type SortDirection = 'asc' | 'desc';

/** The three supported UI locales. */
export type Locale = 'uz' | 'ru' | 'en';

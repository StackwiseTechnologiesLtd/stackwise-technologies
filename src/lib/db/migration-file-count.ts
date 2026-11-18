/**
 * Number of `migrations/*.sql` files. Bump when adding a migration so dev
 * `ensureSchema()` can skip re-applying embedded DDL after `npm run db:migrate`.
 */
export const MIGRATION_SQL_FILE_COUNT = 32;
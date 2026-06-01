export function normalizeDatabaseUrl(value?: string): string {
  if (!value) {
    throw new Error('DATABASE_URL is required.');
  }

  const databaseUrl = new URL(value);

  if (databaseUrl.searchParams.get('sslmode') === 'require' && !databaseUrl.searchParams.has('uselibpqcompat')) {
    databaseUrl.searchParams.set('uselibpqcompat', 'true');
  }

  return databaseUrl.toString();
}

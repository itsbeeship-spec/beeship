import { execSync } from 'child_process';

console.log('🔄 Executing Prisma generate and db push for Support models...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Prisma generate and db push completed successfully!');
} catch (err) {
  console.error('Error running Prisma CLI:', err.message);
}

import { execSync } from 'child_process';

try {
  console.log('Running npx prisma generate...');
  const genOutput = execSync('npx prisma generate', { cwd: 'C:/BeeShip/backend', encoding: 'utf-8' });
  console.log(genOutput);

  console.log('Running npx prisma db push...');
  const pushOutput = execSync('npx prisma db push --accept-data-loss', { cwd: 'C:/BeeShip/backend', encoding: 'utf-8' });
  console.log(pushOutput);
} catch (err) {
  console.error('Error running Prisma commands:', err.stdout || err.message);
}

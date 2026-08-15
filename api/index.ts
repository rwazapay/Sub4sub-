import { createExpressApp, initServerDatabase } from '../src/server/app';

const app = createExpressApp();

// Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  await initServerDatabase();
  return app(req, res);
}

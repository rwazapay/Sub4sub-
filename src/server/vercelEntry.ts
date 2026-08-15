import { createExpressApp, initServerDatabase } from './app';

const app = createExpressApp();

export default async function handler(req: any, res: any) {
  await initServerDatabase();
  return app(req, res);
}

import { Request, Response } from 'express';

export const greetingHandler = (req: Request, res: Response) => {
  res.json({ message: 'Hello from kindling' });
};

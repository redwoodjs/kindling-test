import { Request, Response } from 'express';

export function greetingHandler(req: Request, res: Response): void {
  res.status(200).json({ message: 'hello world' });
}

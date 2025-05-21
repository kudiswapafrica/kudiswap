import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';


export function GenerateWalletAddress(): string {
  return '0x' + randomBytes(20).toString('hex');
}


export function StrongPin(pin: string): boolean {
  if (!/^\d{6}$/.test(pin)) return false;

  if (/^(\d)\1{5}$/.test(pin)) return false;

  const sequentialPins = ['0123', '1234', '2345', '3456', '4567', '5678', '6789',
                          '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
  if (sequentialPins.includes(pin)) return false;

  return true;
}



export async function hashPin(pin: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(pin, saltRounds);
}
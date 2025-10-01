import { NextResponse } from 'next/server';
import crypto from 'crypto';

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("IMAGEKIT_PRIVATE_KEY is not defined in environment variables.");
}

export async function GET() {
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutes from now

    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    return NextResponse.json({ token, expire, signature });
  } catch (error) {
    console.error('Error generating ImageKit signature:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { setupStorage } from '@/lib/setup-supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await setupStorage();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en setup:', error);
    return NextResponse.json({ error: 'Error en la configuración' }, { status: 500 });
  }
} 
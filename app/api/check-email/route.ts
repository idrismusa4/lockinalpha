import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // The actual implementation would use Clerk's API to check if user exists
    // but Clerk doesn't have a direct method to check just by email without
    // creating security issues. This is a placeholder that always returns false.
    
    // In a real app, you might implement an admin-side check with proper auth
    // or use Clerk's webhooks to maintain your own database of registered emails.
    
    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
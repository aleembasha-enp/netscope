import { NextRequest, NextResponse } from 'next/server';
import { lookupIp, getIpType, resolveDomainToIp } from '@/lib/ip-service';
import { z } from 'zod';

const querySchema = z.object({
  address: z.string().min(1, 'IP address is required').max(128, 'IP address is too long'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressParam = searchParams.get('address');

    const parseResult = querySchema.safeParse({
      address: (addressParam || '').trim(),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: parseResult.error.issues[0]?.message || 'Invalid IP address parameter',
        },
        { status: 400 }
      );
    }

    const { address } = parseResult.data;

    let targetIp = address;
    let resolvedFromDomain: string | undefined;

    // Check if the input is already a valid IP address
    const ipType = getIpType(address);
    if (!ipType) {
      // Attempt domain-to-IP resolution (e.g. "spotify.com" or "spotify")
      const resolved = await resolveDomainToIp(address);
      if (resolved) {
        targetIp = resolved.ip;
        resolvedFromDomain = resolved.resolvedDomain;
      } else {
        return NextResponse.json(
          {
            error: 'Invalid IP or Unresolvable Domain',
            message: `"${address}" is not a valid IP address, and could not be resolved as a domain name. Examples: 8.8.8.8, 1.1.1.1, spotify.com`,
          },
          { status: 400 }
        );
      }
    }

    const result = await lookupIp(targetIp);
    if (resolvedFromDomain) {
      result.resolvedFromDomain = resolvedFromDomain;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during IP tracking';
    return NextResponse.json(
      {
        error: 'IP Lookup Error',
        message,
      },
      { status: 500 }
    );
  }
}

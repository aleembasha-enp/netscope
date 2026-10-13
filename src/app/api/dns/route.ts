import { NextRequest, NextResponse } from 'next/server';
import { lookupDns, normalizeDomain } from '@/lib/dns-service';
import { DnsRecordType } from '@/lib/types';
import { z } from 'zod';

const querySchema = z.object({
  domain: z.string().min(1, 'Domain name is required').max(253, 'Domain name is too long'),
  type: z.enum(['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'SRV', 'ALL']).optional().default('ALL'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get('domain');
    const typeParam = searchParams.get('type') || 'ALL';

    const parseResult = querySchema.safeParse({
      domain: domainParam || '',
      type: typeParam.toUpperCase(),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: parseResult.error.issues[0]?.message || 'Invalid query parameters',
        },
        { status: 400 }
      );
    }

    const { domain, type } = parseResult.data;
    const normalized = normalizeDomain(domain);

    const result = await lookupDns(normalized, type as DnsRecordType);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during DNS resolution';
    
    // Status code determination based on error message
    const isNotFound = message.toLowerCase().includes('not found') || message.toLowerCase().includes('nxdomain');
    const isInvalid = message.toLowerCase().includes('invalid domain');

    return NextResponse.json(
      {
        error: isNotFound ? 'Domain Not Found' : isInvalid ? 'Invalid Domain' : 'DNS Resolution Error',
        message,
      },
      { status: isNotFound ? 404 : isInvalid ? 400 : 502 }
    );
  }
}

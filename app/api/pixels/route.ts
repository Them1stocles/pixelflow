import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { pixelConfigSchema } from '@/lib/validations';
import { encrypt } from '@/lib/crypto';
import { getMerchantFromRequest } from '@/lib/whop-auth';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/pixels
 * Get all pixel configurations for a merchant
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromRequest(req);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all pixel configurations
    const pixelConfigs = await prisma.pixelConfig.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose access tokens in list view
    const sanitized = pixelConfigs.map(config => ({
      ...config,
      accessToken: config.accessToken ? '***' : null,
    }));

    return NextResponse.json({
      success: true,
      data: sanitized,
    });

  } catch (error) {
    console.error('Error fetching pixel configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pixel configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pixels
 * Create a new pixel configuration
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromRequest(req);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    let validatedData;
    try {
      validatedData = pixelConfigSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check if pixel already exists for this merchant and platform
    const existing = await prisma.pixelConfig.findFirst({
      where: {
        merchantId: merchant.id,
        platform: validatedData.platform,
        pixelId: validatedData.pixelId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Pixel configuration already exists for this platform' },
        { status: 409 }
      );
    }

    // Encrypt access token if provided
    const encryptedAccessToken = validatedData.accessToken
      ? encrypt(validatedData.accessToken)
      : null;

    // Create pixel configuration
    const pixelConfig = await prisma.pixelConfig.create({
      data: {
        merchantId: merchant.id,
        platform: validatedData.platform,
        pixelId: validatedData.pixelId,
        accessToken: encryptedAccessToken,
        testEventCode: validatedData.testEventCode,
        isActive: validatedData.isActive ?? true,
        conversionApiEnabled: validatedData.conversionApiEnabled ?? false,
      },
    });

    // Don't return access token
    return NextResponse.json({
      success: true,
      data: {
        ...pixelConfig,
        accessToken: pixelConfig.accessToken ? '***' : null,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating pixel config:', error);
    return NextResponse.json(
      { error: 'Failed to create pixel configuration' },
      { status: 500 }
    );
  }
}

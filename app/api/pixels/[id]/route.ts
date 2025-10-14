import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { updatePixelConfigSchema } from '@/lib/validations';
import { encrypt, decrypt } from '@/lib/crypto';
import { getMerchantFromRequest } from '@/lib/whop-auth';

/**
 * GET /api/pixels/[id]
 * Get a specific pixel configuration
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromRequest(req);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get pixel configuration (verify ownership)
    const pixelConfig = await prisma.pixelConfig.findFirst({
      where: {
        id,
        merchantId: merchant.id,
      },
    });

    if (!pixelConfig) {
      return NextResponse.json(
        { error: 'Pixel configuration not found' },
        { status: 404 }
      );
    }

    // Decrypt access token for display (masked)
    return NextResponse.json({
      success: true,
      data: {
        ...pixelConfig,
        accessToken: pixelConfig.accessToken ? '***' : null,
      },
    });

  } catch (error) {
    console.error('Error fetching pixel config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pixel configuration' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pixels/[id]
 * Update a pixel configuration
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromRequest(req);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if pixel exists and belongs to merchant
    const existing = await prisma.pixelConfig.findFirst({
      where: {
        id,
        merchantId: merchant.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pixel configuration not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();

    let validatedData;
    try {
      validatedData = updatePixelConfigSchema.parse({ ...body, id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }
      throw error;
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.pixelId !== undefined) {
      updateData.pixelId = validatedData.pixelId;
    }

    if (validatedData.accessToken !== undefined) {
      updateData.accessToken = validatedData.accessToken
        ? encrypt(validatedData.accessToken)
        : null;
    }

    if (validatedData.testEventCode !== undefined) {
      updateData.testEventCode = validatedData.testEventCode;
    }

    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }

    if (validatedData.conversionApiEnabled !== undefined) {
      updateData.conversionApiEnabled = validatedData.conversionApiEnabled;
    }

    // Update pixel configuration
    const pixelConfig = await prisma.pixelConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...pixelConfig,
        accessToken: pixelConfig.accessToken ? '***' : null,
      },
    });

  } catch (error) {
    console.error('Error updating pixel config:', error);
    return NextResponse.json(
      { error: 'Failed to update pixel configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pixels/[id]
 * Delete a pixel configuration
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated merchant
    const merchant = await getMerchantFromRequest(req);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if pixel exists and belongs to merchant
    const existing = await prisma.pixelConfig.findFirst({
      where: {
        id,
        merchantId: merchant.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pixel configuration not found' },
        { status: 404 }
      );
    }

    // Delete pixel configuration
    await prisma.pixelConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Pixel configuration deleted',
    });

  } catch (error) {
    console.error('Error deleting pixel config:', error);
    return NextResponse.json(
      { error: 'Failed to delete pixel configuration' },
      { status: 500 }
    );
  }
}

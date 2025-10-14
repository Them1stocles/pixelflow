import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a test merchant
  const merchant = await prisma.merchant.upsert({
    where: { email: 'demo@pixelflow.com' },
    update: {},
    create: {
      whopUserId: 'demo_user_123',
      email: 'demo@pixelflow.com',
      name: 'Demo Merchant',
      subscriptionTier: 'pro',
      monthlyEventLimit: 100000,
      monthlyEventCount: 0,
    },
  });

  console.log('✓ Created demo merchant:', merchant.email);

  // Create some pixel configurations
  const facebookPixel = await prisma.pixelConfig.upsert({
    where: {
      merchantId_platform_pixelId: {
        merchantId: merchant.id,
        platform: 'facebook',
        pixelId: '123456789',
      },
    },
    update: {},
    create: {
      merchantId: merchant.id,
      platform: 'facebook',
      pixelId: '123456789',
      accessToken: 'encrypted_token_here',
      isActive: true,
      conversionApiEnabled: true,
    },
  });

  console.log('✓ Created Facebook pixel configuration');

  // Create some sample tracking events
  const events = await Promise.all([
    prisma.trackingEvent.create({
      data: {
        merchantId: merchant.id,
        eventName: 'PageView',
        eventId: 'event_1',
        eventSource: 'browser',
        eventSourceUrl: 'https://example.com',
        userId: 'user_123',
        status: 'completed',
        facebookStatus: 'success',
        facebookSentAt: new Date(),
      },
    }),
    prisma.trackingEvent.create({
      data: {
        merchantId: merchant.id,
        eventName: 'Purchase',
        eventId: 'event_2',
        eventSource: 'webhook',
        eventSourceUrl: 'https://example.com/checkout',
        userId: 'user_123',
        value: 49.99,
        currency: 'USD',
        status: 'completed',
        facebookStatus: 'success',
        facebookSentAt: new Date(),
      },
    }),
  ]);

  console.log(`✓ Created ${events.length} sample tracking events`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nYou can now login with: demo@pixelflow.com');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

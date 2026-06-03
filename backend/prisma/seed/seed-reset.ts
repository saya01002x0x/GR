import { PrismaClient } from '@prisma/client';
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

async function cleanMinioSeedFiles() {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin123',
    },
    endpoint: process.env.AWS_ENDPOINT || 'http://localhost:9000',
    forcePathStyle: true,
  });
  const BUCKET = process.env.AWS_BUCKET_NAME || 'gr-uploads';

  let isTruncated = true;
  let continuationToken: string | undefined = undefined;

  console.log('🧹 Cleaning MinIO seed files...');
  
  while (isTruncated) {
    const { Contents, IsTruncated, NextContinuationToken } = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'seed/',
        ContinuationToken: continuationToken,
      })
    );

    if (Contents && Contents.length > 0) {
      const deleteParams = {
        Bucket: BUCKET,
        Delete: { Objects: Contents.map(c => ({ Key: c.Key })) },
      };
      await s3Client.send(new DeleteObjectsCommand(deleteParams));
      console.log(`Deleted ${Contents.length} objects.`);
    }

    isTruncated = IsTruncated ?? false;
    continuationToken = NextContinuationToken;
  }
}

async function reset() {
  console.log('🗑️  Resetting database...');
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction([
      // Layer 1: Leaf tables (no FK pointing to them)
      prisma.invoice.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.tierContent.deleteMany(),
      prisma.tierSubscription.deleteMany(),
      prisma.payout.deleteMany(),
      prisma.userInteraction.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.userWarning.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.announcement.deleteMany(),
      prisma.systemSetting.deleteMany(),
      prisma.report.deleteMany(),
      prisma.bookmark.deleteMany(),
      prisma.collection.deleteMany(),
      prisma.follow.deleteMany(),
      prisma.like.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.artworkTag.deleteMany(),
      prisma.artworkImage.deleteMany(),
      
      // Layer 2: Parent tables
      prisma.artistTier.deleteMany(),
      prisma.subscription.deleteMany(),
      prisma.plan.deleteMany(),
      prisma.artwork.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    // Check arguments for --clean-minio
    if (process.argv.includes('--clean-minio')) {
      await cleanMinioSeedFiles();
    }

    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reset();

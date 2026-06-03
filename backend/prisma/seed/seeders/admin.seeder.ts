import { PrismaClient, ReportReason, AnnouncementType, NotificationType } from '@prisma/client';
import { pickRandomElement, pickRandomElements } from '../seed-utils';

export async function seedAdmin(prisma: PrismaClient, userMap: Map<string, string>, artworks: any[]) {
  const allUserIds = Array.from(userMap.values());
  const modId = userMap.get('helper_mod');
  const superAdminId = userMap.get('superadmin');
  
  if (!modId || !superAdminId) return;

  // 1. Create Reports
  const reportReasons = Object.values(ReportReason);
  
  // Create 3 PENDING reports for the Mod to review
  for (let i = 0; i < 3; i++) {
    const artwork = pickRandomElement(artworks);
    const reporterId = pickRandomElement(allUserIds);
    await prisma.report.create({
      data: {
        reason: pickRandomElement(reportReasons),
        description: 'Tôi thấy nội dung này không phù hợp.',
        status: 'PENDING',
        artworkId: artwork.id,
        reporterId: reporterId,
      }
    });
  }

  // Create 2 RESOLVED reports
  for (let i = 0; i < 2; i++) {
    const artwork = pickRandomElement(artworks);
    const reporterId = pickRandomElement(allUserIds);
    await prisma.report.create({
      data: {
        reason: pickRandomElement(reportReasons),
        description: 'Tác phẩm này có dấu hiệu đạo nhái.',
        status: 'RESOLVED',
        artworkId: artwork.id,
        reporterId: reporterId,
        resolvedById: modId,
        resolution: 'Đã kiểm tra và ẩn tác phẩm.',
        resolvedAt: new Date(),
      }
    });
  }

  // 2. Create Announcements
  await prisma.announcement.create({
    data: {
      title: 'Chào mừng đến với hệ thống thử nghiệm!',
      content: 'Hệ thống đang trong giai đoạn Beta. Cảm ơn bạn đã tham gia trải nghiệm.',
      type: AnnouncementType.INFO,
      isActive: true,
      authorId: superAdminId,
    }
  });

  await prisma.announcement.create({
    data: {
      title: 'Bảo trì hệ thống định kỳ',
      content: 'Hệ thống sẽ bảo trì vào lúc 02:00 AM ngày mai để nâng cấp server.',
      type: AnnouncementType.WARNING,
      isActive: true,
      authorId: superAdminId,
    }
  });

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  await prisma.announcement.create({
    data: {
      title: 'Đã hoàn tất bảo trì',
      content: 'Cập nhật hệ thống tìm kiếm AI thành công.',
      type: AnnouncementType.MAINTENANCE,
      isActive: false,
      expiresAt: pastDate,
      authorId: superAdminId,
    }
  });

  // 3. Create Audit Logs
  await prisma.auditLog.create({
    data: {
      action: 'RESOLVE_REPORT',
      details: { reportId: 'sample-report-id', resolution: 'Hidden artwork' },
      actorId: modId,
    }
  });
  
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE_SYSTEM_SETTINGS',
      details: { key: 'maintenance_mode', value: false },
      actorId: superAdminId,
    }
  });

  // 4. Create Notifications for real users
  const realUsers = ['superadmin', 'moderator', 'main_artist', 'test_user1', 'test_user2'].map(u => userMap.get(u)).filter(Boolean);
  
  for (const userId of realUsers) {
    if (!userId) continue;
    
    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SYSTEM,
        title: 'Cập nhật tài khoản',
        message: 'Tài khoản của bạn đã được thiết lập thành công trên môi trường thử nghiệm.',
        isRead: false,
      }
    });

    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.LIKE,
        title: 'Có người thích tác phẩm của bạn',
        message: 'Một người dùng vừa thích tác phẩm mới nhất của bạn.',
        isRead: false,
      }
    });
  }
}

import type { Metadata } from 'next';
import DiscoverPageClient from './DiscoverPageClient';

export const metadata: Metadata = {
  title: 'Khám phá Tác phẩm | Nền tảng nghệ thuật số Lumina',
  description: 'Tìm kiếm đa phương thức và kết nối không giới hạn với các họa sĩ sáng tạo trên toàn thế giới.',
};

export default function DiscoverPage() {
  return <DiscoverPageClient />;
}

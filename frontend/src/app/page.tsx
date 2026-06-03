import { redirect } from 'next/navigation';
import { AppConfig } from '@/utils/AppConfig';

export default function RootPage() {
  redirect(`/${AppConfig.defaultLocale}`);
}

import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to profile settings by default
  redirect('/dashboard/profile');
}

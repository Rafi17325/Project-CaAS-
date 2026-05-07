import { redirect } from 'next/navigation';

// Root page: redirect ke /login
export default function RootPage() {
  redirect('/login');
}

"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useStore from '@/store/useStore';
import { 
  LayoutDashboard, 
  Activity, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Calculator, 
  PieChart, 
  MessageSquare,
  Home,
  Users,
  Leaf
} from 'lucide-react';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { dashboardData } = useStore();

  if (pathname === '/' || pathname === '/onboarding' || pathname.startsWith('/auth')) {
    return null;
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tracking', label: 'Track Log', icon: Activity },
    { href: '/smart-home', label: 'Smart Home', icon: Home },
    { href: '/digital-twin', label: 'Digital Twin', icon: Users },
    { href: '/offsets', label: 'Offsets', icon: Leaf },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/insights', label: 'Insights', icon: Lightbulb },
    { href: '/simulator', label: 'Simulator', icon: Calculator },
    { href: '/reports', label: 'Reports', icon: PieChart },
    { href: '/education', label: 'Learn', icon: BookOpen },
    { href: '/coach', label: 'AI Advisor', icon: MessageSquare },
  ];

  const userObj = dashboardData?.user || {};
  const name = userObj.name || session?.user?.name || 'Eco Warrior';
  const level = userObj.gamification?.level || 1;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoText}>EcoTrack</span>
      </div>
      <ul className={styles.navLinks}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className={`${styles.link} ${isActive ? styles.active : ''}`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.userProfile}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userLevel}>Level {level}</span>
        </div>
      </div>
    </nav>
  );
}

"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Calculator, 
  PieChart, 
  MessageSquare
} from 'lucide-react';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/onboarding') return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tracking', label: 'Track Log', icon: Activity },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/insights', label: 'Insights', icon: Lightbulb },
    { href: '/simulator', label: 'Simulator', icon: Calculator },
    { href: '/reports', label: 'Reports', icon: PieChart },
    { href: '/education', label: 'Learn', icon: BookOpen },
    { href: '/coach', label: 'AI Coach', icon: MessageSquare },
  ];

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
        <div className={styles.avatar}>EW</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Eco Warrior</span>
          <span className={styles.userLevel}>Level 3</span>
        </div>
      </div>
    </nav>
  );
}

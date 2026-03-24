import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { useUnreadMessages } from '../../stores/unreadStore';

// Map each tab to the permissions required to see it
// Empty array = always visible
const tabPermissions: Record<string, string[]> = {
  index: [],
  agenda: ['agenda.view'],
  portfolio: ['portfolio.view'],
  finances: ['finances.view'],
  profile: [],
};

export default function TabLayout() {
  const { t } = useTranslation();
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const unreadCount = useUnreadMessages((s) => s.count);
  const refreshUnread = useUnreadMessages((s) => s.refresh);

  // Poll unread count every 30s
  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  const canSee = (tab: string) => {
    const perms = tabPermissions[tab] || [];
    if (perms.length === 0) return true;
    return hasAnyPermission(perms);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#B5AAA7',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('pro.tabs.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: t('pro.tabs.agenda'),
          href: canSee('agenda') ? '/agenda' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: t('pro.tabs.portfolio'),
          href: canSee('portfolio') ? '/portfolio' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: t('pro.tabs.finances'),
          href: canSee('finances') ? '/finances' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: t('pro.tabs.conversations', 'Conversas'),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('pro.tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

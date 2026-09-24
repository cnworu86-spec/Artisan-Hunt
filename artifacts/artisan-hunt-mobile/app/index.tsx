import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

type Role = 'client' | 'provider';
type AuthMode = 'signin' | 'signup';
type AppTab = 'home' | 'bookings' | 'history' | 'profile';
type ProviderTab = 'dashboard' | 'services' | 'history' | 'profile';

type Account = {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  trade?: string;
};

const ACCOUNTS_KEY = '@artisan-hunt/accounts';
const SESSION_KEY = '@artisan-hunt/session';

const clientCategories = [
  { label: 'Electrical', icon: 'zap' as const },
  { label: 'Carpentry', icon: 'tool' as const },
  { label: 'Painting', icon: 'edit-3' as const },
  { label: 'Hair & beauty', icon: 'scissors' as const },
];

const nearbyArtisans = [
  { name: 'Kwame Mensah', role: 'Plumbing Specialist', rating: '4.8', rate: 'GHC 60/hr', initials: 'K' },
  { name: 'Ama Osei', role: 'Carpentry Specialist', rating: '4.1', rate: 'GHC 70/hr', initials: 'A' },
  { name: 'Kofi Appiah', role: 'Electrical Specialist', rating: '4.2', rate: 'GHC 80/hr', initials: 'K' },
  { name: 'Akua Agyei', role: 'Painting Specialist', rating: '4.3', rate: 'GHC 90/hr', initials: 'A' },
];

const providerRequests = [
  { id: 'BK-582', name: 'Afia Asante', service: 'Painting Specialist', time: 'Tomorrow · 10:00 AM', location: 'Kumasi' },
  { id: 'BK-591', name: 'Yaa Owusu', service: 'Masonry', time: 'Aug 04 · 9:00 AM', location: 'Kumasi' },
];

const providerServices = [
  { name: 'Basic Painting Inspection', price: 'GHC 60', icon: 'clipboard' as const },
  { name: 'Complete Painting Repair', price: 'GHC 100 / hr', icon: 'home' as const },
];

function haptic() {
  void Haptics.selectionAsync();
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.brandLockup}>
      <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
        <Feather name="compass" size={compact ? 16 : 19} color={colors.primaryForeground} />
      </View>
      <Text style={[styles.brandName, { color: colors.foreground }, compact && styles.brandNameCompact]}>
        Artisan Hunt
      </Text>
    </View>
  );
}

function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: color + '12' }, pressed && styles.pressed]}
    >
      <Feather name={icon} size={19} color={color} />
    </Pressable>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (!disabled) haptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: disabled ? colors.border : colors.primary },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: disabled ? colors.mutedForeground : colors.primaryForeground }]}>
        {label}
      </Text>
      {icon ? <Feather name={icon} size={18} color={disabled ? colors.mutedForeground : colors.primaryForeground} /> : null}
    </Pressable>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <IconButton icon="arrow-left" onPress={onPress} accessibilityLabel="Go back" color={colors.foreground} />
  );
}

function BottomTabs({
  active,
  onChange,
  provider = false,
}: {
  active: AppTab | ProviderTab;
  onChange: (tab: AppTab | ProviderTab) => void;
  provider?: boolean;
}) {
  const colors = useColors();
  const tabs: Array<{ key: AppTab | ProviderTab; label: string; icon: keyof typeof Feather.glyphMap }> = provider
    ? [
        { key: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' as const },
        { key: 'services', label: 'Services', icon: 'briefcase' as const },
        { key: 'history', label: 'History', icon: 'clock' as const },
        { key: 'profile', label: 'Profile', icon: 'user' as const },
      ]
    : [
        { key: 'home', label: 'Explore', icon: 'search' as const },
        { key: 'bookings', label: 'Bookings', icon: 'calendar' as const },
        { key: 'history', label: 'History', icon: 'clock' as const },
        { key: 'profile', label: 'Profile', icon: 'user' as const },
      ];
  return (
    <View style={[styles.bottomTabs, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => {
              haptic();
              onChange(tab.key);
            }}
            style={({ pressed }) => [styles.bottomTab, pressed && styles.pressed]}
          >
            <Feather name={tab.icon} size={19} color={selected ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.bottomTabLabel, { color: selected ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WelcomeScreen({ selectedRole, onSelect, onContinue }: { selectedRole: Role | null; onSelect: (role: Role) => void; onContinue: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.welcomeContainer,
        { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 24), paddingBottom: insets.bottom + 28 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeTop}>
        <BrandLockup />
        <View style={[styles.welcomeBadge, { backgroundColor: colors.accent + '33' }]}>
          <Text style={[styles.welcomeBadgeText, { color: colors.accentForeground }]}>MADE IN GHANA</Text>
        </View>
      </View>
      <View style={styles.welcomeHero}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR LOCAL CRAFT, CONNECTED</Text>
        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Find good work.{'\n'}Offer your best.</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
          A trusted home for the people who build, fix, style, and shape Ghana.
        </Text>
      </View>
      <View style={[styles.rolePanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>I AM LOOKING TO...</Text>
        <RoleChoice
          selected={selectedRole === 'client'}
          icon="search"
          title="Explore & Hire"
          detail="Find master artisans and book services"
          onPress={() => onSelect('client')}
        />
        <RoleChoice
          selected={selectedRole === 'provider'}
          icon="award"
          title="Offer Craftsmanship"
          detail="Showcase your skills and manage bookings"
          onPress={() => onSelect('provider')}
        />
      </View>
      <PrimaryButton label="Continue" icon="arrow-right" onPress={onContinue} disabled={!selectedRole} />
      <Text style={[styles.welcomeFootnote, { color: colors.mutedForeground }]}>
        By continuing, you agree to help keep Artisan Hunt a respectful community.
      </Text>
    </ScrollView>
  );
}

function RoleChoice({
  selected,
  icon,
  title,
  detail,
  onPress,
}: {
  selected: boolean;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.roleChoice,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.card },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.roleIcon, { backgroundColor: selected ? colors.primary : colors.muted }]}>
        <Feather name={icon} size={19} color={selected ? colors.primaryForeground : colors.primary} />
      </View>
      <View style={styles.roleCopy}>
        <Text style={[styles.roleTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.roleDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

function AuthScreen({
  role,
  mode,
  onModeChange,
  onBack,
  onSuccess,
}: {
  role: Role;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onBack: () => void;
  onSuccess: (account: Account) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isProvider = role === 'provider';
  const title = mode === 'signin' ? 'Welcome back' : 'Create your account';
  const description =
    mode === 'signin'
      ? `Sign in to your ${isProvider ? 'provider' : 'client'} space.`
      : `Register as a ${isProvider ? 'provider' : 'client'} in the Artisan Hunt community.`;

  async function submit() {
    setError('');
    if (!email.trim() || !email.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.');
      return;
    }
    if (mode === 'signup' && (!firstName.trim() || !lastName.trim() || !phone.trim())) {
      setError('Please complete your personal details.');
      return;
    }
    if (mode === 'signup' && isProvider && !trade.trim()) {
      setError('Tell clients what kind of craft you offer.');
      return;
    }
    setBusy(true);
    try {
      const accounts: Account[] = JSON.parse((await AsyncStorage.getItem(ACCOUNTS_KEY)) ?? '[]') as Account[];
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === 'signin') {
        const existing = accounts.find((item) => item.email === normalizedEmail && item.role === role);
        if (!existing || existing.password !== password) {
          setError('We could not match those details. Create an account first or check your password.');
          return;
        }
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(existing));
        onSuccess(existing);
      } else {
        if (accounts.some((item) => item.email === normalizedEmail && item.role === role)) {
          setError('An account for this role already uses that email.');
          return;
        }
        const account: Account = {
          email: normalizedEmail,
          password,
          role,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          ...(isProvider ? { trade: trade.trim() } : {}),
        };
        await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account));
        onSuccess(account);
      }
    } catch {
      setError('Something went wrong saving your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 18), paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authHeader}>
          <BackButton onPress={onBack} />
          <BrandLockup compact />
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.authIntro}>
          <View style={[styles.authRoleBadge, { backgroundColor: isProvider ? colors.accent + '35' : colors.secondary }]}>
            <Feather name={isProvider ? 'award' : 'search'} size={15} color={isProvider ? colors.accentForeground : colors.primary} />
            <Text style={[styles.authRoleBadgeText, { color: isProvider ? colors.accentForeground : colors.primary }]}>
              {isProvider ? 'Provider account' : 'Client account'}
            </Text>
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.authDescription, { color: colors.mutedForeground }]}>{description}</Text>
        </View>
        <View style={styles.authForm}>
          {mode === 'signup' ? (
            <>
              <View style={styles.formRow}>
                <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="Ama" />
                <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Asante" />
              </View>
              <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="+233 20 000 0000" keyboardType="phone-pad" />
              {isProvider ? <Field label="Your craft" value={trade} onChangeText={setTrade} placeholder="e.g. Painting specialist" /> : null}
            </>
          ) : (
            <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          )}
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry={!showPassword}
            trailing={
              <Pressable onPress={() => setShowPassword((value) => !value)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </Pressable>
            }
          />
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + '13', borderColor: colors.destructive + '40' }]}>
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}
          <Pressable
            disabled={busy}
            onPress={submit}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          >
            {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>
        </View>
        <View style={styles.authSwitch}>
          <Text style={[styles.authSwitchText, { color: colors.mutedForeground }]}>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <Pressable onPress={() => { setError(''); onModeChange(mode === 'signin' ? 'signup' : 'signin'); }}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</Text>
          </Pressable>
        </View>
        <Text style={[styles.demoNote, { color: colors.mutedForeground }]}>
          Your account is stored securely on this device for this preview.
        </Text>
      </KeyboardAwareScrollViewCompat>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  trailing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'email-address' | 'phone-pad' | 'default';
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
  trailing?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.input }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground + 'AA'}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          style={[styles.input, { color: colors.foreground }]}
        />
        {trailing}
      </View>
    </View>
  );
}

function ClientApp({ account, onSignOut }: { account: Account; onSignOut: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AppTab>('home');
  const [booked, setBooked] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const title = useMemo(() => `Good morning, ${account.firstName}`, [account.firstName]);
  return (
    <View style={[styles.appContainer, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12), paddingBottom: insets.bottom + 92 }}
      >
        {tab === 'home' ? (
          <>
            <View style={styles.appHeader}>
              <View>
                <BrandLockup compact />
                <View style={styles.locationLine}>
                  <Feather name="map-pin" size={12} color={colors.primary} />
                  <Text style={[styles.locationText, { color: colors.mutedForeground }]}>Kumasi, Ghana</Text>
                  <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
                </View>
              </View>
              <IconButton icon="bell" onPress={() => {}} accessibilityLabel="Notifications" color={colors.foreground} />
            </View>
            <View style={styles.clientIntro}>
              <Text style={[styles.homeTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.homeSubtitle, { color: colors.mutedForeground }]}>What would you like to get done today?</Text>
            </View>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput placeholder="Search for an artisan or service" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
              <View style={[styles.filterButton, { backgroundColor: colors.primary }]}>
                <Feather name="sliders" size={16} color={colors.primaryForeground} />
              </View>
            </View>
            <SectionHeading title="Browse by craft" action="See all" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {['All', ...clientCategories.map((item) => item.label)].map((label) => {
                const category = clientCategories.find((item) => item.label === label);
                const active = selectedCategory === label;
                return (
                  <Pressable key={label} onPress={() => { haptic(); setSelectedCategory(label); }} style={[styles.categoryPill, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}>
                    {category ? <Feather name={category.icon} size={15} color={active ? colors.primaryForeground : colors.primary} /> : null}
                    <Text style={[styles.categoryPillText, { color: active ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <SectionHeading title="Nearby artisans" action="View map" />
            <View style={styles.listGap}>
              {nearbyArtisans.map((artisan) => {
                const isBooked = booked.includes(artisan.name);
                return (
                  <View key={artisan.name} style={[styles.artisanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>{artisan.initials}</Text>
                    </View>
                    <View style={styles.artisanCopy}>
                      <View style={styles.artisanNameLine}>
                        <Text style={[styles.artisanName, { color: colors.foreground }]}>{artisan.name}</Text>
                        <View style={styles.ratingLine}><Feather name="star" size={12} color={colors.accentForeground} /><Text style={[styles.ratingText, { color: colors.accentForeground }]}>{artisan.rating}</Text></View>
                      </View>
                      <Text style={[styles.artisanRole, { color: colors.mutedForeground }]}>{artisan.role}</Text>
                      <Text style={[styles.artisanLocation, { color: colors.mutedForeground }]}><Feather name="map-pin" size={11} color={colors.mutedForeground} /> 2.4 km away</Text>
                    </View>
                    <View style={styles.artisanAction}>
                      <Text style={[styles.rateText, { color: colors.foreground }]}>{artisan.rate}</Text>
                      <Pressable onPress={() => { haptic(); setBooked((items) => isBooked ? items.filter((item) => item !== artisan.name) : [...items, artisan.name]); }} style={[styles.smallButton, { backgroundColor: isBooked ? colors.secondary : colors.primary }]}>
                        <Text style={[styles.smallButtonText, { color: isBooked ? colors.primary : colors.primaryForeground }]}>{isBooked ? 'Requested' : 'Book'}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : tab === 'bookings' ? (
          <ClientListScreen title="My bookings" subtitle="Track upcoming work and requests." items={booked.length ? booked : ['Painting Specialist', 'Electrical Specialist']} status="Pending" />
        ) : tab === 'history' ? (
          <ClientListScreen title="Project history" subtitle="Your completed work with Artisan Hunt." items={['Painting Specialist', 'Baker', 'Hairdressing']} status="Completed" />
        ) : (
          <ProfileScreen account={account} onSignOut={onSignOut} />
        )}
      </ScrollView>
      <BottomTabs active={tab} onChange={(next) => setTab(next as AppTab)} />
    </View>
  );
}

function SectionHeading({ title, action }: { title: string; action: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <Pressable onPress={() => {}}>
        <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

function ClientListScreen({ title, subtitle, items, status }: { title: string; subtitle: string; items: string[]; status: string }) {
  const colors = useColors();
  return (
    <View style={styles.pagePadding}>
      <BrandLockup compact />
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.summaryEyebrow, { color: colors.primaryForeground + 'AA' }]}>ACTIVE PROJECTS</Text>
        <Text style={[styles.summaryNumber, { color: colors.primaryForeground }]}>{items.length}</Text>
        <Text style={[styles.summaryCopy, { color: colors.primaryForeground + 'CC' }]}>Keep your next project moving.</Text>
      </View>
      <View style={styles.listGap}>
        {items.map((item, index) => (
          <View key={`${item}-${index}`} style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.bookingIcon, { backgroundColor: colors.secondary }]}><Feather name="briefcase" size={18} color={colors.primary} /></View>
            <View style={styles.bookingCopy}><Text style={[styles.bookingTitle, { color: colors.foreground }]}>{item}</Text><Text style={[styles.bookingMeta, { color: colors.mutedForeground }]}>Schedule · To be confirmed</Text><Text style={[styles.bookingMeta, { color: colors.mutedForeground }]}>Artisan Hunt marketplace</Text></View>
            <View style={[styles.statusPill, { backgroundColor: status === 'Completed' ? colors.secondary : colors.accent + '30' }]}><Text style={[styles.statusText, { color: status === 'Completed' ? colors.primary : colors.accentForeground }]}>{status}</Text></View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProviderApp({ account, onSignOut }: { account: Account; onSignOut: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ProviderTab>('dashboard');
  const [receivingJobs, setReceivingJobs] = useState(true);
  const [requests, setRequests] = useState(providerRequests);
  const [services, setServices] = useState<Array<{ name: string; price: string; icon: keyof typeof Feather.glyphMap }>>(providerServices);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState('');
  const [newPrice, setNewPrice] = useState('');

  function addService() {
    if (!newService.trim() || !newPrice.trim()) return;
    setServices((items) => [...items, { name: newService.trim(), price: `GHC ${newPrice.trim()}`, icon: 'plus-circle' as const }]);
    setNewService('');
    setNewPrice('');
    setShowAddService(false);
  }

  return (
    <View style={[styles.appContainer, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12), paddingBottom: insets.bottom + 92 }}
      >
        {tab === 'dashboard' ? (
          <View style={styles.pagePadding}>
            <View style={styles.providerHeader}>
              <View><BrandLockup compact /><Text style={[styles.providerGreeting, { color: colors.foreground }]}>Your craft, at work.</Text></View>
              <IconButton icon="settings" onPress={() => setTab('profile')} accessibilityLabel="Settings" color={colors.foreground} />
            </View>
            <View style={[styles.receivingCard, { backgroundColor: colors.primary }]}>
              <View style={styles.receivingCopy}><Text style={[styles.receivingTitle, { color: colors.primaryForeground }]}>Receiving jobs</Text><Text style={[styles.receivingSubtitle, { color: colors.primaryForeground + 'BB' }]}>Let clients discover your services</Text></View>
              <Switch value={receivingJobs} onValueChange={(value) => { haptic(); setReceivingJobs(value); }} trackColor={{ false: colors.primaryForeground + '35', true: colors.primaryForeground + '60' }} thumbColor={colors.primaryForeground} />
            </View>
            <View style={styles.providerStats}><Stat label="Active jobs" value="3" icon="briefcase" /><Stat label="Completed" value="0" icon="check-circle" /><Stat label="Rating" value="4.8" icon="star" /></View>
            <SectionHeading title="New requests" action={`${requests.length} waiting`} />
            <View style={styles.listGap}>
              {requests.length ? requests.map((request) => (
                <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.requestTop}><Text style={[styles.requestId, { color: colors.mutedForeground }]}>{request.id}</Text><Text style={[styles.requestTime, { color: colors.mutedForeground }]}>{request.time}</Text></View>
                  <Text style={[styles.requestName, { color: colors.foreground }]}>{request.name}</Text>
                  <Text style={[styles.requestService, { color: colors.mutedForeground }]}>{request.service} · {request.location}</Text>
                  <View style={styles.requestActions}>
                    <Pressable onPress={() => setRequests((items) => items.filter((item) => item.id !== request.id))} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryButtonText, { color: colors.destructive }]}>Decline</Text></Pressable>
                    <Pressable onPress={() => setRequests((items) => items.filter((item) => item.id !== request.id))} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>Accept request</Text></Pressable>
                  </View>
                </View>
              )) : <EmptyState icon="check-circle" title="You’re all caught up" detail="New client requests will appear here." />}
            </View>
          </View>
        ) : tab === 'services' ? (
          <View style={styles.pagePadding}>
            <View style={styles.pageHeaderRow}><View><BrandLockup compact /><Text style={[styles.pageTitle, { color: colors.foreground }]}>My services</Text></View><IconButton icon="plus" onPress={() => setShowAddService((value) => !value)} accessibilityLabel="Add service" color={colors.primary} /></View>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Manage the professional services you showcase.</Text>
            {showAddService ? <View style={[styles.addServiceCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Field label="Service name" value={newService} onChangeText={setNewService} placeholder="e.g. Interior painting" /><Field label="Starting price" value={newPrice} onChangeText={setNewPrice} placeholder="80 / hr" keyboardType="default" /><PrimaryButton label="Add service" onPress={addService} icon="check" /></View> : null}
            <View style={styles.listGap}>{services.map((service) => <View key={service.name} style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.serviceIcon, { backgroundColor: colors.secondary }]}><Feather name={service.icon} size={17} color={colors.primary} /></View><View style={styles.serviceCopy}><Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text><Text style={[styles.servicePrice, { color: colors.mutedForeground }]}>{service.price}</Text></View><IconButton icon="trash-2" onPress={() => setServices((items) => items.filter((item) => item.name !== service.name))} accessibilityLabel={`Remove ${service.name}`} color={colors.destructive} /></View>)}</View>
          </View>
        ) : tab === 'history' ? (
          <View style={styles.pagePadding}><BrandLockup compact /><Text style={[styles.pageTitle, { color: colors.foreground }]}>Work history</Text><Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Review your completed jobs and earnings.</Text><View style={[styles.summaryCard, { backgroundColor: colors.accent }]}><Text style={[styles.summaryEyebrow, { color: colors.accentForeground + 'AA' }]}>TOTAL EARNINGS</Text><Text style={[styles.summaryNumber, { color: colors.accentForeground }]}>GHC 0</Text><Text style={[styles.summaryCopy, { color: colors.accentForeground + 'CC' }]}>Complete your first job to see your history grow.</Text></View><EmptyState icon="clock" title="No completed jobs yet" detail="Accepted work will move here when you mark it complete." /></View>
        ) : (
          <ProfileScreen account={account} onSignOut={onSignOut} provider />
        )}
      </ScrollView>
      <BottomTabs active={tab} onChange={(next) => setTab(next as ProviderTab)} provider />
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={icon} size={16} color={colors.primary} /><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function ProfileScreen({ account, onSignOut, provider = false }: { account: Account; onSignOut: () => void; provider?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.pagePadding}>
      <BrandLockup compact />
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Your profile</Text>
      <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Keep your details current for a better experience.</Text>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: provider ? colors.accent : colors.secondary }]}><Text style={[styles.profileAvatarText, { color: provider ? colors.accentForeground : colors.primary }]}>{account.firstName.charAt(0)}{account.lastName.charAt(0)}</Text></View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{account.firstName} {account.lastName}</Text>
        <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>{provider ? account.trade ?? 'Service provider' : 'Client'} · Joined today</Text>
        <View style={styles.profileDetails}><DetailRow label="Email" value={account.email} /><DetailRow label="Phone" value={account.phone} />{provider ? <DetailRow label="Availability" value="Receiving jobs" /> : <DetailRow label="Preferred payment" value="Mobile Money" />}</View>
      </View>
      <Pressable onPress={onSignOut} style={[styles.signOutButton, { borderColor: colors.border }]}><Feather name="log-out" size={17} color={colors.destructive} /><Text style={[styles.signOutText, { color: colors.destructive }]}>Sign out</Text></Pressable>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.detailRow}><Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text></View>;
}

function EmptyState({ icon, title, detail }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string }) {
  const colors = useColors();
  return <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={22} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<'welcome' | 'auth' | 'app'>('welcome');
  const [role, setRole] = useState<Role | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((session) => {
        if (session) {
          const parsed = JSON.parse(session) as Account;
          setAccount(parsed);
          setRole(parsed.role);
          setScreen('app');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.loadingScreen}><ActivityIndicator size="small" color="#0F4C3A" /></View>;
  }
  if (screen === 'welcome') {
    return <WelcomeScreen selectedRole={role} onSelect={setRole} onContinue={() => { setAuthMode('signin'); setScreen('auth'); }} />;
  }
  if (screen === 'auth' && role) {
    return <AuthScreen role={role} mode={authMode} onModeChange={setAuthMode} onBack={() => setScreen('welcome')} onSuccess={(nextAccount) => { setAccount(nextAccount); setScreen('app'); }} />;
  }
  if (!account) return null;
  return account.role === 'provider' ? <ProviderApp account={account} onSignOut={async () => { await AsyncStorage.removeItem(SESSION_KEY); setAccount(null); setRole(null); setScreen('welcome'); }} /> : <ClientApp account={account} onSignOut={async () => { await AsyncStorage.removeItem(SESSION_KEY); setAccount(null); setRole(null); setScreen('welcome'); }} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5ED' },
  welcomeContainer: { flexGrow: 1, paddingHorizontal: 22, gap: 24 },
  welcomeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  brandNameCompact: { fontSize: 15 },
  welcomeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  welcomeBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.1 },
  welcomeHero: { paddingTop: 34, gap: 12 },
  eyebrow: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  welcomeTitle: { fontSize: 42, lineHeight: 45, fontFamily: 'Inter_700Bold', letterSpacing: -1.8 },
  welcomeSubtitle: { maxWidth: 330, fontSize: 15, lineHeight: 23, fontFamily: 'Inter_400Regular' },
  rolePanel: { borderWidth: 1, borderRadius: 24, padding: 16, gap: 10 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  roleChoice: { flexDirection: 'row', alignItems: 'center', padding: 13, borderWidth: 1, borderRadius: 16, gap: 12 },
  roleIcon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  roleCopy: { flex: 1, gap: 3 },
  roleTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  roleDetail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  primaryButton: { minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryButtonText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  welcomeFootnote: { fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 18 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  authHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  headerSpacer: { width: 40 },
  authIntro: { paddingHorizontal: 22, paddingTop: 38, gap: 12 },
  authRoleBadge: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  authRoleBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.7 },
  authTitle: { fontSize: 32, lineHeight: 36, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  authDescription: { fontSize: 15, lineHeight: 22 },
  authForm: { paddingHorizontal: 22, paddingTop: 28, gap: 14 },
  formRow: { flexDirection: 'row', gap: 10 },
  fieldGroup: { flex: 1, gap: 7 },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1, textTransform: 'uppercase' },
  inputWrap: { minHeight: 53, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 0 },
  errorBox: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_500Medium' },
  authSwitch: { paddingTop: 25, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  authSwitchText: { fontSize: 13 },
  linkText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  demoNote: { textAlign: 'center', fontSize: 11, paddingHorizontal: 40, paddingTop: 28, lineHeight: 16 },
  appContainer: { flex: 1 },
  appHeader: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 10 },
  locationText: { fontSize: 11 },
  clientIntro: { paddingHorizontal: 20, paddingTop: 34, gap: 5 },
  homeTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  homeSubtitle: { fontSize: 14 },
  searchBox: { marginHorizontal: 20, marginTop: 20, minHeight: 54, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 15, gap: 10 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  filterButton: { height: 42, width: 42, marginRight: 5, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 26, paddingBottom: 13 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  sectionAction: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  horizontalList: { paddingHorizontal: 20, gap: 8 },
  categoryPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  listGap: { paddingHorizontal: 20, gap: 10 },
  artisanCard: { borderWidth: 1, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  artisanCopy: { flex: 1, gap: 3 },
  artisanNameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  artisanName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  ratingLine: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  artisanRole: { fontSize: 11 },
  artisanLocation: { fontSize: 10 },
  artisanAction: { alignItems: 'flex-end', gap: 7 },
  rateText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  smallButton: { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  smallButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  bottomTabs: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 19 },
  bottomTab: { alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 70 },
  bottomTabLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  pagePadding: { paddingHorizontal: 20, paddingTop: 4 },
  pageTitle: { fontSize: 29, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, paddingTop: 28 },
  pageSubtitle: { fontSize: 14, lineHeight: 21, paddingTop: 6, paddingBottom: 23 },
  summaryCard: { borderRadius: 22, padding: 19, marginBottom: 8 },
  summaryEyebrow: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.3 },
  summaryNumber: { fontSize: 36, fontFamily: 'Inter_700Bold', paddingTop: 5 },
  summaryCopy: { fontSize: 12, paddingTop: 2 },
  bookingCard: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  bookingIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bookingCopy: { flex: 1, gap: 3 },
  bookingTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  bookingMeta: { fontSize: 10 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  providerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  providerGreeting: { fontSize: 26, fontFamily: 'Inter_700Bold', paddingTop: 26, letterSpacing: -0.7 },
  receivingCard: { marginTop: 24, borderRadius: 21, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  receivingCopy: { gap: 4 },
  receivingTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  receivingSubtitle: { fontSize: 11 },
  providerStats: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 11, gap: 6 },
  statValue: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10 },
  requestCard: { borderWidth: 1, borderRadius: 19, padding: 14 },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between' },
  requestId: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  requestTime: { fontSize: 10 },
  requestName: { fontSize: 16, fontFamily: 'Inter_700Bold', paddingTop: 13 },
  requestService: { fontSize: 12, paddingTop: 4 },
  requestActions: { flexDirection: 'row', gap: 8, paddingTop: 15, justifyContent: 'flex-end' },
  secondaryButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8 },
  secondaryButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  serviceCard: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  serviceIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  serviceCopy: { flex: 1, gap: 3 },
  serviceName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  servicePrice: { fontSize: 11 },
  pageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addServiceCard: { borderWidth: 1, borderRadius: 19, padding: 14, gap: 12, marginBottom: 12 },
  profileCard: { borderWidth: 1, borderRadius: 22, padding: 20, alignItems: 'center', marginTop: 5 },
  profileAvatar: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 23, fontFamily: 'Inter_700Bold' },
  profileName: { fontSize: 20, fontFamily: 'Inter_700Bold', paddingTop: 13 },
  profileRole: { fontSize: 12, paddingTop: 4 },
  profileDetails: { width: '100%', paddingTop: 23, gap: 13 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { fontSize: 11 },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  signOutButton: { borderWidth: 1, borderRadius: 15, minHeight: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 14 },
  signOutText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  emptyState: { borderWidth: 1, borderRadius: 20, padding: 28, alignItems: 'center', marginTop: 5 },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', paddingTop: 14 },
  emptyDetail: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingTop: 6, maxWidth: 250 },
});
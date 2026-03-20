import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { colors, radii, spacing } from '../../theme/colors';
import { Skeleton } from '../ui/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const BANNER_HEIGHT = 160;

interface BannerItem {
  id: string;
  imageUrl: string;
}

const MOCK_BANNERS: BannerItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800',
  },
];

interface BannerCarouselProps {
  isLoading?: boolean;
}

export function BannerCarousel({ isLoading = false }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (BANNER_WIDTH + spacing.md));
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Skeleton width={BANNER_WIDTH} height={BANNER_HEIGHT} borderRadius={radii.xl} />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={MOCK_BANNERS}
        horizontal
        pagingEnabled
        snapToInterval={BANNER_WIDTH + spacing.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.bannerWrapper}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.bannerImage}
              contentFit="cover"
              transition={300}
            />
          </View>
        )}
      />
      <View style={styles.pagination}>
        {MOCK_BANNERS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
});

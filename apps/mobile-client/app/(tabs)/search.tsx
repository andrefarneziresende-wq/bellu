import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, ScrollView, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { toast } from '../../components/ui/Toast';
import { categoriesApi, professionalsApi } from '../../services/api';
import type { Professional, Category } from '@beauty/shared-types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyACtVOd9e3hazjcTbkQT6V5VYoZ2dmt-9c';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

type SortOption = 'nearest' | 'rating';

const DEFAULT_REGION: Region = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [results, setResults] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searched, setSearched] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [nearbyResults, setNearbyResults] = useState<Professional[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [addressQuery, setAddressQuery] = useState('');
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isGeoSearch, setIsGeoSearch] = useState(false); // true when results came from address selection

  const getCategoryName = useCallback((cat: Category) => {
    const tr = cat.translations?.find((t) => t.locale === i18n.language);
    return tr?.name || cat.translations?.[0]?.name || cat.slug;
  }, [i18n.language]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res.data);
      } catch (_) {}
    };
    fetchCategories();
  }, []);

  // Request location permission
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserLocation(coords);
        setRegion({
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (_) {}
    };
    getLocation();
  }, []);

  // Google Places Autocomplete (works in both list and map mode)
  useEffect(() => {
    if (isGeoSearch) return; // Skip autocomplete after address was selected
    const currentQuery = showMap ? addressQuery : query;
    if (currentQuery.trim().length < 3) {
      setPlacePredictions([]);
      setShowPredictions(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const locationBias = userLocation
          ? `&location=${userLocation.lat},${userLocation.lng}&radius=50000`
          : '';
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(currentQuery.trim())}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR${locationBias}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.predictions) {
          setPlacePredictions(data.predictions);
          setShowPredictions(true);
        }
      } catch (_) {
        setPlacePredictions([]);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [addressQuery, query, showMap, userLocation, isGeoSearch]);

  // Select a place from autocomplete (works in both list and map mode)
  const handleSelectPlace = useCallback(async (placeId: string, description: string) => {
    setIsGeoSearch(true); // Prevent text search and autocomplete from firing
    if (showMap) {
      setAddressQuery(description);
    } else {
      setQuery(description);
    }
    setShowPredictions(false);
    setPlacePredictions([]);
    Keyboard.dismiss();

    const setLoadingState = showMap ? setNearbyLoading : setLoading;
    setLoadingState(true);
    if (!showMap) setSearched(true);

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      // Try Geocoding API first (most reliable for addresses)
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const loc = data.results?.[0]?.geometry?.location;
        if (loc) {
          lat = loc.lat;
          lng = loc.lng;
        }
      } catch (_) {}

      // Fallback: Place Details API
      if (lat === null || lng === null) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
          const res = await fetch(url);
          const data = await res.json();
          const loc = data.result?.geometry?.location;
          if (loc) {
            lat = loc.lat;
            lng = loc.lng;
          }
        } catch (_) {}
      }

      // Fallback 2: Find Place from Text
      if (lat === null || lng === null) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(description)}&inputtype=textquery&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
          const res = await fetch(url);
          const data = await res.json();
          const loc = data.candidates?.[0]?.geometry?.location;
          if (loc) {
            lat = loc.lat;
            lng = loc.lng;
          }
        } catch (_) {}
      }

      // Fallback 3: expo-location
      if (lat === null || lng === null) {
        try {
          const geocoded = await Location.geocodeAsync(description);
          if (geocoded.length > 0) {
            lat = geocoded[0].latitude;
            lng = geocoded[0].longitude;
          }
        } catch (_) {}
      }

      if (lat !== null && lng !== null) {
        // Fetch professionals near this location
        const profRes = await professionalsApi.list({
          lat,
          lng,
          ...(activeFilter ? { categoryId: activeFilter } : {}),
        });

        if (showMap) {
          const newRegion: Region = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 500);
          setNearbyResults(profRes.data);
        } else {
          // In list mode, show the results from geo search
          setResults(profRes.data);
          // Update user location reference for distance calc
          setUserLocation({ lat, lng });
        }
      } else {
        toast(t('search.addressNotFound'), 'warning');
      }
    } catch (_) {
      toast(t('search.addressNotFound'), 'warning');
    } finally {
      setLoadingState(false);
    }
  }, [activeFilter, t, showMap]);

  // Text search with debounce (name mode, list view)
  useEffect(() => {
    if (showMap) return;
    if (isGeoSearch) return; // Results came from address selection, don't overwrite
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        if (query.trim().length === 0) {
          setResults([]);
          setSearched(false);
        }
        return;
      }

      setLoading(true);
      setSearched(true);
      try {
        const res = await professionalsApi.search(query.trim());
        setResults(res.data);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [query, showMap, isGeoSearch]);

  // Fetch nearby when map region changes
  useEffect(() => {
    if (!showMap) return;
    const timeout = setTimeout(async () => {
      setNearbyLoading(true);
      try {
        const res = await professionalsApi.list({
          lat: region.latitude,
          lng: region.longitude,
          ...(activeFilter ? { categoryId: activeFilter } : {}),
        });
        setNearbyResults(res.data);
      } catch (_) {
        setNearbyResults([]);
      } finally {
        setNearbyLoading(false);
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [showMap, region.latitude, region.longitude, activeFilter]);


  const handleCenterOnUser = () => {
    if (!userLocation) {
      toast(t('search.locationDenied'), 'warning');
      return;
    }
    const newRegion: Region = {
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  // Calculate distance for each result
  const refLat = showMap ? region.latitude : (userLocation?.lat ?? 0);
  const refLng = showMap ? region.longitude : (userLocation?.lng ?? 0);

  const withDistance = useCallback(
    (items: Professional[]) =>
      items.map((p) => ({
        ...p,
        distance:
          p.latitude && p.longitude && refLat
            ? haversineKm(refLat, refLng, Number(p.latitude), Number(p.longitude))
            : null,
      })),
    [refLat, refLng],
  );

  // Sort results
  const sortedResults = useMemo(() => {
    const items = showMap ? withDistance(nearbyResults) : withDistance(results);
    switch (sortBy) {
      case 'nearest':
        return [...items].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      case 'rating':
        return [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return items;
    }
  }, [showMap, nearbyResults, results, sortBy, withDistance]);

  const filterChips = categories.map((c) => ({ id: c.id, name: getCategoryName(c) }));

  const sortOptions: { key: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'nearest', label: t('search.sortNearest'), icon: 'navigate' },
    { key: 'rating', label: t('search.sortRating'), icon: 'star' },
  ];

  const formatDistance = (km: number | null) => {
    if (km === null) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar + Map toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name={showMap ? 'location-outline' : 'search-outline'} size={20} color={colors.textSecondary} />
          {showMap ? (
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.addressPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={addressQuery}
              onChangeText={(text) => {
                setAddressQuery(text);
                setIsGeoSearch(false); // User is typing again, re-enable autocomplete
                if (text.length < 3) setShowPredictions(false);
              }}
              returnKeyType="search"
            />
          ) : (
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setIsGeoSearch(false); // User is typing again, re-enable autocomplete
              }}
            />
          )}
          {(showMap ? addressQuery.length > 0 : query.length > 0) && (
            <Pressable onPress={() => {
              if (showMap) {
                setAddressQuery('');
              } else {
                setQuery('');
                setResults([]);
                setSearched(false);
              }
              setIsGeoSearch(false);
              setShowPredictions(false);
            }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.mapToggle, showMap && styles.mapToggleActive]}
          onPress={() => {
            if (showMap) {
              // Switching to list: keep address, results, and location reference
              if (addressQuery) setQuery(addressQuery);
              if (nearbyResults.length > 0) {
                setResults(nearbyResults);
                setSearched(true);
              }
              // Update location reference so distance calculates from the searched address
              setUserLocation({ lat: region.latitude, lng: region.longitude });
              setIsGeoSearch(true);
            } else {
              // Switching to map: keep query as address
              if (query) setAddressQuery(query);
              if (results.length > 0) setNearbyResults(results);
            }
            setShowMap(!showMap);
          }}
        >
          <Ionicons name={showMap ? 'list' : 'map'} size={22} color={showMap ? colors.white : colors.primary} />
        </Pressable>
      </View>

      {/* Place Autocomplete Suggestions */}
      {showPredictions && placePredictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          {placePredictions.map((prediction) => (
            <Pressable
              key={prediction.place_id}
              style={styles.predictionRow}
              onPress={() => handleSelectPlace(prediction.place_id, prediction.description)}
            >
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.predictionMain} numberOfLines={1}>
                  {prediction.structured_formatting.main_text}
                </Text>
                <Text style={styles.predictionSecondary} numberOfLines={1}>
                  {prediction.structured_formatting.secondary_text}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Filter chips + Sort */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
          {filterChips.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.chip, activeFilter === item.id && styles.chipActive]}
              onPress={() => setActiveFilter(activeFilter === item.id ? null : item.id)}
            >
              <Text style={[styles.chipText, activeFilter === item.id && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sort options row */}
        {!showMap && searched && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
            {sortOptions.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
                onPress={() => setSortBy(opt.key)}
              >
                <Ionicons name={opt.icon} size={14} color={sortBy === opt.key ? colors.white : colors.textSecondary} />
                <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {showMap ? (
        /* Map View */
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {nearbyResults.map((pro) => {
              if (!pro.latitude || !pro.longitude) return null;
              return (
                <Marker
                  key={pro.id}
                  coordinate={{ latitude: Number(pro.latitude), longitude: Number(pro.longitude) }}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <Ionicons name="cut" size={16} color={colors.white} />
                    </View>
                    <View style={styles.markerTail} />
                  </View>
                  <Callout tooltip onPress={() => router.push(`/professional/${pro.id}`)}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutName} numberOfLines={1}>{pro.businessName}</Text>
                      <View style={styles.calloutRatingRow}>
                        <Text style={styles.calloutStar}>&#9733;</Text>
                        <Text style={styles.calloutRating}>{pro.rating?.toFixed(1) ?? '0.0'}</Text>
                        <Text style={styles.calloutReviews}>({pro.totalReviews ?? 0})</Text>
                      </View>
                      {pro.address ? (
                        <Text style={styles.calloutAddress} numberOfLines={1}>{pro.address}</Text>
                      ) : null}
                      <Text style={styles.calloutTap}>{t('search.tapToView')}</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>

          {/* Center on user button */}
          <Pressable style={styles.centerBtn} onPress={handleCenterOnUser}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </Pressable>

          {/* Nearby count */}
          {nearbyLoading ? (
            <View style={styles.mapOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>
                {t('search.nearbyCount', { count: nearbyResults.length })}
              </Text>
            </View>
          )}

          {/* Bottom card list (horizontal) */}
          {sortedResults.length > 0 && (
            <FlatList
              horizontal
              data={sortedResults}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              style={styles.mapCardList}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push(`/professional/${item.id}`)} style={styles.mapCard}>
                  <Image
                    source={{ uri: item.avatarPhoto || 'https://picsum.photos/seed/default/100/100' }}
                    style={styles.mapCardImage}
                    contentFit="cover"
                  />
                  <View style={styles.mapCardInfo}>
                    <Text style={styles.mapCardName} numberOfLines={1}>{item.businessName}</Text>
                    <Text style={styles.mapCardAddress} numberOfLines={1}>{item.address}</Text>
                    <View style={styles.mapCardFooter}>
                      <View style={styles.ratingRow}>
                        <Text style={styles.star}>&#9733;</Text>
                        <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '0.0'}</Text>
                      </View>
                      {item.distance !== null && (
                        <View style={styles.distanceBadgeSm}>
                          <Text style={styles.distanceTextSm}>{formatDistance(item.distance)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : (
        /* List View */
        <>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              {searched && (
                <Text style={styles.resultCount}>{t('search.results', { count: sortedResults.length })}</Text>
              )}
              {searched && sortedResults.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl }}>
                  <Ionicons name="search-outline" size={64} color={colors.border} />
                  <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg }}>
                    {t('search.noResults')}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={sortedResults}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.resultList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index < 10 ? 100 + index * 60 : 0)}>
                      <Pressable onPress={() => router.push(`/professional/${item.id}`)}>
                        <Card style={styles.resultCard}>
                          <Image source={{ uri: item.avatarPhoto || 'https://picsum.photos/seed/default/100/100' }} style={styles.resultImage} contentFit="cover" transition={200} />
                          <View style={styles.resultInfo}>
                            <Text style={styles.resultName}>{item.businessName}</Text>
                            <Text style={styles.resultCategory} numberOfLines={1}>{item.address}</Text>
                            <View style={styles.resultFooter}>
                              <View style={styles.ratingRow}>
                                <Text style={styles.star}>&#9733;</Text>
                                <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '0.0'}</Text>
                                <Text style={styles.reviewCount}>({item.totalReviews ?? 0})</Text>
                              </View>
                              {item.distance !== null && (
                                <View style={styles.distanceBadge}>
                                  <Ionicons name="navigate-outline" size={12} color={colors.white} />
                                  <Text style={styles.distanceBadgeText}>{formatDistance(item.distance)}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </Card>
                      </Pressable>
                    </Animated.View>
                  )}
                />
              )}
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radii.lg, paddingHorizontal: spacing.lg, height: 48, gap: spacing.sm, elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
  mapToggle: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  mapToggleActive: { backgroundColor: colors.primary },
  predictionsContainer: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radii.lg, elevation: 4, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, overflow: 'hidden', zIndex: 10 },
  predictionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.sm },
  predictionMain: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  predictionSecondary: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 1 },
  chipList: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  chipTextActive: { color: colors.white },
  sortRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.md, gap: spacing.sm },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortChipText: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium },
  sortChipTextActive: { color: colors.white },
  resultCount: { fontSize: typography.sizes.sm, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  resultList: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  resultCard: { flexDirection: 'row', marginBottom: spacing.md, overflow: 'hidden' },
  resultImage: { width: 90, height: 90, borderTopLeftRadius: radii.lg, borderBottomLeftRadius: radii.lg },
  resultInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  resultName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  resultCategory: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  star: { color: colors.accent, fontSize: 14 },
  ratingText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  reviewCount: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primaryLight || '#F5E6E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  distanceBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.white },
  distanceText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.white },
  distanceBadgeSm: { backgroundColor: colors.primaryLight || '#F5E6E0', paddingHorizontal: 6, paddingVertical: 1, borderRadius: radii.full },
  distanceTextSm: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.white },
  // Map styles
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  centerBtn: { position: 'absolute', top: spacing.md, right: spacing.lg, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  mapOverlay: { position: 'absolute', top: spacing.md, left: spacing.lg, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, elevation: 4, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  mapOverlayText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
  markerContainer: { alignItems: 'center' },
  marker: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.white },
  markerTail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.primary, marginTop: -2 },
  calloutContainer: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md, minWidth: 180, maxWidth: 250, elevation: 4, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  calloutName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text },
  calloutRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  calloutStar: { color: colors.accent, fontSize: 13 },
  calloutRating: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.text },
  calloutReviews: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  calloutAddress: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 3 },
  calloutTap: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium, marginTop: 4 },
  mapCardList: { position: 'absolute', bottom: 100, left: 0, right: 0 },
  mapCard: { width: 260, backgroundColor: colors.white, borderRadius: radii.lg, marginRight: spacing.md, flexDirection: 'row', overflow: 'hidden', elevation: 4, shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  mapCardImage: { width: 80, height: 80 },
  mapCardInfo: { flex: 1, padding: spacing.sm, justifyContent: 'center' },
  mapCardName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  mapCardAddress: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  mapCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});

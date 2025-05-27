import { useEffect, useRef } from "react";
import { Stack, Center, Loader, Text } from "@mantine/core";
import { Restaurant } from "@/services/api/types/restaurant";
import { RestaurantCard } from "./RestaurantCard";
import { useTranslation } from "@/services/i18n/client";

interface RestaurantCardsProps {
  restaurants: Restaurant[];
  handleLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  onDelete: (id: string, name: string) => void;
}

export function RestaurantCards({
  restaurants,
  handleLoadMore,
  hasMore,
  loading,
  onDelete,
}: RestaurantCardsProps) {
  const { t } = useTranslation("admin-panel-restaurants");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [handleLoadMore, hasMore, loading]);

  if (restaurants.length === 0 && loading) {
    return (
      <Center p="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (restaurants.length === 0) {
    return (
      <Center p="xl">
        <Text>{t("noRestaurants")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.restaurantId}
          restaurant={restaurant}
          onDelete={onDelete}
        />
      ))}

      {/* Loader for fetching next page */}
      {loading && hasMore && (
        <Center p="md">
          <Loader size="sm" />
        </Center>
      )}

      {/* Invisible element for intersection observer */}
      <div ref={observerTarget} style={{ height: 10 }}></div>
    </Stack>
  );
}

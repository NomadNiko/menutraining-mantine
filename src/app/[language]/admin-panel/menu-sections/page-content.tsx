// src/app/[language]/admin-panel/menu-sections/page-content.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Group,
  SimpleGrid,
  Card,
  Button,
  Center,
  Loader,
  Paper,
  TextInput,
} from "@mantine/core";
import { useGetRestaurantsService } from "@/services/api/services/restaurants";
import { useResponsive } from "@/services/responsive/use-responsive";
import { useTranslation } from "@/services/i18n/client";
import useGlobalLoading from "@/services/loading/use-global-loading";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { RoleEnum } from "@/services/api/types/role";
import RouteGuard from "@/services/auth/route-guard";
import { Restaurant } from "@/services/api/types/restaurant";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

function MenuSectionsPage() {
  const { t } = useTranslation("admin-panel-menu-sections");
  const { isMobile } = useResponsive();
  const { setLoading } = useGlobalLoading();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const getRestaurantsService = useGetRestaurantsService();
  const { setSelectedRestaurant } = useSelectedRestaurant();
  const router = useRouter();

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      setLoading(true);
      try {
        const { status, data } = await getRestaurantsService(undefined, {
          page: 1,
          limit: 100, // Assuming reasonable number of restaurants
        });
        if (status === HTTP_CODES_ENUM.OK) {
          // Check if data is an array directly or within the data.data structure
          const restaurantsArray = Array.isArray(data)
            ? data
            : data?.data || [];
          setRestaurants(restaurantsArray);
          setFilteredRestaurants(restaurantsArray);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoadingRestaurants(false);
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [getRestaurantsService, setLoading]);

  // Handle search input change
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchQuery, restaurants]);

  // Handle restaurant selection
  const handleSelectRestaurant = (restaurant: Restaurant) => {
    // Set the selected restaurant in context
    setSelectedRestaurant(restaurant);
    // Navigate to the restaurant/menu-sections page
    router.push("/restaurant/menu-sections");
  };

  return (
    <RouteGuard roles={[RoleEnum.ADMIN]}>
      <Container size={isMobile ? "100%" : "lg"}>
        <Title order={2} mb="md">
          {t("title")}
        </Title>
        <Text mb="xl">
          {t(
            "selectRestaurantInstruction",
            "Select a restaurant to manage its menu sections. You'll be redirected to the menu sections page for the selected restaurant."
          )}
        </Text>
        {/* Search input */}
        <TextInput
          placeholder={t("searchRestaurants", "Search restaurants...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          mb="lg"
          leftSection={<IconSearch size={16} />}
        />
        {loadingRestaurants ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : filteredRestaurants.length === 0 ? (
          <Paper p="xl" withBorder>
            <Text ta="center">
              {searchQuery.trim() !== ""
                ? t(
                    "noRestaurantsFound",
                    "No restaurants found matching your search."
                  )
                : t("noRestaurants", "No restaurants available.")}
            </Text>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {filteredRestaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                withBorder
                padding="lg"
                radius="md"
                h={150}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Text fw={600} size="lg" lineClamp={2}>
                  {restaurant.name}
                </Text>
                {restaurant.description && (
                  <Text size="sm" c="dimmed" lineClamp={1} mt="xs">
                    {restaurant.description}
                  </Text>
                )}
                <Group justify="flex-end" mt="md">
                  <Button
                    onClick={() => handleSelectRestaurant(restaurant)}
                    size="compact-sm"
                  >
                    {t("manageMenuSections", "Manage Menu Sections")}
                  </Button>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </RouteGuard>
  );
}

export default MenuSectionsPage;

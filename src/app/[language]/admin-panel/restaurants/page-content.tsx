"use client";
import { RoleEnum } from "@/services/api/types/role";
import { useTranslation } from "@/services/i18n/client";
import {
  Container,
  Title,
  Grid,
  Group,
  Button,
  Table,
  Paper,
  Text,
  ScrollArea,
  Box,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import Link from "@/components/link";
import RouteGuard from "@/services/auth/route-guard";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useGetRestaurantsService } from "@/services/api/services/restaurants";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Restaurant } from "@/services/api/types/restaurant";
import { useResponsive } from "@/services/responsive/use-responsive";
import { IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import { useDeleteRestaurantService } from "@/services/api/services/restaurants";
import { RestaurantCards } from "@/components/restaurants/RestaurantCards";

function Restaurants() {
  const { t } = useTranslation("admin-panel-restaurants");
  const { setLoading } = useGlobalLoading();
  const { isMobile } = useResponsive();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLocalLoading] = useState(false);
  const getRestaurantsService = useGetRestaurantsService();
  const deleteRestaurantService = useDeleteRestaurantService();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();

  const fetchRestaurants = useCallback(async () => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getRestaurantsService(undefined, {
        page,
        limit: 10,
      });
      console.log("Restaurant data received:", data); // Debug log
      if (status === HTTP_CODES_ENUM.OK) {
        // Handle different possible data structures
        if (data && Array.isArray(data.data)) {
          // Standard paginated response
          setRestaurants((prevRestaurants) =>
            page === 1 ? data.data : [...prevRestaurants, ...data.data]
          );
          setHasMore(!!data.hasNextPage);
        } else if (Array.isArray(data)) {
          // Direct array response
          setRestaurants((prevRestaurants) =>
            page === 1 ? data : [...prevRestaurants, ...data]
          );
          setHasMore(data.length === 10); // Assume more if we got a full page
        } else {
          // Fallback for unexpected format
          console.warn("Unexpected data format:", data);
          setRestaurants([]);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setRestaurants([]);
      setHasMore(false);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [getRestaurantsService, page, setLoading]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string, name: string) => {
    const confirmed = await confirmDialog({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage", { name }),
    });
    if (confirmed) {
      setLoading(true);
      try {
        const { status } = await deleteRestaurantService({ restaurantId });
        if (status === HTTP_CODES_ENUM.NO_CONTENT) {
          setRestaurants((prevRestaurants) =>
            prevRestaurants.filter(
              (restaurant) => restaurant.restaurantId !== restaurantId
            )
          );
          enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <RouteGuard roles={[RoleEnum.ADMIN]}>
      <Container size={isMobile ? "100%" : "888px"}>
        <Grid>
          <Grid.Col span={12}>
            <Group justify="space-between" mb="md">
              <Title order={3}>{t("title")}</Title>
              <Button
                component={Link}
                href="/admin-panel/restaurants/create"
                color="green"
                size="compact-sm"
              >
                {t("create")}
              </Button>
            </Group>
          </Grid.Col>
          <Grid.Col span={12}>
            {isMobile ? (
              <Box>
                <RestaurantCards
                  restaurants={restaurants}
                  handleLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  loading={loading}
                  onDelete={handleDeleteRestaurant}
                />
              </Box>
            ) : (
              <Paper shadow="xs" p="md">
                <ScrollArea h={500}>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th style={{ width: 200, textAlign: "left" }}>
                          {t("table.name")}
                        </th>
                        <th style={{ width: 200, textAlign: "left" }}>
                          {t("table.email")}
                        </th>
                        <th style={{ width: 150, textAlign: "left" }}>
                          {t("table.phone")}
                        </th>
                        <th style={{ width: 375, textAlign: "right" }}>
                          {t("table.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center" }}>
                            {loading ? (
                              <Text>Loading...</Text>
                            ) : (
                              <>
                                <Text>{t("noRestaurants")}</Text>
                                {process.env.NODE_ENV !== "production" && (
                                  <Text size="xs" c="dimmed" mt="xs">
                                    Debug info: Restaurant count:{" "}
                                    {restaurants?.length || 0}
                                  </Text>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ) : (
                        restaurants.map((restaurant) => (
                          <tr key={restaurant.restaurantId}>
                            <td style={{ width: 200, textAlign: "left" }}>
                              {restaurant.name}
                            </td>
                            <td style={{ width: 200, textAlign: "left" }}>
                              {restaurant.email || "-"}
                            </td>
                            <td style={{ width: 150, textAlign: "left" }}>
                              {restaurant.phone || "-"}
                            </td>
                            <td style={{ width: 375, textAlign: "right" }}>
                              <Group gap="xs" justify="flex-end">
                                <Button
                                  component={Link}
                                  href={`/admin-panel/restaurants/edit/${restaurant.restaurantId}`}
                                  size="xs"
                                  variant="light"
                                  leftSection={<IconEdit size={14} />}
                                  style={{
                                    width: "88px",
                                    height: "24px",
                                    padding: "0 6px",
                                  }}
                                  styles={{
                                    inner: {
                                      fontSize: "12px",
                                      height: "100%",
                                    },
                                  }}
                                >
                                  <Text size="xs" truncate>
                                    {t("actions.edit")}
                                  </Text>
                                </Button>
                                <Button
                                  component={Link}
                                  href={`/admin-panel/restaurants/${restaurant.restaurantId}/users`}
                                  size="xs"
                                  variant="light"
                                  leftSection={<IconUsers size={14} />}
                                  style={{
                                    width: "88px",
                                    height: "24px",
                                    padding: "0 6px",
                                  }}
                                  styles={{
                                    inner: {
                                      fontSize: "12px",
                                      height: "100%",
                                    },
                                  }}
                                >
                                  <Text size="xs" truncate>
                                    {t("actions.users")}
                                  </Text>
                                </Button>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() =>
                                    handleDeleteRestaurant(
                                      restaurant.restaurantId,
                                      restaurant.name
                                    )
                                  }
                                  style={{
                                    width: "88px",
                                    height: "24px",
                                    padding: "0 6px",
                                  }}
                                  styles={{
                                    inner: {
                                      fontSize: "12px",
                                      height: "100%",
                                    },
                                  }}
                                >
                                  <Text size="xs" truncate>
                                    {t("actions.delete")}
                                  </Text>
                                </Button>
                              </Group>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </ScrollArea>
                {hasMore && (
                  <Group justify="center" mt="md">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      size="compact-sm"
                    >
                      {t("loadMore")}
                    </Button>
                  </Group>
                )}
              </Paper>
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </RouteGuard>
  );
}

export default Restaurants;

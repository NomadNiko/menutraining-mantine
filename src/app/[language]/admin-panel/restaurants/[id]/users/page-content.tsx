"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import {
  Container,
  Title,
  Paper,
  Grid,
  Group,
  Button,
  Box,
  Table,
  Avatar,
  Text,
  Stack,
  Autocomplete,
  Loader,
} from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import RouteGuard from "@/services/auth/route-guard";
import { RoleEnum } from "@/services/api/types/role";
import { useParams } from "next/navigation";
import {
  useGetRestaurantService,
  useGetRestaurantUsersService,
  useAddUserToRestaurantService,
  useRemoveUserFromRestaurantService,
} from "@/services/api/services/restaurants";
import { useGetUsersService } from "@/services/api/services/users";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { Restaurant } from "@/services/api/types/restaurant";
import { User } from "@/services/api/types/user";
import { IconTrash, IconSearch } from "@tabler/icons-react";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useDebouncedValue } from "@mantine/hooks";
import { useResponsive } from "@/services/responsive/use-responsive";
import { RestaurantUserCards } from "@/components/restaurants/RestaurantUserCards";

// Define our form data type
type AddUserFormData = {
  userSearch: string;
  selectedUserId?: string;
};

// Create validation schema - make sure selectedUserId is optional to match our type
const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-restaurants");
  // Simple schema that exactly matches our form data
  return yup.object({
    userSearch: yup.string().required(t("users.validation.userRequired")),
    selectedUserId: yup
      .string()
      .transform((value) => (value === null ? undefined : value)),
  });
};

function RestaurantUsers() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation("admin-panel-restaurants");
  const { setLoading } = useGlobalLoading();
  const { enqueueSnackbar } = useSnackbar();
  const { confirmDialog } = useConfirmDialog();
  const { isMobile } = useResponsive();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [isSearching, setIsSearching] = useState(false);
  const getRestaurantService = useGetRestaurantService();
  const getRestaurantUsersService = useGetRestaurantUsersService();
  const addUserToRestaurantService = useAddUserToRestaurantService();
  const removeUserFromRestaurantService = useRemoveUserFromRestaurantService();
  const getUsersService = useGetUsersService();

  const { control, handleSubmit, reset, setValue, watch, setError, formState } =
    useForm<AddUserFormData>({
      resolver: yupResolver(useValidationSchema()),
      defaultValues: {
        userSearch: "",
        selectedUserId: undefined,
      },
    });

  const selectedUserIdValue = watch("selectedUserId");

  // Load restaurant and its users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First get the restaurant using the restaurantId
        const restaurantResult = await getRestaurantService({
          restaurantId: params.id,
        });
        if (restaurantResult.status === HTTP_CODES_ENUM.OK) {
          setRestaurant(restaurantResult.data);
          // Then use the restaurant.restaurantId to fetch users
          const usersResult = await getRestaurantUsersService({
            restaurantId: restaurantResult.data.restaurantId,
          });
          if (usersResult.status === HTTP_CODES_ENUM.OK) {
            setUsers(usersResult.data);
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
        enqueueSnackbar(
          t("users.fetchError") || "Failed to fetch restaurant data",
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    getRestaurantService,
    getRestaurantUsersService,
    params.id,
    setLoading,
    t,
    enqueueSnackbar,
  ]);

  // Search for users when the debounced query changes
  useEffect(() => {
    const searchForUsers = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setSearchUsers([]);
        return;
      }
      setIsSearching(true);
      try {
        // Just use the existing pagination approach but with a name filter
        const { status, data } = await getUsersService(undefined, {
          page: 1,
          limit: 10,
          // Use filters for firstName or lastName to match search
          filters: {
            name: debouncedSearchQuery,
          },
        });
        if (status === HTTP_CODES_ENUM.OK && data?.data) {
          // Filter out users that are already in the restaurant
          const currentUserIds = users.map((u) => u.id);
          const filteredUsers = data.data.filter(
            (u) => !currentUserIds.includes(u.id)
          );
          setSearchUsers(filteredUsers);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    };
    searchForUsers();
  }, [debouncedSearchQuery, getUsersService, users]);

  const onSubmit = handleSubmit(async (formData) => {
    if (!restaurant || !formData.selectedUserId) return;
    setLoading(true);
    try {
      const { status, data } = await addUserToRestaurantService(
        { userId: formData.selectedUserId },
        { restaurantId: restaurant.restaurantId }
      );
      if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY && data.errors) {
        Object.keys(data.errors).forEach((key) => {
          setError(key as keyof AddUserFormData, {
            type: "manual",
            message:
              t(`users.validation.server.${data.errors[key]}`) ||
              "Invalid input",
          });
        });
        return;
      }
      if (status === HTTP_CODES_ENUM.OK) {
        // Refresh users list
        const usersResult = await getRestaurantUsersService({
          restaurantId: restaurant.restaurantId,
        });
        if (usersResult.status === HTTP_CODES_ENUM.OK) {
          setUsers(usersResult.data);
        }
        reset();
        setSearchQuery("");
        setSearchUsers([]);
        enqueueSnackbar(t("users.addSuccess") || "User added successfully", {
          variant: "success",
        });
      }
    } catch (error: unknown) {
      console.error("Error adding user:", error);
      // Type-safe error handling
      if (typeof error === "object" && error !== null && "response" in error) {
        const apiError = error as { response?: { status: number } };
        if (apiError.response?.status === 403) {
          enqueueSnackbar(
            t("users.permissionError") ||
              "You don't have permission to add users",
            {
              variant: "error",
              autoHideDuration: 5000,
            }
          );
        } else {
          enqueueSnackbar(t("users.addError") || "Failed to add user", {
            variant: "error",
          });
        }
      } else {
        enqueueSnackbar(t("users.addError") || "Failed to add user", {
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  });

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!restaurant) return;
    const confirmed = await confirmDialog({
      title: t("users.removeConfirmTitle"),
      message: t("users.removeConfirmMessage", { name: userName }),
    });
    if (confirmed) {
      setLoading(true);
      try {
        const { status } = await removeUserFromRestaurantService({
          restaurantId: restaurant.restaurantId,
          userId,
        });
        if (status === HTTP_CODES_ENUM.OK) {
          // Update users list
          setUsers((prevUsers) =>
            prevUsers.filter((user) => user.id !== userId)
          );
          enqueueSnackbar(t("users.removeSuccess"), {
            variant: "success",
          });
        }
      } catch (error) {
        console.error("Error removing user:", error);
        enqueueSnackbar(t("users.removeError") || "Failed to remove user", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Generate autocomplete options from the search results
  const autocompleteOptions = searchUsers.map((user) => ({
    value: `${user.firstName} ${user.lastName} (${user.email})`,
    id: user.id,
  }));

  return (
    <RouteGuard roles={[RoleEnum.ADMIN]}>
      <Container size="lg">
        <Grid>
          <Grid.Col span={12}>
            <Group justify="space-between" mb="md">
              <Stack gap="xs">
                <Title order={3}>{t("usersTitle")}</Title>
                {restaurant && <Text>{restaurant.name}</Text>}
              </Stack>
              <Button
                component={Link}
                href="/admin-panel/restaurants"
                size="compact-sm"
              >
                {t("backToList")}
              </Button>
            </Group>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="xs" p="md" mb="md">
              <Title order={5} mb="md">
                {t("users.addUser")}
              </Title>
              <form onSubmit={onSubmit}>
                <Stack gap="md">
                  <Controller
                    name="userSearch"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        {...field}
                        label={t("users.userSearch") || "Search Users"}
                        placeholder={
                          t("users.userSearchPlaceholder") ||
                          "Search by name or email"
                        }
                        error={fieldState.error?.message}
                        data-testid="user-search"
                        rightSection={
                          isSearching ? (
                            <Loader size="xs" />
                          ) : (
                            <IconSearch size={14} />
                          )
                        }
                        data={autocompleteOptions}
                        onChange={(value) => {
                          field.onChange(value);
                          setSearchQuery(value);
                          // Find the selected user from the options
                          const selectedOption = autocompleteOptions.find(
                            (option) => option.value === value
                          );
                          if (selectedOption) {
                            setValue("selectedUserId", selectedOption.id);
                          } else {
                            setValue("selectedUserId", undefined);
                          }
                        }}
                      />
                    )}
                  />
                  {formState.errors.selectedUserId && (
                    <Text color="red" size="sm">
                      {formState.errors.selectedUserId.message}
                    </Text>
                  )}
                  <Box>
                    <Button
                      type="submit"
                      size="compact-sm"
                      disabled={!restaurant || !selectedUserIdValue}
                    >
                      {t("users.addButton")}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper shadow="xs" p="md">
              <Title order={5} mb="md">
                {t("users.associatedUsers")}
              </Title>

              {isMobile ? (
                <RestaurantUserCards
                  users={users}
                  onRemove={handleRemoveUser}
                  disabled={!restaurant}
                />
              ) : (
                <Table striped highlightOnHover>
                  <thead>
                    <tr>
                      <th>{t("users.table.user")}</th>
                      <th>{t("users.table.email")}</th>
                      <th style={{ width: "120px", textAlign: "right" }}>
                        {t("users.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center" }}>
                          <Text>{t("users.noUsers")}</Text>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <Group gap="sm">
                              <Avatar
                                src={user.photo?.path}
                                alt={`${user.firstName} ${user.lastName}`}
                                size="sm"
                                radius="xl"
                              />
                              <Text>
                                {user.firstName} {user.lastName}
                              </Text>
                            </Group>
                          </td>
                          <td>{user.email}</td>
                          <td style={{ textAlign: "right" }}>
                            <Button
                              size="compact-xs"
                              variant="light"
                              color="red"
                              onClick={() =>
                                handleRemoveUser(
                                  user.id,
                                  `${user.firstName} ${user.lastName}`
                                )
                              }
                              leftSection={<IconTrash size={14} />}
                              disabled={!restaurant}
                            >
                              {t("users.removeButton")}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </RouteGuard>
  );
}

export default RestaurantUsers;

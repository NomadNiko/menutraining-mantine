// src/app/[language]/admin-panel/allergies/page-content.tsx
"use client";
import { RoleEnum } from "@/services/api/types/role";
import { useTranslation } from "@/services/i18n/client";
import {
  Container,
  Title,
  Grid,
  Group,
  Button,
  Paper,
  Table,
  Text,
  ScrollArea,
  Box,
  Avatar,
} from "@mantine/core";
import { useEffect, useState, useCallback } from "react";
import Link from "@/components/link";
import RouteGuard from "@/services/auth/route-guard";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { useGetAllergiesService } from "@/services/api/services/allergies";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Allergy } from "@/services/api/types/allergy";
import { useResponsive } from "@/services/responsive/use-responsive";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import { useDeleteAllergyService } from "@/services/api/services/allergies";
import { AllergyCards } from "@/components/allergies/AllergyCards";

function Allergies() {
  const { t } = useTranslation("admin-panel-allergies");
  const { setLoading } = useGlobalLoading();
  const { isMobile } = useResponsive();
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLocalLoading] = useState(false);
  const getAllergiesService = useGetAllergiesService();
  const deleteAllergyService = useDeleteAllergyService();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();

  const fetchAllergies = useCallback(async () => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getAllergiesService(undefined, {
        page,
        limit: 10,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        if (data && Array.isArray(data.data)) {
          setAllergies((prevAllergies) =>
            page === 1 ? data.data : [...prevAllergies, ...data.data]
          );
          setHasMore(!!data.hasNextPage);
        } else if (Array.isArray(data)) {
          setAllergies((prevAllergies) =>
            page === 1 ? data : [...prevAllergies, ...data]
          );
          setHasMore(data.length === 10);
        } else {
          console.warn("Unexpected data format:", data);
          setAllergies([]);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching allergies:", error);
      setAllergies([]);
      setHasMore(false);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [getAllergiesService, page, setLoading]);

  useEffect(() => {
    fetchAllergies();
  }, [fetchAllergies]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleDeleteAllergy = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage", { name }),
    });
    if (confirmed) {
      setLoading(true);
      try {
        const { status } = await deleteAllergyService({ id });
        if (status === HTTP_CODES_ENUM.NO_CONTENT) {
          setAllergies((prevAllergies) =>
            prevAllergies.filter((allergy) => allergy.id !== id)
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
                href="/admin-panel/allergies/create"
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
                <AllergyCards
                  allergies={allergies}
                  handleLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  loading={loading}
                  onDelete={handleDeleteAllergy}
                />
              </Box>
            ) : (
              <Paper shadow="xs" p="md">
                <ScrollArea h={500}>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th style={{ width: 80, textAlign: "center" }}>
                          {t("table.logo")}
                        </th>
                        <th style={{ width: 300, textAlign: "left" }}>
                          {t("table.name")}
                        </th>
                        <th style={{ width: 375, textAlign: "right" }}>
                          {t("table.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allergies.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center" }}>
                            {loading ? (
                              <Text>Loading...</Text>
                            ) : (
                              <Text>{t("noAllergies")}</Text>
                            )}
                          </td>
                        </tr>
                      ) : (
                        allergies.map((allergy) => (
                          <tr key={allergy.id}>
                            <td style={{ width: 120, textAlign: "center" }}>
                              {allergy.allergyLogoUrl ? (
                                <Avatar
                                  src={allergy.allergyLogoUrl}
                                  size="lg"
                                  radius="md"
                                  alt={allergy.allergyName}
                                />
                              ) : (
                                <Avatar size="md" radius="md">
                                  {allergy.allergyName.charAt(0)}
                                </Avatar>
                              )}
                            </td>
                            <td style={{ width: 300, textAlign: "left" }}>
                              {allergy.allergyName}
                            </td>
                            <td style={{ width: 375, textAlign: "right" }}>
                              <Group gap="xs" justify="flex-end">
                                <Button
                                  component={Link}
                                  href={`/admin-panel/allergies/edit/${allergy.id}`}
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
                                  size="xs"
                                  variant="light"
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() =>
                                    handleDeleteAllergy(
                                      allergy.id,
                                      allergy.allergyName
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

export default Allergies;

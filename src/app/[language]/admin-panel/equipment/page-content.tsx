// src/app/[language]/admin-panel/equipment/page-content.tsx
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
import { useGetEquipmentService } from "@/services/api/services/equipment";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Equipment } from "@/services/api/types/equipment";
import { useResponsive } from "@/services/responsive/use-responsive";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/components/mantine/feedback/notification-service";
import { useDeleteEquipmentService } from "@/services/api/services/equipment";
import { EquipmentCards } from "@/components/equipment/EquipmentCards";

function EquipmentList() {
  const { t } = useTranslation("admin-panel-equipment");
  const { setLoading } = useGlobalLoading();
  const { isMobile } = useResponsive();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLocalLoading] = useState(false);
  const getEquipmentService = useGetEquipmentService();
  const deleteEquipmentService = useDeleteEquipmentService();
  const { confirmDialog } = useConfirmDialog();
  const { enqueueSnackbar } = useSnackbar();

  const fetchEquipment = useCallback(async () => {
    setLocalLoading(true);
    setLoading(true);
    try {
      const { status, data } = await getEquipmentService(undefined, {
        page,
        limit: 10,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        if (data && Array.isArray(data.data)) {
          setEquipment((prevEquipment) =>
            page === 1 ? data.data : [...prevEquipment, ...data.data]
          );
          setHasMore(!!data.hasNextPage);
        } else if (Array.isArray(data)) {
          setEquipment((prevEquipment) =>
            page === 1 ? data : [...prevEquipment, ...data]
          );
          setHasMore(data.length === 10);
        } else {
          console.warn("Unexpected data format:", data);
          setEquipment([]);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setEquipment([]);
      setHasMore(false);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [getEquipmentService, page, setLoading]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage", { name }),
    });
    if (confirmed) {
      setLoading(true);
      try {
        const { status } = await deleteEquipmentService({ id });
        if (status === HTTP_CODES_ENUM.NO_CONTENT) {
          setEquipment((prevEquipment) =>
            prevEquipment.filter((item) => item.id !== id)
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
                href="/admin-panel/equipment/create"
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
                <EquipmentCards
                  equipment={equipment}
                  handleLoadMore={handleLoadMore}
                  hasMore={hasMore}
                  loading={loading}
                  onDelete={handleDeleteEquipment}
                />
              </Box>
            ) : (
              <Paper shadow="xs" p="md">
                <ScrollArea h={500}>
                  <Table striped highlightOnHover>
                    <thead>
                      <tr>
                        <th style={{ width: 80, textAlign: "center" }}>
                          {t("table.image")}
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
                      {equipment.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center" }}>
                            {loading ? (
                              <Text>Loading...</Text>
                            ) : (
                              <Text>{t("noEquipment")}</Text>
                            )}
                          </td>
                        </tr>
                      ) : (
                        equipment.map((item) => (
                          <tr key={item.id}>
                            <td style={{ width: 120, textAlign: "center" }}>
                              {item.equipmentImageUrl ? (
                                <Avatar
                                  src={item.equipmentImageUrl}
                                  size="lg"
                                  radius="md"
                                  alt={item.equipmentName}
                                />
                              ) : (
                                <Avatar size="md" radius="md">
                                  {item.equipmentName.charAt(0)}
                                </Avatar>
                              )}
                            </td>
                            <td style={{ width: 300, textAlign: "left" }}>
                              {item.equipmentName}
                            </td>
                            <td style={{ width: 375, textAlign: "right" }}>
                              <Group gap="xs" justify="flex-end">
                                <Button
                                  component={Link}
                                  href={`/admin-panel/equipment/edit/${item.id}`}
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
                                    handleDeleteEquipment(
                                      item.id,
                                      item.equipmentName
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

export default EquipmentList;

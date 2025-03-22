"use client";
import { Box, Menu, Button, Text, Group } from "@mantine/core";
import { IconBuilding, IconChevronDown } from "@tabler/icons-react";
import useSelectedRestaurant from "@/services/restaurant/use-selected-restaurant";
import { useState } from "react";

const RestaurantSelector = () => {
  const { selectedRestaurant, availableRestaurants, setSelectedRestaurant } =
    useSelectedRestaurant();
  const [menuOpened, setMenuOpened] = useState(false);

  // Remove all conditional rendering for testing
  return (
    <Box>
      <Menu
        opened={menuOpened}
        onChange={setMenuOpened}
        position="bottom-end"
        offset={5}
      >
        <Menu.Target>
          <Button
            variant="subtle"
            leftSection={<IconBuilding size={16} />}
            rightSection={<IconChevronDown size={14} />}
            data-testid="restaurant-selector"
            size="compact-sm"
          >
            {selectedRestaurant?.name || "Select Restaurant"}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {(availableRestaurants || []).map((restaurant) => (
            <Menu.Item
              key={restaurant.id}
              onClick={() => {
                setSelectedRestaurant(restaurant);
                setMenuOpened(false);
              }}
              data-testid={`restaurant-option-${restaurant.id}`}
            >
              <Group justify="space-between" w="100%">
                <Text>{restaurant.name}</Text>
                {selectedRestaurant?.id === restaurant.id && (
                  <Text c="blue">✓</Text>
                )}
              </Group>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Box>
  );
};

export default RestaurantSelector;

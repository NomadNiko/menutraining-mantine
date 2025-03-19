import { useGetUsersService } from "@/services/api/services/users";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UserFilterType, UserSortType } from "../user-filter-types";

export const usersQueryKeys = createQueryKeys(["users"], {
  list: () => ({
    key: [],
    sub: {
      by: ({
        sort,
        filter,
      }: {
        filter: UserFilterType | undefined;
        sort?: UserSortType | undefined;
      }) => ({
        key: [sort, filter],
      }),
    },
  }),
});

export const useGetUsersQuery = ({
  filter,
  sort,
}: {
  filter?: UserFilterType | undefined;
  sort?: UserSortType | undefined;
} = {}) => {
  const getUsersService = useGetUsersService();

  const query = useInfiniteQuery({
    queryKey: usersQueryKeys.list().sub.by({ sort, filter }).key,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { status, data } = await getUsersService(
        undefined,
        {
          page: pageParam,
          limit: 10,
          filters: filter,
          sort: sort ? [sort] : undefined,
        },
        {
          signal,
        }
      );

      if (status === HTTP_CODES_ENUM.OK) {
        return {
          data: data.data,
          nextPage: data.hasNextPage ? pageParam + 1 : undefined,
        };
      }

      // Return empty data if not OK
      return {
        data: [],
        nextPage: undefined,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage?.nextPage;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  return query;
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorProductsAPI } from '@/lib/api/vendor-products';
import type {
  CreateProductRequest,
  UpdateProductRequest,
} from '@/lib/validations/product';
import type { Product } from '@/lib/api/vendor-products';

/**
 * Query keys for product-related queries
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  customFields: () => [...productKeys.all, 'customFields'] as const,
};

/**
 * Hook to fetch all products for a vendor with pagination and filters
 */
export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.search) queryParams.set('search', params.search);
  if (params?.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.category && params.category !== 'all') queryParams.set('category', params.category);

  const filterKey = queryParams.toString();

  return useQuery({
    queryKey: productKeys.list(filterKey),
    queryFn: async () => {
      const url = `/api/vendor/products/full?${queryParams.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return response.json();
    },
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: productKeys.detail(productId || ''),
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');
      const response = await vendorProductsAPI.getProduct(productId);
      return response.product;
    },
    enabled: !!productId,
  });
}

/**
 * Hook to fetch product categories
 */
export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: async () => {
      const response = await vendorProductsAPI.getCategories();
      return response.categories || [];
    },
    staleTime: 10 * 60 * 1000, // Categories rarely change, cache for 10 minutes
  });
}

/**
 * Hook to fetch custom field names
 */
export function useCustomFields() {
  return useQuery({
    queryKey: productKeys.customFields(),
    queryFn: async () => {
      const response = await vendorProductsAPI.getCustomFields();
      return response.customFields || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: CreateProductRequest) => {
      const response = await vendorProductsAPI.createProduct(productData);
      return response.product;
    },
    onSuccess: (newProduct) => {
      // Invalidate product lists to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });

      // Optionally add the new product to the cache
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
    },
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      productData,
    }: {
      productId: string;
      productData: UpdateProductRequest;
    }) => {
      const response = await vendorProductsAPI.updateProduct(productId, productData);
      return response.product;
    },
    onSuccess: (updatedProduct) => {
      // Update the product in the cache
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);

      // Invalidate product lists to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to delete a product with optimistic updates
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      await vendorProductsAPI.deleteProduct(productId);
      return productId;
    },
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData<Product[]>(productKeys.lists());

      // Optimistically update the cache
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          productKeys.lists(),
          previousProducts.filter((p) => p.id !== productId)
        );
      }

      return { previousProducts };
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(productKeys.lists(), context.previousProducts);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to bulk create products
 */
export function useBulkCreateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: CreateProductRequest[]) => {
      // Create products one by one for now
      const results = await Promise.allSettled(
        products.map(product => vendorProductsAPI.createProduct(product))
      );
      return {
        success: results.every(r => r.status === 'fulfilled'),
        results: results.map(r => {
          if (r.status === 'fulfilled') {
            return { success: true, product: r.value.product };
          }
          return { success: false, error: r.reason.message };
        }),
      };
    },
    onSuccess: () => {
      // Invalidate product lists to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

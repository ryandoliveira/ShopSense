import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Product } from "../src/app";

export function useProducts() {
  const queryClient = useQueryClient();

  // Buscar todos os produtos
  const productsQuery = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const response = await api.get<Product[]>("/products"); 
      return response.data;
    },
  });

  // Criar produto
  const createProduct = useMutation({
    mutationFn: async (product: Omit<Product, "id">): Promise<Product> => {
      const response = await api.post<Product>("/products", product);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Atualizar produto
  const updateProduct = useMutation({
    mutationFn: async (product: Product): Promise<Product> => {
      const response = await api.put<Product>(`/products/${product.id}`, product);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Deletar produto
  const deleteProduct = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    productsQuery,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

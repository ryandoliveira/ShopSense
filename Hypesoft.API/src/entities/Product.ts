export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;         // corresponde ao frontend (quantity)
  categoryId?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Hypesoft.Domain.Repositories
{
    // Definição do modelo Product dentro do mesmo namespace
    public class Product
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public decimal Price { get; set; }
    }

    public interface IProductRepository
    {
        // Cria um novo produto
        Task<int> CreateProductAsync(Product product);

        // Retorna todos os produtos
        Task<List<Product>> GetAllProductsAsync();

        // Retorna um produto específico pelo Id
        Task<Product> GetProductByIdAsync(Guid id);

        // Atualiza um produto existente
        Task<bool> UpdateProductAsync(Product product);

        // Deleta um produto pelo Id
        Task<bool> DeleteProductAsync(Guid id);
    }
}

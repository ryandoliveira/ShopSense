using Hypesoft.Domain.Entities;
using Hypesoft.Domain.Repositories;

namespace Hypesoft.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly List<Product> _products = new();

        public async Task<int> CreateProductAsync(Product product)
        {
            _products.Add(product);

            // Se o Id do Product for Guid, você precisa ajustar a interface ou converter.
            // Exemplo: retornando 1 só para compilar
            return await Task.FromResult(1);
        }

        public async Task<List<Product>> GetAllProductsAsync()
        {
            return await Task.FromResult(_products);
        }

        public async Task<Product> GetProductByIdAsync(Guid id)
        {
            var product = _products.FirstOrDefault(p => p.Id == id);
            return await Task.FromResult(product!);
        }

        public async Task<bool> UpdateProductAsync(Product product)
        {
            var existing = _products.FirstOrDefault(p => p.Id == product.Id);
            if (existing != null)
            {
                existing.Name = product.Name;
                existing.Price = product.Price;
                return await Task.FromResult(true);
            }
            return await Task.FromResult(false);
        }

        public async Task<bool> DeleteProductAsync(Guid id)
        {
            var product = _products.FirstOrDefault(p => p.Id == id);
            if (product != null)
            {
                _products.Remove(product);
                return await Task.FromResult(true);
            }
            return await Task.FromResult(false);
        }
    }
}

using Hypesoft.Domain.Entities;
using Hypesoft.Domain.Repositories;
using MongoDB.Driver;

namespace Hypesoft.Infrastructure.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly IMongoCollection<Category> _collection;

        public CategoryRepository(IMongoDatabase database)
        {
            _collection = database.GetCollection<Category>("categories");
        }

        public async Task<IEnumerable<Category>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(Guid id)
        {
            // Convertendo Guid para string, pois MongoDB armazena como string
            return await _collection.Find(c => c.Id == id.ToString()).FirstOrDefaultAsync();
        }

        public async Task AddAsync(Category category)
        {
            // Certifique-se de gerar o Id como Guid se ainda não existir
            if (string.IsNullOrEmpty(category.Id))
                category.Id = Guid.NewGuid().ToString();

            await _collection.InsertOneAsync(category);
        }

        public async Task UpdateAsync(Category category)
        {
            await _collection.ReplaceOneAsync(c => c.Id == category.Id, category);
        }

        public async Task DeleteAsync(Guid id)
        {
            await _collection.DeleteOneAsync(c => c.Id == id.ToString());
        }
    }
}

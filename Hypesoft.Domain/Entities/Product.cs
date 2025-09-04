using System;

namespace Hypesoft.Domain.Models
{
    public class Product
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        
        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public string? CategoryId { get; set; }


        public string? Image { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

using Hypesoft.Domain.Models;
using MediatR;

namespace Hypesoft.Application.Commands
{
    public class UpdateProductCommand : IRequest<Product?>
    {
        public Guid Id { get; set; } 
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}

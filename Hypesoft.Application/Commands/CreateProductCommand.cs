using Hypesoft.Domain.Models;
using MediatR;

namespace Hypesoft.Application.Commands
{
    public class CreateProductCommand : IRequest<Product>
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}

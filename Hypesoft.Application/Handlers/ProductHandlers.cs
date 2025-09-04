using Hypesoft.Application.Commands;
using Hypesoft.Application.Queries;
using Hypesoft.Domain.Models;
using MediatR;

namespace Hypesoft.Application.Handlers
{
    public class ProductHandler :
        IRequestHandler<CreateProductCommand, Product>,
        IRequestHandler<UpdateProductCommand, Product?>,
        IRequestHandler<DeleteProductCommand, bool>,
        IRequestHandler<GetProductsQuery, IEnumerable<Product>>,
        IRequestHandler<GetProductByIdQuery, Product?>
    {
        private static readonly List<Product> _products = new();

        public Task<Product> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            var product = new Product { Name = request.Name, Price = request.Price };
            _products.Add(product);
            return Task.FromResult(product);
        }

        public Task<Product?> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
        {
            var product = _products.FirstOrDefault(p => p.Id == request.Id);
            if (product == null) return Task.FromResult<Product?>(null);

            product.Name = request.Name;
            product.Price = request.Price;

            return Task.FromResult<Product?>(product);
        }

        public Task<bool> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
        {
            var product = _products.FirstOrDefault(p => p.Id == request.Id);
            if (product == null) return Task.FromResult(false);

            _products.Remove(product);
            return Task.FromResult(true);
        }

        public Task<IEnumerable<Product>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
        {
            return Task.FromResult<IEnumerable<Product>>(_products);
        }

        public Task<Product?> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
        {
            var product = _products.FirstOrDefault(p => p.Id == request.Id);
            return Task.FromResult<Product?>(product);
        }
    }
}

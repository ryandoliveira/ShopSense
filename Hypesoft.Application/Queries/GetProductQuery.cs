using Hypesoft.Domain.Models;
using MediatR;
using System.Collections.Generic;

namespace Hypesoft.Application.Queries
{
    public class GetProductsQuery : IRequest<IEnumerable<Product>> { }
}

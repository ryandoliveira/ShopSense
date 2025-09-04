using Hypesoft.Domain.Models;
using MediatR;
using System;

namespace Hypesoft.Application.Queries
{
    public class GetProductByIdQuery : IRequest<Product?>
    {
        public Guid Id { get; set; }
    }
}

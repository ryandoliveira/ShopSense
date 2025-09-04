using MediatR;

namespace Hypesoft.Application.Commands
{
    public class UpdateHandler : IRequest<bool>
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}

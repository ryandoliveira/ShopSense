using Hypesoft.Application.Handlers;

using MediatR;
using Hypesoft.Domain.Repositories;


var builder = WebApplication.CreateBuilder(args);

// Lista em memória
var products = new List<Product>();
builder.Services.AddSingleton(products);

// MediatR
builder.Services.AddMediatR(typeof(ProductHandler));

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

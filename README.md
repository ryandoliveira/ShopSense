# ShopSense - Desafio Técnico Hypesoft

Bem-vindo ao desafio técnico da **Hypesoft**! Este projeto consiste no desenvolvimento de um sistema completo de **gestão de produtos**, demonstrando habilidades em arquitetura moderna, boas práticas de desenvolvimento e uso de tecnologias de ponta.

---

## 📌 Referência Visual
O design da aplicação segue o padrão visual moderno demonstrado neste protótipo:  
[Painel do ShopSense - Página do produto](https://dribbble.com/shots/24508262-ShopSense-Dashboard-Product-Page)

---

## ⚙️ Funcionalidades Principais

### 1. Gestão de Produtos
- Criar, listar, editar e excluir produtos.
- Cada produto possui:
  - Nome
  - Descrição
  - Preço
  - Categoria
  - Quantidade em estoque
- Validação básica de dados obrigatórios.
- Busca simples por nome do produto.

### 2. Sistema de Categorias
- Criar e gerenciar categorias de produtos (lista simples).
- Associar produtos a uma categoria.
- Filtrar produtos por categoria.

### 3. Controle de Estoque
- Controlar a quantidade em estoque de cada produto.
- Manual de atualização de estoque.
- Exibir produtos com estoque baixo (menos de 10 unidades).

### 4. Painel Simples
- Total de produtos cadastrados.
- Valor total do estoque.
- Lista de produtos com estoque baixo.
- Gráfico básico de produtos por categoria.

### 5. Sistema de Autenticação
- Integração com **Keycloak** (OAuth2/OpenID Connect).
- Login via Keycloak.
- Proteção de rotas sem frontend.
- Autorização baseada em funções do Keycloak.
- Logout integrado com Keycloak.

---

## 🛠 Requisitos Técnicos

### Desempenho
- Resposta da API em menos de 500ms para consultas simples.
- Paginação eficiente para grandes volumes.
- Cache para consultas.
- Otimização de consultas no banco.

### Escalabilidade
- Arquitetura preparada para crescimento horizontal.
- Separação clara entre camadas.
- Código limpo e bem estruturado.

### Segurança
- Limitação de taxa para prevenir abuso.
- Validação e higienização de entradas.
- Cabeçalhos de segurança adequados.
- Tratamento seguro de dados sensíveis.

### Disponibilidade
- Implementações de verificações de saúde.
- Tratamento adequado de erros.
- Mensagens de erro claras e úteis.
- Logs estruturados para monitoramento.

### Usabilidade
- Interface responsiva (desktop e mobile).
- Validação em tempo real nos formulários.
- Feedback visual para ações do usuário.
- Experiência intuitiva e consistente.

---

## 💻 Stack Tecnológica

### Front-end
- React 18 com TypeScript
- Next.js 14 (App Router)
- TailwindCSS + Shadcn/ui
- React Query / TanStack Query
- React Hook Form + Zod
- Recharts ou Chart.js
- Vitest + React Testing Library

### Backend
- .NET 9 com C#
- Arquitetura Limpa + DDD (Domain-Driven Design)
- CQRS + MediatR
- Entity Framework Core (MongoDB)
- FluentValidation
- AutoMapper
- Serilog
- xUnit + FluentAssertions

### Infraestrutura
- MongoDB como banco principal
- Keycloak para autenticação e autorização
- Docker + Docker Compose
- Nginx como proxy reverso

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Docker e Docker Compose
- .NET 9 SDK
- Node.js 20+

### Passos
1. Clonar o repositório:
```bash
git clone https://github.com/ryandoliveira/ShopSense.git

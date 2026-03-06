# langchain-mercadopago

LangChain tools for Mercado Pago payments. Wraps 5 core Mercado Pago API operations as LangChain `StructuredTool` instances, ready to use with any LangChain or LangGraph agent.

## Installation

```bash
pip install langchain-mercadopago
```

## Usage

```python
from langchain_mercadopago import create_mercadopago_tools
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_openai import ChatOpenAI

# Create the 5 Mercado Pago tools
tools = create_mercadopago_tools("YOUR_MERCADO_PAGO_ACCESS_TOKEN")

# Use with any LangChain agent
llm = ChatOpenAI(model="gpt-4o")
agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

result = executor.invoke({"input": "Create a payment link for 2 shirts at $50 ARS each"})
```

## Available Tools

| Tool | Description |
|------|-------------|
| `create_payment_preference` | Creates a Mercado Pago checkout payment preference (payment link). Returns init_point URL for redirecting buyers. |
| `get_payment` | Retrieve a payment by its ID. Returns full payment details including status, amount, payer info. |
| `create_refund` | Refund a payment fully or partially. Omit amount for full refund. |
| `search_payments` | Search recent payments for the authenticated merchant. Supports filtering by status. |
| `get_merchant_info` | Retrieve the authenticated merchant's user profile including ID, nickname, and site. |

## Security

- `payment_id` parameters are validated to be strictly numeric before URL interpolation to prevent path traversal attacks.
- All API calls use Bearer token authentication via the `Authorization` header.

## Development

```bash
pip install -e ".[dev]"
pytest
```

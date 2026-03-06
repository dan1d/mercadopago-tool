"""Tests for langchain-mercadopago tools. Written FIRST following TDD."""
from __future__ import annotations

import json
from typing import Optional
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

import httpx

from langchain_mercadopago.tools import create_mercadopago_tools
from langchain_mercadopago.schemas import (
    CreatePaymentPreferenceInput,
    GetPaymentInput,
    CreateRefundInput,
    SearchPaymentsInput,
)


ACCESS_TOKEN = "TEST-fake-access-token-123"
BASE_URL = "https://api.mercadopago.com"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_response(status_code: int = 200, json_data: Optional[dict] = None) -> httpx.Response:
    """Build a fake httpx.Response."""
    resp = httpx.Response(
        status_code=status_code,
        json=json_data or {},
        request=httpx.Request("GET", "https://example.com"),
    )
    return resp


# ---------------------------------------------------------------------------
# Factory tests
# ---------------------------------------------------------------------------

class TestFactory:
    def test_returns_five_tools(self):
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        assert len(tools) == 5

    def test_tool_names(self):
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        names = {t.name for t in tools}
        assert names == {
            "create_payment_preference",
            "get_payment",
            "create_refund",
            "search_payments",
            "get_merchant_info",
        }

    def test_all_tools_have_descriptions(self):
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        for tool in tools:
            assert tool.description, f"Tool {tool.name} has no description"

    def test_tools_have_correct_args_schemas(self):
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool_map = {t.name: t for t in tools}

        assert tool_map["create_payment_preference"].args_schema == CreatePaymentPreferenceInput
        assert tool_map["get_payment"].args_schema == GetPaymentInput
        assert tool_map["create_refund"].args_schema == CreateRefundInput
        assert tool_map["search_payments"].args_schema == SearchPaymentsInput
        # get_merchant_info has no input schema (or empty)


# ---------------------------------------------------------------------------
# create_payment_preference
# ---------------------------------------------------------------------------

class TestCreatePaymentPreference:
    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_calls_correct_endpoint(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(
            200, {"id": "pref_123", "init_point": "https://mp.com/checkout"}
        )

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_payment_preference")

        result = tool.invoke({
            "title": "Test Product",
            "quantity": 1,
            "currency": "ARS",
            "unit_price": 100.0,
        })

        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[0][0] == f"{BASE_URL}/checkout/preferences"

        body = call_args[1].get("json") or call_args[0][1] if len(call_args[0]) > 1 else call_args[1]["json"]
        assert body["items"][0]["title"] == "Test Product"
        assert body["items"][0]["quantity"] == 1
        assert body["items"][0]["currency_id"] == "ARS"
        assert body["items"][0]["unit_price"] == 100.0

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_includes_back_urls_and_notification_url(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(200, {"id": "pref_456"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_payment_preference")

        result = tool.invoke({
            "title": "Product",
            "quantity": 2,
            "currency": "BRL",
            "unit_price": 50.0,
            "back_urls": {"success": "https://ok.com", "failure": "https://fail.com"},
            "notification_url": "https://webhook.example.com/ipn",
        })

        body = mock_client.post.call_args[1]["json"]
        assert body["back_urls"] == {"success": "https://ok.com", "failure": "https://fail.com"}
        assert body["auto_return"] == "approved"
        assert body["notification_url"] == "https://webhook.example.com/ipn"

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_sends_bearer_token(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(200, {"id": "pref_789"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_payment_preference")
        tool.invoke({
            "title": "T", "quantity": 1, "currency": "ARS", "unit_price": 10.0,
        })

        # The client should be constructed with the auth header
        MockClient.assert_called_once()
        call_kwargs = MockClient.call_args[1]
        assert "Authorization" in call_kwargs.get("headers", {})
        assert call_kwargs["headers"]["Authorization"] == f"Bearer {ACCESS_TOKEN}"


# ---------------------------------------------------------------------------
# get_payment
# ---------------------------------------------------------------------------

class TestGetPayment:
    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_calls_correct_endpoint(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.get.return_value = _mock_response(200, {"id": 12345, "status": "approved"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "get_payment")

        result = tool.invoke({"payment_id": "12345"})

        mock_client.get.assert_called_once_with(f"{BASE_URL}/v1/payments/12345")

    def test_validates_payment_id_is_numeric(self):
        """payment_id must be numeric to prevent path traversal."""
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "get_payment")

        with pytest.raises(Exception):
            tool.invoke({"payment_id": "../admin/secret"})

    def test_validates_payment_id_rejects_slashes(self):
        """Reject IDs with slashes."""
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "get_payment")

        with pytest.raises(Exception):
            tool.invoke({"payment_id": "123/../../etc/passwd"})


# ---------------------------------------------------------------------------
# create_refund
# ---------------------------------------------------------------------------

class TestCreateRefund:
    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_calls_correct_endpoint(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(200, {"id": 999})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_refund")

        tool.invoke({"payment_id": "12345"})

        mock_client.post.assert_called_once()
        call_url = mock_client.post.call_args[0][0]
        assert call_url == f"{BASE_URL}/v1/payments/12345/refunds"

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_partial_refund_sends_amount(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(200, {"id": 1000})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_refund")

        tool.invoke({"payment_id": "12345", "amount": 50.0})

        body = mock_client.post.call_args[1]["json"]
        assert body["amount"] == 50.0

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_full_refund_sends_empty_body(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(200, {"id": 1001})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_refund")

        tool.invoke({"payment_id": "12345"})

        body = mock_client.post.call_args[1]["json"]
        assert body == {}

    def test_validates_payment_id_is_numeric(self):
        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_refund")

        with pytest.raises(Exception):
            tool.invoke({"payment_id": "not-a-number"})


# ---------------------------------------------------------------------------
# search_payments
# ---------------------------------------------------------------------------

class TestSearchPayments:
    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_calls_correct_endpoint_no_params(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.get.return_value = _mock_response(200, {"results": []})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "search_payments")

        tool.invoke({})

        mock_client.get.assert_called_once()
        call_url = mock_client.get.call_args[0][0]
        assert "/v1/payments/search" in call_url

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_passes_query_params(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.get.return_value = _mock_response(200, {"results": []})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "search_payments")

        tool.invoke({"status": "approved", "limit": 10, "offset": 5})

        call_url = mock_client.get.call_args[0][0]
        assert "status=approved" in call_url
        assert "limit=10" in call_url
        assert "offset=5" in call_url


# ---------------------------------------------------------------------------
# get_merchant_info
# ---------------------------------------------------------------------------

class TestGetMerchantInfo:
    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_calls_users_me(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.get.return_value = _mock_response(200, {"id": 111, "nickname": "SELLER"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "get_merchant_info")

        tool.invoke({})

        mock_client.get.assert_called_once_with(f"{BASE_URL}/users/me")


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_non_200_raises(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.get.return_value = _mock_response(401, {"message": "unauthorized"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "get_merchant_info")

        with pytest.raises(Exception, match="401"):
            tool.invoke({})

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_404_raises(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.get.return_value = _mock_response(404, {"message": "not found"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "get_payment")

        with pytest.raises(Exception, match="404"):
            tool.invoke({"payment_id": "99999"})

    @patch("langchain_mercadopago.tools.httpx.Client")
    def test_500_raises(self, MockClient):
        mock_client = MockClient.return_value
        mock_client.post.return_value = _mock_response(500, {"error": "internal"})

        tools = create_mercadopago_tools(ACCESS_TOKEN)
        tool = next(t for t in tools if t.name == "create_payment_preference")

        with pytest.raises(Exception):
            tool.invoke({
                "title": "X", "quantity": 1, "currency": "ARS", "unit_price": 10.0,
            })

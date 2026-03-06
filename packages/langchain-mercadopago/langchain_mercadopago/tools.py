"""LangChain StructuredTool wrappers for the Mercado Pago REST API."""

from __future__ import annotations

import json
import re
from typing import Any, Optional, Type

import httpx
from langchain_core.tools import StructuredTool
from pydantic import BaseModel

from .schemas import (
    BackUrls,
    CreatePaymentPreferenceInput,
    CreateRefundInput,
    GetPaymentInput,
    SearchPaymentsInput,
)

BASE_URL = "https://api.mercadopago.com"

_NUMERIC_RE = re.compile(r"^\d+$")


class _EmptyInput(BaseModel):
    """Empty input schema for tools that take no arguments."""

    pass


def _validate_payment_id(payment_id: str) -> None:
    """Validate that payment_id is strictly numeric to prevent path traversal."""
    if not _NUMERIC_RE.match(payment_id):
        raise ValueError(
            f"payment_id must be numeric, got: {payment_id!r}"
        )


def _raise_for_status(response: httpx.Response) -> None:
    """Raise an exception if the response status is not 2xx."""
    if response.status_code < 200 or response.status_code >= 300:
        raise RuntimeError(
            f"Mercado Pago API error {response.status_code}: {response.text}"
        )


def create_mercadopago_tools(access_token: str) -> list[StructuredTool]:
    """Create all 5 Mercado Pago tools for use with LangChain agents.

    Args:
        access_token: A Mercado Pago access token (Bearer token).

    Returns:
        A list of 5 LangChain StructuredTool instances.
    """
    client = httpx.Client(
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=30.0,
    )

    # ----- create_payment_preference -----
    def _create_payment_preference(
        title: str,
        quantity: int,
        currency: str,
        unit_price: float,
        back_urls: Optional[dict] = None,
        notification_url: Optional[str] = None,
    ) -> str:
        payload: dict[str, Any] = {
            "items": [
                {
                    "title": title,
                    "quantity": quantity,
                    "currency_id": currency,
                    "unit_price": unit_price,
                }
            ]
        }

        if back_urls:
            # back_urls may arrive as a BackUrls pydantic model or a plain dict
            if hasattr(back_urls, "model_dump"):
                back_urls = {k: v for k, v in back_urls.model_dump().items() if v is not None}
            payload["back_urls"] = back_urls
            payload["auto_return"] = "approved"

        if notification_url:
            payload["notification_url"] = notification_url

        resp = client.post(f"{BASE_URL}/checkout/preferences", json=payload)
        _raise_for_status(resp)
        return resp.text

    # ----- get_payment -----
    def _get_payment(payment_id: str) -> str:
        _validate_payment_id(payment_id)
        resp = client.get(f"{BASE_URL}/v1/payments/{payment_id}")
        _raise_for_status(resp)
        return resp.text

    # ----- create_refund -----
    def _create_refund(
        payment_id: str,
        amount: Optional[float] = None,
    ) -> str:
        _validate_payment_id(payment_id)
        body: dict[str, Any] = {}
        if amount is not None:
            body["amount"] = amount
        resp = client.post(
            f"{BASE_URL}/v1/payments/{payment_id}/refunds", json=body
        )
        _raise_for_status(resp)
        return resp.text

    # ----- search_payments -----
    def _search_payments(
        status: Optional[str] = None,
        sort: Optional[str] = None,
        criteria: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> str:
        params: dict[str, str] = {}
        if status:
            params["status"] = status
        if sort:
            params["sort"] = sort
        if criteria:
            params["criteria"] = criteria
        if limit is not None:
            params["limit"] = str(min(limit, 100))
        if offset is not None:
            params["offset"] = str(offset)

        qs = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{BASE_URL}/v1/payments/search"
        if qs:
            url = f"{url}?{qs}"

        resp = client.get(url)
        _raise_for_status(resp)
        return resp.text

    # ----- get_merchant_info -----
    def _get_merchant_info() -> str:
        resp = client.get(f"{BASE_URL}/users/me")
        _raise_for_status(resp)
        return resp.text

    # ----- Build tool list -----
    tools = [
        StructuredTool.from_function(
            func=_create_payment_preference,
            name="create_payment_preference",
            description=(
                "Creates a Mercado Pago checkout payment preference (payment link). "
                "Returns init_point URL for redirecting buyers."
            ),
            args_schema=CreatePaymentPreferenceInput,
        ),
        StructuredTool.from_function(
            func=_get_payment,
            name="get_payment",
            description=(
                "Retrieve a payment by its ID. Returns full payment details "
                "including status, amount, payer info."
            ),
            args_schema=GetPaymentInput,
        ),
        StructuredTool.from_function(
            func=_create_refund,
            name="create_refund",
            description=(
                "Refund a payment fully or partially. Omit amount for full refund."
            ),
            args_schema=CreateRefundInput,
        ),
        StructuredTool.from_function(
            func=_search_payments,
            name="search_payments",
            description=(
                "Search recent payments for the authenticated merchant. "
                "Supports filtering by status."
            ),
            args_schema=SearchPaymentsInput,
        ),
        StructuredTool.from_function(
            func=_get_merchant_info,
            name="get_merchant_info",
            description=(
                "Retrieve the authenticated merchant's user profile "
                "including ID, nickname, and site."
            ),
            args_schema=_EmptyInput,
        ),
    ]

    return tools

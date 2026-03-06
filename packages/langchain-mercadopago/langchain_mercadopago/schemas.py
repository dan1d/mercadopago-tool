"""Pydantic input schemas for Mercado Pago LangChain tools."""

from typing import Optional

from pydantic import BaseModel, Field


class BackUrls(BaseModel):
    """URLs to redirect the buyer after payment."""

    success: Optional[str] = Field(None, description="URL on approved payment")
    failure: Optional[str] = Field(None, description="URL on rejected payment")
    pending: Optional[str] = Field(None, description="URL on pending payment")


class CreatePaymentPreferenceInput(BaseModel):
    """Input for creating a Mercado Pago checkout payment preference."""

    title: str = Field(..., description="Product or service title")
    quantity: int = Field(..., gt=0, description="Quantity of items")
    currency: str = Field(
        ...,
        description="Currency ID (e.g. ARS, BRL, MXN, CLP, COP, UYU, PEN)",
    )
    unit_price: float = Field(..., gt=0, description="Unit price of the item")
    back_urls: Optional[BackUrls] = Field(
        None, description="URLs to redirect the buyer after payment"
    )
    notification_url: Optional[str] = Field(
        None, description="Webhook URL for payment notifications (IPN)"
    )


class GetPaymentInput(BaseModel):
    """Input for retrieving a payment by ID."""

    payment_id: str = Field(..., description="The payment ID to look up (numeric)")


class CreateRefundInput(BaseModel):
    """Input for refunding a payment."""

    payment_id: str = Field(..., description="The payment ID to refund (numeric)")
    amount: Optional[float] = Field(
        None, gt=0, description="Partial refund amount. Omit for full refund."
    )


class SearchPaymentsInput(BaseModel):
    """Input for searching payments."""

    status: Optional[str] = Field(
        None,
        description="Filter by status: approved, pending, rejected, refunded, cancelled",
    )
    sort: Optional[str] = Field(None, description="Sort field (e.g. date_created)")
    criteria: Optional[str] = Field(None, description="Sort order: asc or desc")
    limit: Optional[int] = Field(
        None, ge=1, le=100, description="Max results (default 30, max 100)"
    )
    offset: Optional[int] = Field(None, ge=0, description="Pagination offset")

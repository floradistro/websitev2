import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, address, destination } = body;

    // Handle both formats
    const productItems = items || [];
    const zipCode = destination?.postcode || address?.zip || address?.postcode;

    // Calculate subtotal
    const subtotal = productItems.reduce((sum: number, item: any) => {
      const price = item.productPrice || item.price || 0;
      const qty = item.quantity || 1;
      return sum + parseFloat(price) * qty;
    }, 0);

    // Calculate weight (if provided)
    const totalWeight = productItems.reduce((sum: number, item: any) => {
      const weight = item.weight || 0;
      const qty = item.quantity || 1;
      return sum + parseFloat(weight) * qty;
    }, 0);

    // Free shipping over $45
    if (subtotal >= 45) {
      return NextResponse.json({
        success: true,
        rates: [
          {
            method_id: "free_shipping",
            method_title: "Free Shipping",
            cost: 0,
            currency: "USD",
            delivery_days: "3-5 business days",
            delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          },
        ],
      });
    }

    // Standard shipping rates
    const rates = [
      {
        method_id: "flat_rate",
        method_title: "Standard Shipping",
        cost: 8.99,
        currency: "USD",
        delivery_days: "3-5 business days",
        delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
      {
        method_id: "expedited",
        method_title: "Expedited Shipping",
        cost: 14.99,
        currency: "USD",
        delivery_days: "1-2 business days",
        delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
    ];

    return NextResponse.json({
      success: true,
      rates,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Shipping calculation error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        rates: [],
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";
import { PaymentSchema, validateData } from "@/lib/validation/schemas";
import { rateLimiter, RateLimitConfigs, getIdentifier } from "@/lib/rate-limiter";
// Type definitions now available in types/authorizenet.d.ts
import { APIContracts as ApiContracts, APIControllers as ApiControllers } from "authorizenet";
import { withErrorHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import type { CartItem, AuthorizeNetTransactionResponse } from "@/types/payment";
import { toError } from "@/lib/errors";

export const POST = withErrorHandler(async (request: NextRequest) => {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const supabase = getServiceSupabase();

  try {
    // SECURITY: Apply rate limiting to prevent payment fraud
    const identifier = getIdentifier(request);
    const paymentRateLimitConfig = {
      windowMs: 10 * 60 * 1000, // 10 minutes
      maxRequests: 10,
      message: "Too many payment attempts. Please try again later.",
    };

    const allowed = rateLimiter.check(identifier, paymentRateLimitConfig);

    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(identifier, paymentRateLimitConfig);
      return NextResponse.json(
        {
          success: false,
          error: "Too many payment attempts. Please try again later.",
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTime.toString(),
          },
        },
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateData(PaymentSchema, {
      amount: body.total,
      cardNumber: body.payment_token?.dataValue || "tokenized", // Tokenized, so we accept it
      expirationDate: "12/99", // Tokenized payment
      cvv: "999", // Tokenized payment
      billing: body.billing,
      items: body.items,
    });

    if (!validation.success) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Validation error:", validation.error);
      }
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { payment_token, billing, shipping, items, shipping_cost, total, shipping_method } = body;

    if (!payment_token || !billing || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get Authorize.net credentials from env
    const apiLoginId = process.env.AUTHORIZENET_API_LOGIN_ID;
    const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY;
    const environment = process.env.AUTHORIZENET_ENVIRONMENT || "production";

    if (!apiLoginId || !transactionKey) {
      throw new Error("Authorize.net credentials not configured");
    }

    // Create merchant authentication
    const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(apiLoginId);
    merchantAuthenticationType.setTransactionKey(transactionKey);

    // Create payment data
    const opaqueData = new ApiContracts.OpaqueDataType();
    opaqueData.setDataDescriptor(payment_token.dataDescriptor || "COMMON.ACCEPT.INAPP.PAYMENT");
    opaqueData.setDataValue(payment_token.dataValue);

    const paymentType = new ApiContracts.PaymentType();
    paymentType.setOpaqueData(opaqueData);

    // Create billing address
    const billTo = new ApiContracts.CustomerAddressType();
    billTo.setFirstName(billing.firstName);
    billTo.setLastName(billing.lastName);
    billTo.setAddress(billing.address);
    billTo.setCity(billing.city);
    billTo.setState(billing.state);
    billTo.setZip(billing.zipCode);
    billTo.setCountry(billing.country);
    billTo.setPhoneNumber(billing.phone);
    billTo.setEmail(billing.email);

    // Create transaction request
    const transactionRequestType = new ApiContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(
      ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION,
    );
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(total);
    transactionRequestType.setBillTo(billTo);

    // Add line items
    const lineItems = new ApiContracts.ArrayOfLineItem();
    items.forEach((item: CartItem) => {
      const lineItem = new ApiContracts.LineItemType();
      lineItem.setItemId(item.product_id?.toString() || item.id?.toString());
      lineItem.setName(item.name.substring(0, 31)); // Max 31 chars
      lineItem.setQuantity(Number(item.quantity));
      lineItem.setUnitPrice(Number(item.price));
      lineItems.getLineItem().push(lineItem);
    });
    transactionRequestType.setLineItems(lineItems);

    // Create request
    const createRequest = new ApiContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    // Execute transaction
    const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

    if (environment === "sandbox") {
      ctrl.setEnvironment(ApiControllers.SDKConstants.endpoint.sandbox);
    } else {
      ctrl.setEnvironment(ApiControllers.SDKConstants.endpoint.production);
    }

    const authResult = await new Promise<AuthorizeNetTransactionResponse>((resolve, reject) => {
      ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
          resolve(response.getTransactionResponse());
        } else {
          const errors = response.getMessages().getMessage();
          reject(new Error(errors[0].getText()));
        }
      });
    });

    // Payment successful, create order in Supabase
    const transactionId = authResult.getTransId();

    // SECURITY FIX: Check for idempotency - prevent duplicate orders
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number, total_amount")
      .eq("transaction_id", transactionId)
      .single();

    if (existingOrder) {
      if (process.env.NODE_ENV === "development") {
        logger.warn(`⚠️  Duplicate payment attempt detected for transaction ${transactionId}`);
      }
      return NextResponse.json({
        success: true,
        order: existingOrder,
        message: "Order already processed",
      });
    }

    // Generate order number with transaction ID for traceability
    const orderNumber = `FD-${Date.now()}`;

    // SECURITY FIX: Use upsert to prevent race condition
    // This atomically finds or creates customer without race condition
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          email: billing.email.toLowerCase().trim(),
          first_name: billing.firstName,
          last_name: billing.lastName,
          phone: billing.phone,
          billing_address: {
            first_name: billing.firstName,
            last_name: billing.lastName,
            address_1: billing.address,
            address_2: billing.address2 || "",
            city: billing.city,
            state: billing.state,
            postcode: billing.zipCode,
            country: billing.country,
            phone: billing.phone,
            email: billing.email,
          },
        },
        {
          onConflict: "email",
          ignoreDuplicates: false,
        },
      )
      .select("id")
      .single();

    if (customerError || !customer) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error upserting customer:", customerError);
      }
      throw new Error("Failed to create or find customer");
    }

    const customerId = customer.id;

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: CartItem) =>
        sum + parseFloat(item.price.toString()) * parseFloat(item.quantity.toString()),
      0,
    );

    const deliveryItems = items.filter((item: CartItem) => item.orderType === "delivery");
    const hasDeliveryItems = deliveryItems.length > 0;

    // Determine delivery type
    const pickupItems = items.filter((item: CartItem) => item.orderType === "pickup");
    let deliveryType = "delivery";
    if (pickupItems.length > 0 && deliveryItems.length === 0) {
      deliveryType = "pickup";
    } else if (pickupItems.length > 0 && deliveryItems.length > 0) {
      deliveryType = "mixed";
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        status: "processing",
        payment_status: "paid",
        subtotal: subtotal,
        tax_amount: 0,
        shipping_amount: shipping_cost || 0,
        discount_amount: 0,
        total_amount: total,
        billing_address: {
          first_name: billing.firstName,
          last_name: billing.lastName,
          address_1: billing.address,
          address_2: billing.address2 || "",
          city: billing.city,
          state: billing.state,
          postcode: billing.zipCode,
          country: billing.country,
          phone: billing.phone,
          email: billing.email,
        },
        shipping_address: shipping
          ? {
              first_name: shipping.firstName,
              last_name: shipping.lastName,
              address_1: shipping.address,
              address_2: shipping.address2 || "",
              city: shipping.city,
              state: shipping.state,
              postcode: shipping.zip,
              country: shipping.country,
            }
          : null,
        payment_method: "authorize_net",
        payment_method_title: "Credit Card (Authorize.net)",
        shipping_method: shipping_method?.id,
        shipping_method_title: shipping_method?.name,
        delivery_type: deliveryType,
        transaction_id: authResult.getTransId(),
        customer_ip_address:
          request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        customer_user_agent: request.headers.get("user-agent"),
        order_date: new Date().toISOString(),
        paid_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating order:", orderError);
      }
      throw new Error("Failed to create order");
    }

    // Create order items
    const orderItems = items.map((item: CartItem) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_sku: item.sku,
      product_image: item.image,
      unit_price: parseFloat(item.price.toString()),
      quantity: parseFloat(item.quantity.toString()),
      line_subtotal: parseFloat(item.price.toString()) * parseFloat(item.quantity.toString()),
      line_total: parseFloat(item.price.toString()) * parseFloat(item.quantity.toString()),
      tax_amount: 0,
      vendor_id: item.vendor_id,
      order_type: item.orderType,
      pickup_location_id: item.locationId,
      pickup_location_name: item.locationName,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating order items:", itemsError);
      }
      throw new Error("Failed to create order items");
    }

    // Create initial status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      to_status: "processing",
      note: "Order created and payment captured",
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: orderNumber,
      transaction_id: authResult.getTransId(),
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Payment error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Payment failed",
      },
      { status: 500 },
    );
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";

/**
 * Unified Store Operations Overview
 *
 * Returns everything needed for the Store Operations Center:
 * - All stores/locations
 * - Payment processors per store
 * - All terminals per store
 * - Active sessions with real-time stats
 * - Today's totals
 *
 * This replaces 3+ separate API calls with a single optimized query.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    // Fetch all locations for vendor
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true });

    if (locationsError) {
      logger.error("Failed to fetch locations", locationsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch locations" },
        { status: 500 }
      );
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({
        success: true,
        stores: [],
        todayStats: {
          totalSales: 0,
          totalTransactions: 0,
          activeTerminals: 0,
          activeSessions: 0,
        },
        notifications: [],
      });
    }

    // Fetch all terminals with session info using terminal_overview view
    const { data: terminals, error: terminalsError } = await supabase
      .from("pos_registers")
      .select(`
        id,
        register_number,
        register_name,
        device_name,
        hardware_model,
        status,
        location_id,
        payment_processor_id,
        current_session_id,
        last_active_at,
        allow_cash,
        allow_card,
        payment_processors:payment_processor_id (
          id,
          processor_name,
          processor_type,
          is_active
        )
      `)
      .eq("vendor_id", vendorId);

    if (terminalsError) {
      logger.error("Failed to fetch terminals", terminalsError);
    }

    // Fetch active sessions with user info
    const { data: sessions, error: sessionsError } = await supabase
      .from("pos_sessions")
      .select(`
        id,
        session_number,
        register_id,
        location_id,
        user_id,
        status,
        total_sales,
        total_transactions,
        total_cash,
        total_card,
        opening_cash,
        opened_at,
        users:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("vendor_id", vendorId)
      .eq("status", "open");

    if (sessionsError) {
      logger.error("Failed to fetch sessions", sessionsError);
    }

    // Fetch payment processors for all locations
    const { data: processors, error: processorsError } = await supabase
      .from("payment_processors")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("is_active", true);

    if (processorsError) {
      logger.error("Failed to fetch processors", processorsError);
    }

    // Fetch today's transactions for last activity
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: recentTransactions, error: transactionsError } = await supabase
      .from("payment_transactions")
      .select("id, pos_register_id, amount, processed_at, status")
      .eq("vendor_id", vendorId)
      .gte("processed_at", todayStart.toISOString())
      .order("processed_at", { ascending: false })
      .limit(100);

    if (transactionsError) {
      logger.error("Failed to fetch transactions", transactionsError);
    }

    // Build store data structure
    const stores = locations.map((location) => {
      const locationTerminals = terminals?.filter((t) => t.location_id === location.id) || [];
      const locationSessions = sessions?.filter((s) => s.location_id === location.id) || [];
      const locationProcessor = processors?.find(
        (p) => p.location_id === location.id && p.is_default
      );

      // Enhance terminals with session info and last transaction
      const enhancedTerminals = locationTerminals.map((terminal) => {
        const activeSession = locationSessions.find((s) => s.register_id === terminal.id);
        const lastTransaction = recentTransactions?.find(
          (t) => t.pos_register_id === terminal.id
        );

        return {
          id: terminal.id,
          registerNumber: terminal.register_number,
          registerName: terminal.register_name,
          deviceName: terminal.device_name,
          hardwareModel: terminal.hardware_model,
          status: terminal.status,
          allowCash: terminal.allow_cash,
          allowCard: terminal.allow_card,
          paymentProcessor: terminal.payment_processors && !Array.isArray(terminal.payment_processors)
            ? {
                id: (terminal.payment_processors as any).id,
                name: (terminal.payment_processors as any).processor_name,
                type: (terminal.payment_processors as any).processor_type,
                isActive: (terminal.payment_processors as any).is_active,
              }
            : null,
          currentSession: activeSession
            ? {
                id: activeSession.id,
                sessionNumber: activeSession.session_number,
                totalSales: activeSession.total_sales || 0,
                totalTransactions: activeSession.total_transactions || 0,
                totalCash: activeSession.total_cash || 0,
                totalCard: activeSession.total_card || 0,
                openingCash: activeSession.opening_cash || 0,
                openedAt: activeSession.opened_at,
                employee: activeSession.users && !Array.isArray(activeSession.users)
                  ? {
                      id: (activeSession.users as any).id,
                      name: `${(activeSession.users as any).first_name || ""} ${(activeSession.users as any).last_name || ""}`.trim() || (activeSession.users as any).email,
                      email: (activeSession.users as any).email,
                    }
                  : null,
              }
            : null,
          lastTransaction: lastTransaction
            ? {
                id: lastTransaction.id,
                amount: lastTransaction.amount,
                processedAt: lastTransaction.processed_at,
                status: lastTransaction.status,
              }
            : null,
          lastActiveAt: terminal.last_active_at,
        };
      });

      return {
        id: location.id,
        name: location.name,
        slug: location.slug,
        address: {
          line1: location.address_line1,
          line2: location.address_line2,
          city: location.city,
          state: location.state,
          zip: location.zip,
        },
        phone: location.phone,
        email: location.email,
        isPrimary: location.is_primary,
        taxConfig: location.settings?.tax_config || null,
        processor: locationProcessor
          ? {
              id: locationProcessor.id,
              name: locationProcessor.processor_name,
              type: locationProcessor.processor_type,
              isActive: locationProcessor.is_active,
              isDefault: locationProcessor.is_default,
              lastTested: locationProcessor.last_tested_at,
              lastTestStatus: locationProcessor.last_test_status,
            }
          : null,
        terminals: enhancedTerminals,
        activeTerminals: enhancedTerminals.filter((t) => t.currentSession).length,
        todaySales:
          locationSessions.reduce((sum, s) => sum + (s.total_sales || 0), 0) || 0,
        todayTransactions:
          locationSessions.reduce((sum, s) => sum + (s.total_transactions || 0), 0) || 0,
      };
    });

    // Calculate overall stats
    const todayStats = {
      totalSales: stores.reduce((sum, s) => sum + s.todaySales, 0),
      totalTransactions: stores.reduce((sum, s) => sum + s.todayTransactions, 0),
      activeTerminals: stores.reduce((sum, s) => sum + s.activeTerminals, 0),
      activeSessions: sessions?.length || 0,
      totalStores: stores.length,
    };

    // Generate intelligent notifications
    const notifications: Array<{
      id: string;
      type: "warning" | "error" | "info" | "success";
      title: string;
      message: string;
      storeId?: string;
      terminalId?: string;
      timestamp: string;
    }> = [];

    // Check for cash discrepancies (placeholder - would come from closed sessions)
    // Check for idle sessions (> 8 hours)
    sessions?.forEach((session) => {
      const openedAt = new Date(session.opened_at);
      const hoursSinceOpen = (Date.now() - openedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceOpen > 8) {
        const store = stores.find((s) => s.id === session.location_id);
        const terminal = store?.terminals.find((t) => t.id === session.register_id);

        const employeeName = session.users && !Array.isArray(session.users)
          ? `${(session.users as any).first_name || ""} ${(session.users as any).last_name || ""}`.trim() || "Employee"
          : "Employee";

        notifications.push({
          id: `long-session-${session.id}`,
          type: "warning",
          title: `Long shift at ${store?.name}`,
          message: `${employeeName} on ${terminal?.registerName || "register"} for ${Math.floor(hoursSinceOpen)} hours`,
          storeId: session.location_id,
          terminalId: session.register_id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Check for offline payment processors
    processors?.forEach((processor) => {
      if (processor.last_test_status === "failed") {
        const store = stores.find((s) => s.id === processor.location_id);
        notifications.push({
          id: `processor-down-${processor.id}`,
          type: "error",
          title: `Payment processor issue at ${store?.name}`,
          message: `${processor.processor_name} failed last connection test`,
          storeId: processor.location_id,
          timestamp: processor.last_tested_at || new Date().toISOString(),
        });
      }
    });

    return NextResponse.json({
      success: true,
      stores,
      todayStats,
      notifications,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Unexpected error in operations overview", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch operations overview" },
      { status: 500 }
    );
  }
}

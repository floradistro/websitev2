import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data: agents, error } = await supabase
      .from("ai_agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ agents });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching agents:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const { data: agent, error } = await supabase
      .from("ai_agents")
      .insert({
        name: body.name,
        provider: body.provider || "claude",
        model: body.model,
        api_key: body.api_key,
        system_prompt: body.system_prompt,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 4096,
        status: body.status || "active",
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating agent:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { id, ...updates } = body;

    const { data: agent, error } = await supabase
      .from("ai_agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ agent });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating agent:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
    }

    const { error } = await supabase.from("ai_agents").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting agent:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

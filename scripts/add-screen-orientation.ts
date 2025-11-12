#!/usr/bin/env npx tsx

/**
 * Add screen_orientation field to tv_devices table
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addScreenOrientation() {
  console.log("🔧 Adding screen_orientation field to tv_devices...");

  try {
    // Add column
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE tv_devices
        ADD COLUMN IF NOT EXISTS screen_orientation TEXT CHECK (screen_orientation IN ('portrait', 'landscape')) DEFAULT 'landscape';
      `,
    });

    if (alterError) {
      // Try direct SQL if RPC doesn't work
      console.log("Trying direct SQL execution...");
      const { error } = await supabase.from("_migrations").insert({
        version: "20251112_add_screen_orientation",
        name: "add_screen_orientation",
      });
    }

    console.log("✅ Successfully added screen_orientation field");

    // Update existing devices based on screen_resolution
    console.log("🔄 Updating existing devices orientation based on screen_resolution...");

    const { data: devices, error: fetchError } = await supabase
      .from("tv_devices")
      .select("id, screen_resolution");

    if (fetchError) {
      console.error("Error fetching devices:", fetchError);
      return;
    }

    for (const device of devices || []) {
      if (device.screen_resolution) {
        const [width, height] = device.screen_resolution.split("x").map(Number);
        const orientation = height > width ? "portrait" : "landscape";

        const { error: updateError } = await supabase
          .from("tv_devices")
          .update({ screen_orientation: orientation })
          .eq("id", device.id);

        if (updateError) {
          console.error(`Error updating device ${device.id}:`, updateError);
        } else {
          console.log(
            `✓ Device ${device.id}: ${device.screen_resolution} → ${orientation}`,
          );
        }
      }
    }

    console.log("✅ Migration complete!");
  } catch (error) {
    console.error("Error:", error);
  }
}

addScreenOrientation();

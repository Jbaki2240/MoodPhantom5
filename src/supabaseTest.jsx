import { useEffect } from "react";
import { supabase } from "./supabase";

export default function SupabaseTest() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) {
        console.error("Supabase error:", error);
      } else {
        console.log("✅ Supabase connection is working!");
        console.log("Data:", data);
      }
    }

    testConnection();
  }, []);

  return <h2>Supabase Connection Test</h2>;
}
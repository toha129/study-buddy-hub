import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SupabaseTest = () => {
    const [status, setStatus] = useState<string>("Testing connection...");
    const [details, setDetails] = useState<any>({});

    useEffect(() => {
        const testConnection = async () => {
            try {
                // Check environment variables
                const envVars = {
                    url: import.meta.env.VITE_SUPABASE_URL,
                    keyExists: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                };

                setDetails((prev: any) => ({ ...prev, envVars }));

                // Test connection with a simple query
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    setStatus(`❌ Connection Error: ${error.message}`);
                    setDetails((prev: any) => ({ ...prev, error: error }));
                } else {
                    setStatus("✅ Supabase connection successful!");
                    setDetails((prev: any) => ({ ...prev, session: data.session ? "Active" : "No session" }));
                }

                // Try a database query to test further
                const { data: testData, error: dbError } = await supabase
                    .from('profiles')
                    .select('count')
                    .limit(1);

                if (dbError) {
                    setDetails((prev: any) => ({
                        ...prev,
                        dbTest: `Database Error: ${dbError.message}`
                    }));
                } else {
                    setDetails((prev: any) => ({
                        ...prev,
                        dbTest: "✅ Database accessible"
                    }));
                }

            } catch (err: any) {
                setStatus(`❌ Failed: ${err.message}`);
                setDetails((prev: any) => ({ ...prev, catchError: err.message }));
            }
        };

        testConnection();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">🔍 Supabase Connection Diagnostic</h1>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>
                    <p className="text-xl">{status}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <h2 className="text-2xl font-semibold mb-4">Details</h2>
                    <pre className="bg-black/50 p-4 rounded overflow-auto text-sm">
                        {JSON.stringify(details, null, 2)}
                    </pre>
                </div>

                <div className="mt-6 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
                    <h3 className="font-bold mb-2">⚠️ Common Issues:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Supabase project is paused (free tier projects pause after 7 days of inactivity)</li>
                        <li>Environment variables not loaded (restart dev server)</li>
                        <li>CORS policy blocking requests</li>
                        <li>Invalid Supabase URL or API key</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SupabaseTest;

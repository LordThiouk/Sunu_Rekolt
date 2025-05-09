// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

import { createClient } from "jsr:@supabase/supabase-js@^2";
import { corsHeaders } from '../_shared/cors.ts';

// Define the expected structure of the request body
interface NotificationPayload {
  user_id: string;
  title: string;
  message: string; // This will be the body of the push notification
  data?: Record<string, unknown>; // For deep-linking, e.g., { screen: 'OrderDetail', orderId: '123' }
}

Deno.serve(async (req: Request) => { // Added Request type for req
  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as NotificationPayload;
    const { user_id, title, message, data } = payload;

    if (!user_id || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing user_id, title, or message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create a Supabase client with the service role key to bypass RLS
    // Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set as environment variables
    const supabaseAdmin = createClient(
      Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') ?? '',
      Deno.env.get('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the user's Expo push token
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile', details: profileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!profileData || !profileData.expo_push_token) {
      console.log(`No push token found for user_id: ${user_id}`);
      return new Response(JSON.stringify({ message: 'No push token for user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Or 404 if you prefer to indicate missing token as an error
      });
    }

    const expoPushToken = profileData.expo_push_token;

    // 2. Construct the push notification message
    const pushMessage = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: message,
      data: data || {}, // Ensure data is at least an empty object
      // You can add other Expo push notification options here:
      // badge: 1, // example
      // _displayInForeground: true, // if you want foreground notifications (handle in-app instead)
    };

    // 3. Send the push notification
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessage),
    });

    const responseData = await expoResponse.json();

    // Log Expo's response (important for debugging ticket/receipt status)
    console.log('Expo push response:', responseData);

    if (responseData.data && responseData.data.status === 'error') {
      console.error('Error sending push notification:', responseData.data.message, responseData.data.details);
      // Handle specific errors, e.g., if details.error === 'DeviceNotRegistered', clear the token
      if (responseData.data.details && responseData.data.details.error === 'DeviceNotRegistered') {
        // Optional: Clear the invalid token from the database
        await supabaseAdmin
          .from('profiles')
          .update({ expo_push_token: null })
          .eq('id', user_id);
        console.log(`Cleared invalid push token for user_id: ${user_id}`);
      }
      return new Response(JSON.stringify({ error: 'Failed to send push notification', details: responseData.data.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, data: responseData.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error in Edge Function:', error);
    // Handle error type safely
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-expo-push-notification' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"user_id":"YOUR_USER_ID", "title":"Test Title", "message":"Test Message Body", "data": { "screen": "TestScreen"}}' 

*/

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // Ensure this is the correct version you use

// WARNING: THE CORS HEADERS ARE VERY PERMISSIVE. 
// For production, you should restrict the allowed origins.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*_NO_EFFECT_VALUE_/*', // Or your specific domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trigger-auth', // Added X-Trigger-Auth
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Retrieve the pre-shared key from the environment variables
    const expectedTriggerKey = Deno.env.get('MY_TRIGGER_API_KEY')
    if (!expectedTriggerKey) {
      console.error('MY_TRIGGER_API_KEY environment variable not set in Edge Function.')
      return new Response(JSON.stringify({ error: 'Internal server configuration error.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 2. Get the key provided by the trigger from the custom header
    const providedTriggerKey = req.headers.get('x-trigger-auth')
    if (providedTriggerKey !== expectedTriggerKey) {
      console.warn('Unauthorized attempt to call Edge Function. Invalid X-Trigger-Auth key.')
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 3. If keys match, proceed with function logic
    console.log('X-Trigger-Auth key validated. Proceeding with notification.')

    const { user_id, title, message, data } = await req.json()

    if (!user_id || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing user_id, title, or message in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Initialize Supabase client WITH SERVICE ROLE KEY
    // These should be set via `supabase secrets set`
    const supabaseUrl = Deno.env.get('EXPO_PUBLIC_SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or Service Role Key not set in Edge Function environment variables.')
        return new Response(JSON.stringify({ error: 'Internal server configuration error (Supabase client).' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the Expo push token for the user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .eq('id', user_id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response(JSON.stringify({ error: 'Failed to fetch user profile', details: profileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!profile || !profile.expo_push_token) {
      console.log(`No Expo push token found for user ${user_id}`)
      return new Response(JSON.stringify({ message: 'No push token for user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Or 404 if you prefer
      })
    }

    const expoPushToken = profile.expo_push_token
    const pushMessage = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: message,
      data: data || {}, // Ensure data is an object
    }

    // Send the push notification via Expo's API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessage),
    })

    const expoResponseData = await expoResponse.json()
    console.log('Expo push API response:', expoResponseData)

    // Handle "DeviceNotRegistered" error from Expo
    if (expoResponseData.data && expoResponseData.data.some((ticket: any) => ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered')) {
        console.warn(`DeviceNotRegistered for user ${user_id}, token ${expoPushToken}. Consider clearing the token.`);
        // Optionally, clear the invalid token from the database:
        // await supabaseAdmin.from('profiles').update({ expo_push_token: null }).eq('id', user_id);
    }

    return new Response(JSON.stringify({ success: true, expoResponse: expoResponseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('General error in Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-expo-push-notification' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"user_id":"YOUR_USER_ID", "title":"Test Title", "message":"Test Message Body", "data": { "screen": "TestScreen"}}' 

*/

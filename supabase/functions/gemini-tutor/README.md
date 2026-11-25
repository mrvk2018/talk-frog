# gemini-tutor Edge Function

Deploy:

```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set GEMINI_MODEL=gemini-2.0-flash
supabase functions deploy gemini-tutor
```

The client calls `supabase.functions.invoke('gemini-tutor', { body: {...} })`.
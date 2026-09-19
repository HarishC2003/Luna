-- Migration 006: Push Tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- RLS Policies
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own push tokens" 
    ON public.push_tokens 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own push tokens" 
    ON public.push_tokens 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" 
    ON public.push_tokens 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" 
    ON public.push_tokens 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Admins need full access to select tokens
CREATE POLICY "Admins can select all push tokens" 
    ON public.push_tokens 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

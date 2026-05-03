import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePartnerToken } from '@/lib/partner/token-generator';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { enabled } = await request.json();
    const adminSupabase = createAdminClient();

    let token = null;
    if (enabled) {
      // Generate token if enabling for first time
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('partner_share_token')
        .eq('id', user.id)
        .single();
      
      token = profile?.partner_share_token || generatePartnerToken();
    }

    const { error } = await adminSupabase
      .from('profiles')
      .update({
        partner_share_enabled: enabled,
        partner_share_token: token,
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ enabled, token });
  } catch (error) {
    console.error('Partner share error:', error);
    return NextResponse.json({ error: 'Failed to update partner share settings' }, { status: 500 });
  }
}

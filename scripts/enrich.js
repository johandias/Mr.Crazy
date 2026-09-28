const fs = require('fs');
let code = fs.readFileSync('src/app/api/realtime/session/route.ts', 'utf-8');

const replacement = `
    const user = await getCurrentUser();
    if (user) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase');
        if (supabaseAdmin) {
          const { data: moduleProgress } = await supabaseAdmin
            .from('mrcrazy_module_progress')
            .select('*')
            .eq('user_email', user.email);
            
          const { data: practiceSessions } = await supabaseAdmin
            .from('mrcrazy_practice_sessions')
            .select('id')
            .eq('user_email', user.email);
            
          const completedModules = (moduleProgress || []).filter(p => p.status === 'completed');
          let computedLevel = user.learning_level || 'basic';
          if (completedModules.length >= 4) computedLevel = 'intermediate';
          if (completedModules.length >= 8) computedLevel = 'advanced';
          
          user.computedLevel = computedLevel;
          user.sessionsCount = practiceSessions ? practiceSessions.length : 0;
          
          // Módulo atual em progresso
          const inProgress = (moduleProgress || []).find(p => p.status === 'in_progress');
          if (inProgress) {
            user.activeModuleProgress = inProgress;
          }
        }
      } catch(e) {
        console.error('Failed to enrich user profile for realtime session:', e);
      }
    }
`;

code = code.replace('const user = await getCurrentUser();', replacement);
fs.writeFileSync('src/app/api/realtime/session/route.ts', code);

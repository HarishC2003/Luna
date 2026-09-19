const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === 'route.ts') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix _request to request
      content = content.replace(/async function \w+\(_request: Request/, match => match.replace('_request', 'request'));
      content = content.replace(/async function \w+\(_request: Request, /, match => match.replace('_request', 'request'));
      
      const oldAuthBlock = `    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();`;
      
      const newAuthBlock = `    const authHeader = request.headers.get('authorization');
    let user;
    const admin = createAdminClient();

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data } = await admin.auth.getUser(token);
      user = data?.user;
    } else {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }`;

      if (content.includes(oldAuthBlock)) {
        content = content.replace(oldAuthBlock, newAuthBlock);
        
        // Remove the redundant 'const admin = createAdminClient();' later in the function
        // Need to be careful. Let's just remove the FIRST occurrence of "const admin = createAdminClient();" 
        // that appears after our new block.
        const idx = content.indexOf('const admin = createAdminClient();', content.indexOf(newAuthBlock) + newAuthBlock.length);
        if (idx !== -1) {
          content = content.substring(0, idx) + content.substring(idx + 'const admin = createAdminClient();\n'.length);
        }
        
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, '../src/app/api/admin'));
console.log('Done');

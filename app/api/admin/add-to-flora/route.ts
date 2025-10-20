import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { user_id, store_name, email } = await request.json();

    if (!user_id || !store_name || !email) {
      return NextResponse.json({
        success: false,
        message: 'user_id, store_name, and email are required'
      }, { status: 400 });
    }

    const slug = store_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Execute PHP directly on server via SSH
    const sshCommand = `
      cat > /tmp/sg_key << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABBb3iEPAi
5vUGQ8GtWiQ2/gAAAAGAAAAAEAAAAzAAAAC3NzaC1lZDI1NTE5AAAAIHDRvgzq6xe+xJL4
6O2gCJgSDoLlQWl3aey63mIKsFg5AAAAkHdSxKJAIou2TA6cLnNLk7puikaMkkd3Y65sbV
zBccC4IF6VyUPeUx1JzuHjbJumHQSiia9QFw0JRcqQCbDP2tBvNKLIRgwpedf9Nlls91yW
RzHTmI6E7HpCtqbdqE5Cbg1wREIJkqR/qB+lyVbsV8Ts0Rbe1++oXBb1KeIMLvWepyScHs
2kTyd6BLoBlpc3wQ==
-----END OPENSSH PRIVATE KEY-----
EOF
      chmod 600 /tmp/sg_key
      ssh -o StrictHostKeyChecking=no -i /tmp/sg_key -p 18765 u2736-pgt6vpiklij1@gvam1142.siteground.biz "cd public_html && php -r \\\"
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

global \\\\\\\$wpdb;

\\\\\\\$wpdb->insert(
    \\\\\\\$wpdb->prefix . 'flora_vendors',
    array(
        'user_id' => ${user_id},
        'store_name' => '${store_name.replace(/'/g, "\\'")}',
        'slug' => '${slug}',
        'email' => '${email}',
        'verified' => 1,
        'featured' => 0,
        'created_at' => current_time('mysql')
    ),
    array('%d', '%s', '%s', '%s', '%d', '%d', '%s')
);

echo json_encode(array('vendor_id' => \\\\\\\$wpdb->insert_id));

wp_cache_flush();
if (function_exists('opcache_reset')) {
    opcache_reset();
}
\\\""
      rm -f /tmp/sg_key
    `;

    const { stdout, stderr } = await execAsync(sshCommand);

    if (stderr && !stderr.includes('Warning')) {
      console.error('SSH Error:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor added to Flora Matrix database',
      output: stdout,
      user_id,
      store_name,
      slug
    });

  } catch (error: any) {
    console.error('Add to Flora error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to add vendor to Flora Matrix',
      error: error.toString()
    }, { status: 500 });
  }
}


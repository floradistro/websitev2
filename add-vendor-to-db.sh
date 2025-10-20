#!/bin/bash
# Add vendor to Flora Matrix database via SSH

USER_ID=$1
STORE_NAME=$2
EMAIL=$3

if [ -z "$USER_ID" ] || [ -z "$STORE_NAME" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <user_id> <store_name> <email>"
    exit 1
fi

# Create slug from store name
SLUG=$(echo "$STORE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')

# Create temporary SSH key
cat > /tmp/sg_key << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAGAAAABAY1jLquc
5pDoVsBZtioB1bAAAAGAAAAAEAAAAzAAAAC3NzaC1lZDI1NTE5AAAAIG60MJumbldbv24c
enZf6pfU4lzvOPjThbistRKI8zjUAAAAkDE9CSc2FE4ZDEpJtV49CythR/OG3ssJ6FYIkr
Hc3jOgns2ZTTT1xsQpoGMGHGZBPAygEQVAQphnTjZW5CvdUiqbdTx75a7NH3zM83chIKjr
16nO0zO2JmMf7W7z8AylTbUks5PzkgFpXjy1l+1CWb9DEsdYjmnyz1TWyK26msztUuSvEl
HGqWt/GyG8suaoJA==
-----END OPENSSH PRIVATE KEY-----
EOF
chmod 600 /tmp/sg_key

# Run MySQL via SSH
ssh -i /tmp/sg_key -p 18765 u2736-pgt6vpiklij1@gvam1142.siteground.biz << ENDSSH
cd public_html
php -r "
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

global \\\$wpdb;
\\\$user_id = ${USER_ID};
\\\$store_name = '${STORE_NAME}';
\\\$slug = '${SLUG}';
\\\$email = '${EMAIL}';

// Check if exists
\\\$exists = \\\$wpdb->get_var(\\\$wpdb->prepare(
    \"SELECT id FROM {\\\$wpdb->prefix}flora_vendors WHERE user_id = %d\",
    \\\$user_id
));

if (\\\$exists) {
    \\\$wpdb->update(
        \\\$wpdb->prefix . 'flora_vendors',
        ['store_name' => \\\$store_name, 'email' => \\\$email, 'slug' => \\\$slug, 'verified' => 1],
        ['user_id' => \\\$user_id],
        ['%s', '%s', '%s', '%d'],
        ['%d']
    );
    echo json_encode(['success' => true, 'vendor_id' => \\\$exists, 'action' => 'updated']);
} else {
    \\\$wpdb->insert(
        \\\$wpdb->prefix . 'flora_vendors',
        [
            'user_id' => \\\$user_id,
            'store_name' => \\\$store_name,
            'slug' => \\\$slug,
            'email' => \\\$email,
            'verified' => 1,
            'featured' => 0,
            'created_at' => current_time('mysql')
        ],
        ['%d', '%s', '%s', '%s', '%d', '%d', '%s']
    );
    echo json_encode(['success' => true, 'vendor_id' => \\\$wpdb->insert_id, 'action' => 'created']);
}

wp_cache_flush();
if (function_exists('opcache_reset')) {
    opcache_reset();
}
"
ENDSSH

# Cleanup
rm -f /tmp/sg_key


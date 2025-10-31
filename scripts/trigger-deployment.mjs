#!/usr/bin/env node

const VERCEL_TOKEN = 'fZ2Zb0MmcwbtIj0zYcBQTXiv'

async function triggerDeployment() {
  console.log('🚀 Triggering Vercel deployment...\n')

  try {
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'flora-distro-flora',
        gitSource: {
          type: 'github',
          org: 'floradistro',
          repo: 'flora-distro-flora',
          ref: 'main'
        },
        target: 'production'
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Deployment triggered successfully!')
      console.log(`   Deployment ID: ${data.id}`)
      console.log(`   URL: ${data.url}`)
      console.log(`   Status: ${data.readyState}`)
      console.log(`\n🌐 Your app will be live at: https://${data.url}`)
      console.log('\n⏳ Deployment typically takes 30-60 seconds...')

      // Poll deployment status
      console.log('\n📊 Checking deployment status...')
      await checkDeploymentStatus(data.id)
    } else {
      console.error('❌ Failed to trigger deployment')
      console.error('   Error:', data.error?.message || JSON.stringify(data))
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function checkDeploymentStatus(deploymentId) {
  let attempts = 0
  const maxAttempts = 20 // 20 attempts * 5 seconds = 100 seconds max

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        const status = data.readyState
        console.log(`   [${new Date().toLocaleTimeString()}] Status: ${status}`)

        if (status === 'READY') {
          console.log('\n✅ Deployment complete!')
          console.log(`🌐 Live at: https://${data.url}`)
          return
        } else if (status === 'ERROR' || status === 'CANCELED') {
          console.log(`\n❌ Deployment ${status.toLowerCase()}`)
          if (data.error) {
            console.log('   Error:', data.error.message)
          }
          return
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
      } else {
        console.error('   Error checking status:', data.error?.message)
        return
      }
    } catch (error) {
      console.error('   Error:', error.message)
      return
    }
  }

  console.log('\n⏳ Deployment is still building. Check Vercel dashboard for details.')
}

triggerDeployment()

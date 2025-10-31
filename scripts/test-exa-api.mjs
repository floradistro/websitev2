#!/usr/bin/env node

import Exa from 'exa-js'
import fs from 'fs'

// Load env
const envPath = '/Users/whale/Desktop/Website/.env.local'
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const exaKey = process.env.EXA_API_KEY || process.env.EXASEARCH_API_KEY

console.log('Testing Exa API...')
console.log('API Key:', exaKey ? `${exaKey.substring(0, 10)}...` : 'NOT FOUND')

if (!exaKey) {
  console.error('❌ No Exa API key found!')
  process.exit(1)
}

try {
  const exa = new Exa(exaKey)

  console.log('\n🔍 Searching: "apple.com homepage design"')

  const results = await exa.searchAndContents('apple.com homepage design layout', {
    numResults: 3,
    text: true,
    highlights: true
  })

  console.log(`\n✅ Found ${results.results.length} results:\n`)

  results.results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`)
    console.log(`   URL: ${r.url}`)
    console.log(`   Text: ${r.text?.substring(0, 150)}...`)
    console.log('')
  })

  console.log('✅ Exa API is working!')

} catch (error) {
  console.error('❌ Exa API error:', error.message)
  console.error('Full error:', error)
  process.exit(1)
}

const https = require('https')
const http = require('http')

const SHOPIFY_DOMAIN = 'casanuccia.myshopify.com'
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  // Set CORS on all responses
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

if (req.url !== '/proxy' && req.url !== '/proxy/') {
  res.writeHead(404)
  res.end('Not found')
  return
}

if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method not allowed')
    return
  }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    let parsed
    try {
      parsed = JSON.parse(body)
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const { query, variables } = parsed
    const payload = JSON.stringify({ query, variables })

    console.log('Calling Shopify:', SHOPIFY_DOMAIN)
    console.log('Token exists:', !!SHOPIFY_TOKEN)
    
    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: '/admin/api/2025-04/graphql.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      },
    }

    const shopifyReq = https.request(options, shopifyRes => {
      let data = ''
      shopifyRes.on('data', chunk => data += chunk)
      shopifyRes.on('end', () => {
        res.writeHead(shopifyRes.statusCode, { 'Content-Type': 'application/json' })
        res.end(data)
      })
    })

    shopifyReq.on('error', err => {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    })

    shopifyReq.write(payload)
    shopifyReq.end()
  })
}).listen(process.env.PORT || 3000, () => {
  console.log('Casa Nuccia proxy running on port', process.env.PORT || 3000)
})

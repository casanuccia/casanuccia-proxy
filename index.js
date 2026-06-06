const https = require('https')

const SHOPIFY_DOMAIN = 'casanuccia.myshopify.com'
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN

require('http').createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
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
    try { parsed = JSON.parse(body) }
    catch (e) { res.writeHead(400); res.end('Invalid JSON'); return }

    const { query, variables } = parsed
    const payload = JSON.stringify({ query, variables })

    const options = {
      hostname: SHOPIFY_DOMAIN,
      path: '/admin/api/2024-01/graphql.json',
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
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message }))
    })

    shopifyReq.write(payload)
    shopifyReq.end()
  })
}).listen(process.env.PORT || 3000, () => console.log('Proxy running'))

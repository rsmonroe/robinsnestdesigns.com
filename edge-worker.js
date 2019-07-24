const origins = {
  'www.robinsnestdesigns.com': 'https://ylovt93etb.execute-api.us-east-1.amazonaws.com/prod/',
  'dev.robinsnestdesigns.com': 'https://bfowcpbde6.execute-api.us-east-1.amazonaws.com/dev/',
}

const routes = [
  {
    "src": "/whats_new.cfm",
    "status": 301,
    "headers": {
      "Location": "/search?onSaleOnly=true&sortOrder=mostRecent"
    }
  },
  {
    "src": "/add_to_cart.cfm",
    "status": 301,
    "headers": {
      "Location": "/cart"
    }
  },
  {
    "src": "/wish_list.cfm",
    "status": 301,
    "headers": {
      "Location": "/wishlist"
    }
  },
  {
    "src": "/Newsletters/newsletter-signup.cfm",
    "status": 301,
    "headers": {
      "Location": "/subscribe"
    }
  },
  {
    "src": "/search.cfm",
    "status": 301,
    "headers": {
      "Location": "/categories"
    }
  },
  {
    "src": "/sitemap.xml",
    "dest": "sitemap",
    "headers": {
      "cache-control": "public,max-age=86400,s-maxage=86400"
    }
  },
  {
    "src": "/product/(?<productId>\\w+).*",
    "dest": "product?productId=$productId",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/categories",
    "dest": "categories",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/category/(?<categoryId>\\w+).*",
    "dest": "category?categoryId=$categoryId",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/order/(?<orderId>\\w+).*",
    "dest": "order?orderId=$orderId",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/search/c/(?<categoryId>\\w+)/sc/(?<subcategoryId>\\w+)/p/(?<pageNo>\\d+)",
    "dest": "search?categoryId=$categoryId&subcategoryId=$subcategoryId&pageNo=$pageNo",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/search/c/(?<categoryId>\\w+)/sc/(?<subcategoryId>\\w+)",
    "dest": "search?categoryId=$categoryId&subcategoryId=$subcategoryId",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/search/c/(?<categoryId>\\w+)/p/(?<pageNo>\\d+)",
    "dest": "search?categoryId=$categoryId&pageNo=$pageNo",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/search/c/(?<categoryId>\\w+)",
    "dest": "search?categoryId=$categoryId",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/search/p/(?<pageNo>\\d+)",
    "dest": "search?pageNo=$pageNo",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/search.*",
    "dest": "search",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/admin/product-details/(?<productId>\\w+).*",
    "dest": "admin/product-details?productId=$productId"
  },
  {
    "src": "/admin/category-details/(?<categoryId>\\w+).*",
    "dest": "admin/category-details?categoryId=$categoryId"
  },
  {
    "src": "/",
    "dest": "",
    "headers": {
      "cache-control": "s-maxage=300, max-age=0"
    }
  },
  {
    "src": "/(?<requestPath>.*\\.cfm)",
    "dest": "redirect/$requestPath"
  },
  {
    "src": "/(.+)",
    "dest": "$1"
  }
]

const paramRegexp = /(\$\w+)/

const replaceParams = ({ str, match }) => {
  while (paramRegexp.test(str)) {
    const [ , groupName ] = str.match(paramRegexp)
    const stripped = groupName.slice(1)
    const groupValue = match[stripped] || match.groups[stripped]
    str = str.replace(groupName, groupValue)
  }
  return str
}

function combineQueryString(urlA, urlB) {
  const searchParams = {}
  for (const [ key, value ] of urlA.searchParams) {
    searchParams[key] = value
  }
  for (const [ key, value ] of urlB.searchParams) {
    searchParams[key] = value
  }
  return Object.entries(searchParams).map(([ k, v ]) => k + '=' + v).join('&')
}

async function proxyUrl({ request, match, dest, headers, originServer }) {
  dest = replaceParams({ str: dest, match })
  const requestUrl = new URL(request.url)
  let originUrl = new URL(dest, originServer)
  const queryStr = combineQueryString(requestUrl, originUrl)
  if (queryStr) originUrl.search = '?' + queryStr
  const originRequest = new Request(originUrl, request)
  console.log('proxyUrl', requestUrl.toString(), '=>', originUrl.toString(), originRequest)
  try {
    const originResponse = await fetch(originRequest)

    // pipe body from origin
    let { readable, writable } = new TransformStream()
    originResponse.body.pipeTo(writable)

    const response =  new Response(readable, originResponse)
    // merge response headers & edge headers
    for (const key in headers) {
      response.headers.set(key, headers[key])
    }
    return response
  } catch (err) {
    console.error(err)
    return new Response("Origin Error: " + err, { status: err.status || 502 })
  }
}

async function sendStatus({ request, status, headers }) {
  const requestHost = new URL(request.url).origin
  const redirectUrl = new URL(headers['Location'], requestHost)
  console.log('Redirect', redirectUrl.toString(), status)
  return Response.redirect(redirectUrl, status)
}

async function handleRequest(request) {
  const url = new URL(request.url)

  let [ subdomain, domain, tld ] = url.hostname.split('.')

  if (tld == null) {
    url.hostname = [ 'www', domain, tld ].join('.')
    return Response.redirect(url, 301)
  }

  if (subdomain == 'beta') {
    url.hostname = [ 'www', domain, tld ].join('.')
    return Response.redirect(url, 301)
  }

  const originServer = origins[url.hostname]
  if (!originServer) {
    console.log('Passthrough', url.toString(), request)
    return await fetch(request)
  }
  const pathname = new URL(request.url).pathname
  for (const routeCfg of routes) {
    const { src, dest, status, headers, } = routeCfg
    if (!routeCfg._regex)
      routeCfg._regex = new RegExp('^' + src + '$')
    const match = pathname.match(routeCfg._regex)
    if (match) {
      // reverse proxy response
      if (dest != undefined) {
        return await proxyUrl({ request, match, dest, headers, originServer })
      } else {
        return await sendStatus({ request, status, headers })
      }
    }
  }
  return new Response("Not found", { status: 404 })
}

addEventListener('fetch', event => {
  event.passThroughOnException()
  return event.respondWith(handleRequest(event.request))
})

/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type')
  if (contentType.includes('application/json')) {
    return await response.json()
  } else if (contentType.includes('application/text')) {
    return await response.text()
  } else if (contentType.includes('text/html')) {
    return await response.text()
  } else {
    return await response.text()
  }
}

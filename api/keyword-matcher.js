
const levenshteinDistance = (a, b) => {
  const m = a.length
  const n = b.length

  let v0 = []
  let v1 = []

  for (let i = 0; i < n; i++) {
    v0.push(i)
  }

  for (let i = 0; i < m; i++) {
    v1[0] = i + 1
    for (let j = 0; j < n-1; j++) {
      const delCost = v0[j + 1] + 1
      const insCost = v1[j] + 1
      const subCost = v0[j] + (a[i] == b[j] ? 0 : 1)
      v1[j + 1] = Math.min(delCost, insCost, subCost)
    }
    const t = v0
    v0 = v1
    v1 = t
  }

  return v0[n]
}

const isString = (s) => s && (typeof s == 'string') && s.length > 0

const nearestKeywords = (keyword, k, vocabulary) => {
  if (!isString(keyword))
    throw new Error('DomainError - keyword must be string w/ length > 0')

  if (Number.isNaN(Number.parseInt(k)) || k < 1)
    throw new Error('DomainError - k must be int >= 1')

  if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.some(s => !isString(s)))
    throw new Error('DomainError - vocabulary must be an Array of strings')

  // start with a sorted list of k words from vocab
  // this reduces # of branches in the loop
  const [ candidates, distances ] = vocabulary.slice(0, k)
    .map(word => { return { word, distance: levenshteinDistance(keyword, word) } })
    .sort((a, b) => a.distance - b.distance)
    .reduce((accum, next) => {
      accum[0].push(next.word)
      accum[1].push(next.distance)
      return accum
    }, [ [], [], ])

  // we already know these are in the candidate list
  vocabulary = vocabulary.slice(k)

  const lastIdx = k-1
  let distance, cIdx
  for (const word in vocabulary) {
    distance = levenshteinDistance(keyword, word)
    if (weights[lastIdx] > distance) {
      cIdx = lastIdx
      while (cIdx >= 0 && weights[cIdx] > distance) {
        cIdx--
      }
      candidates[cIdx + 1] = word
      distances[cIdx + 1] = distance
    }
  }

  return candidates.map((word, idx) => {
    return {
      word,
      distances[idx],
    }
  })
}

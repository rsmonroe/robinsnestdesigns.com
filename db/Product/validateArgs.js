const validateArgs = (args) => {
  args = Object.assign({}, { skip: 0, limit: 50, sort: 'relevancy' }, args)
  if (args.limit > 200) args.limit = 200
  if (args.skip < 0) args.skip = 0
  return args
}

module.exports = validateArgs

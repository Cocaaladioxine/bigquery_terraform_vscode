// (c) 2007 Steven Levithan <stevenlevithan.com>
// MIT License
// => Code from https://github.com/jbnicolai/match-recursive/tree/master
// See LICENSE.md
// Edit 2022 Simon RICHELLE :
// I added a parameter "starter".
// It's a string that has to be in front of the enclosed array {} / [] / ...
// It helps me to find a specific array
// TODO :
// - It would be interesting to make it optional (regular behavior / improved behavior)
// - It should be a regexp. But it could provides multiple results...

/** * matchRecursive
  accepts a string to search and a format (start and end tokens separated by "...").
  returns an array of matches, allowing nested instances of format.
  examples:
    matchRecursive("test",          "(...)")   -> []
    matchRecursive("(t(e)s)()t",    "(...)")   -> ["t(e)s", ""]
    matchRecursive("t<e>>st",       "<...>")   -> ["e"]
    matchRecursive("t<<e>st",       "<...>")   -> ["e"]
    matchRecursive("t<<e>>st",      "<...>")   -> ["<e>"]
    matchRecursive("<|t<e<|s|>t|>", "<|...|>") -> ["t<e<|s|>t"]
*/

module.exports = (function () {
  const formatParts = /^([\S\s]+?)\.\.\.([\S\s]+)/
  const metaChar = /[-[\]{}()*+?.\\^$|,]/g

  function escape (str) {
    return str.replace(metaChar, '\\$&')
  }

  function validateParts (p) {
    if (!p) {
      throw new Error("format must include start and end tokens separated by '...'")
    }

    if (p[1] === p[2]) {
      throw new Error('start and end format tokens cannot be identical')
    }
  }

  return function (str, starter, format) {
    const p = formatParts.exec(format)
    validateParts(p)

    const opener = p[1]
    const closer = p[2]
    /* Use an optimized regex when opener and closer are one character each */
    const start = starter.length > 0 ? '|' + escape(starter) : ''
    const iterator = new RegExp(format.length === 5 && start.length === 0 ? '[' + escape(opener + closer) + ']' : escape(opener) + '|' + escape(closer) + start, 'g')
    const results = []
    let openTokens; let matchStartIndex; let match; let started

    do {
      openTokens = 0
      started = false
      while (match = iterator.exec(str)) {
        if (match[0] === starter) {
          started = true
        }
        if (match[0] === opener && started) {
          if (!openTokens) {
            matchStartIndex = iterator.lastIndex
          }
          openTokens++
        } else if (openTokens && started) {
          openTokens--
          if (!openTokens) {
            results.push(str.slice(matchStartIndex, match.index))
            started = false
          }
        }
      }
    } while (openTokens && (iterator.lastIndex = matchStartIndex))

    return results
  }
})()

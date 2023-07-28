module.exports = function substrHTML(string, length) {
  let m
  const r = /<([^>\s]*)[^>]*>/g
  const stack = []
  let lasti = 0
  let result = ''

  const unicodeArray = Array.from(string)

  while ((m = r.exec(unicodeArray.join(''))) && length) {
    const temp = unicodeArray.slice(lasti, m.index).join('').substr(0, length)
    result += temp
    length -= Array.from(temp).length
    lasti = r.lastIndex

    if (length) {
      result += m[0]
      if (m[1].indexOf('/') === 0) stack.pop()
      else if (m[1].lastIndexOf('/') !== m[1].length - 1) stack.push(m[1])
    }
  }

  result += unicodeArray.slice(lasti, length).join('')

  while (stack.length) {
    result += '</' + stack.pop() + '>'
  }

  return result
}

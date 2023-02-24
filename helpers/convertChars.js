const convert = (str) => {
  if(typeof str !== 'string') return str

  const chars = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }

  return str.replace(/[<>&]/g, (s) => {
    return chars[s]
  })
}

module.exports = convert

/**
 * Module dependencies.
 */

var crypto = require('crypto')
var path = require('path')
var fs = require('mz/fs')

/**
 * Expose.
 */

exports = module.exports = extend
// hard to name...
exports.init =
exports.rev = rev

/**
 * Create a revision function for assets building.
 */

function rev(opts) {
  opts = opts || {}

  // defaults
  opts.manifest = opts.manifest || 'manifest.json'

  return function *revision(dest, data) {
    var hash = crypto
      .createHash('md5')
      .update(data)
      .digest('hex')
      .slice(0, 8)
    var dir = path.dirname(dest)
    var ext = path.extname(dest)
    var name = path.basename(dest)
    var newName = path.basename(dest, ext) + '-' + hash + ext

    yield fs.writeFile(dir + '/' + newName, data)

    try {
      var manifest = yield fs.readFile(opts.manifest)
      manifest = JSON.parse(manifest.toString())
    } catch (err) {}

    if (typeof manifest != 'object') manifest = {}
    manifest[name] = newName

    yield fs.writeFile(opts.manifest, JSON.stringify(manifest))
  }
}

/**
 * Extend koa app.
 */

function extend(app, opts) {
  opts = opts || {}

  // defaults
  opts.path = opts.path || 'manifest.json'
  'cache' in opts || (opts.cache = app.env == 'production')

  var manifest

  app.use(function *revision(next) {
    if (!this.accepts('html')) return yield next

    if (!manifest || !opts.cache) {
      manifest = JSON.parse(yield fs.readFile(opts.path, { encoding: 'utf8' }))
    }

    this.state.rev = manifest
    yield next
  })
}

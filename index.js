/**
 * Module dependencies.
 */

var crypto = require('crypto')
var path = require('path')
var fs = require('mz/fs')
var cp = require('mz/child_process')
var MANIFEST_PATH = 'manifest.json'

/**
 * Expose.
 */

exports = module.exports = extend
// hard to name...
exports.init =
exports.rev = rev
exports.processFiles = processFiles
exports.setManifestPath = setManifestPath

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

    yield cp.exec(`mkdir -p ${dir}`)
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
 * Revisionify files and update the content of manifest file.
 *
 * @param {String...} variable file path
 * @api public
 */

function* processFiles() {
  var files = [].slice.call(arguments)
  var results = yield files.map(rename)

  var manifest = {}

  results.forEach(function (v) {
    manifest[v.oldName] = v.newName
  })

  yield updateManifest(manifest)
}

/**
 * Update manifest file content.
 *
 * @param {Object}
 * @api private
 */

function* updateManifest(obj) {
  try {
    var manifest = JSON.parse(
      yield fs.readFile(MANIFEST_PATH, {encoding: 'utf8'})
    )
  } catch (err) {}

  if (typeof manifest != 'object') manifest = {}

  for (var k in obj) {
    manifest[k] = obj[k]
  }

  yield fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest))
}

/**
 * Rename a file, return paths object.
 *
 * @param {String} file path
 * @return {Object} paths object
 * @api private
 */

function* rename(file) {
  var data = yield fs.readFile(file)

  var o = makePath(file, hash(data))

  yield fs.rename(o.oldPath, o.newPath)

  return o
}

/**
 * Calculate a md5 string for certain data.
 *
 * @param {Buffer | String}
 * @return {String} md5 string
 * @api private
 */

function hash(data) {
  return crypto
    .createHash('md5')
    .update(data)
    .digest('hex')
    .slice(0, 8)
}

/**
 * Take a path string and a flag, generate a set of parsed paths.
 *
 * @param {String} file path
 * @param {String} hash string
 * @return {Object} paths object
 * @api private
 */

function makePath(oldPath, hash) {
  var dir = path.dirname(oldPath)
  var oldName = path.basename(oldPath)
  var ext = path.extname(oldPath)
  var newName = path.basename(oldName, ext) + '-' + hash + ext

  return {
    oldPath: oldPath,
    oldName: oldName,
    newName: newName,
    newPath: dir + '/' + newName
  }
}

/**
 * Set path of manifest json file.
 *
 * @param {String} path
 * @api public
 */

function setManifestPath(path) {
  MANIFEST_PATH = path
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

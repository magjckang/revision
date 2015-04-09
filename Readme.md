# Revision

Independent static asset revisioning tool, with a koa extension included.

## Install

```
$ npm install static-revision
```

## API

### .rev([options])

Return a function which will write data to a file with proper hash suffix in filename and write mapping info to manifest file.

```js
var rev = require('static-revision').rev({path: 'manifest.json'})

var data = yield Duo(root).entry('client/app.js').run()
yield rev('build/app.js', data)
```

Now in `build` directory you have `app-79894c6c.js`, in project root you have a `manifest.json` file contains:

```
{"app.js": "app-79894c6c.js"}
```

Note: it will **NOT** clear the content of manifest file but try to merge new content into it.

#### options.manifest

Path of manifest file, default to `manifest.json`.

### cachable(app[, options])

Extend your koa app with some options:

```js
var koa = require('koa')()
var revision = require('static-revision')

revision(app, {
  manifest: 'manifest.json',
  cache: true
})
```

this will read from manifest file and expose to `this.state.rev`.

```
<script src="/static/{{ rev['app.js'] }}"></script>
```

#### options.manifest

Path of manifest file to read from, default to `mannifest.json`.

#### options.cache

Indicate whether to read manifest on each request, default to `app.env == 'production'`.

## License

MIT

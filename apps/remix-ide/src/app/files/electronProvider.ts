import FileProvider from "./fileProvider"


declare global {
  interface Window {
    remixFileSystem: any
  }
}

export class ElectronProvider extends FileProvider {
  _appManager: any
  constructor(appManager) {
    super('')
    this._appManager = appManager

  }

  async init() {
    this._appManager.on('fs', 'change', (event, path) => {
      switch (event) {
        case 'add':
          this.event.emit('fileAdded', path)
          break
        case 'unlink':
          this.event.emit('fileRemoved', path)
          break
        case 'change':
          this.get(path, (_error, content) => {
            this.event.emit('fileExternallyChanged', path, content, false)
          })
          break
        case 'rename':
          this.event.emit('fileRenamed', path)
          break
        case 'addDir':
          this.event.emit('folderAdded', path)
          break
        case 'unlinkDir':
          this.event.emit('fileRemoved', path)
      }
    })
  }

  // isDirectory is already included
  // this is a more efficient version of the default implementation
  async resolveDirectory(path, cb) {
    console.log('resolveDirectory', path)
    console.log('start', new Date(new Date().getTime()).toLocaleTimeString())
    path = this.removePrefix(path)
    if (path.indexOf('/') !== 0) path = '/' + path
    try {
      const files = await window.remixFileSystem.readdir(path)
      const ret = {}
      if (files) {
        for (const element of files) {
          path = path.replace(/^\/|\/$/g, '') // remove first and last slash
          const file = element.file.replace(/^\/|\/$/g, '') // remove first and last slash
          const absPath = (path === '/' ? '' : path) + '/' + file
          ret[absPath.indexOf('/') === 0 ? absPath.substr(1, absPath.length) : absPath] = { isDirectory: element.isDirectory }
          // ^ ret does not accept path starting with '/'
        }
      }
      //console.log(ret, 'ret resolveDirectory ELECTRON')
      console.log('end', new Date(new Date().getTime()).toLocaleTimeString())
      if (cb) cb(null, ret)
      return ret
    } catch (error) {
      if (cb) cb(error, null)
    }
  }

  /**
 * Removes the folder recursively
 * @param {*} path is the folder to be removed
 */
  async remove(path: string) {
    console.log('remove', path)
    try {
      await window.remixFileSystem.rmdir(path)
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }

}
import * as chokidar from 'chokidar';
import * as webpack from 'webpack';
import MemoryFs = require('memory-fs');
import { TestServer } from './TestServer';

export class FileServer {
  private testServer: TestServer;
  private options: any;
  private fileSystem: MemoryFs;
  private bundleCache: Map<string, webpack.Compiler.Watching>;

  constructor(testServer: TestServer, options: any) {
    this.testServer = testServer;
    this.options = options;
    this.fileSystem = new MemoryFs();
    this.bundleCache = new Map<string, webpack.Compiler.Watching>();
  }

  getFileNames() {
    return Array.from(this.bundleCache.keys());
  }

  listFilesEvent() {
    return {
      type: 'list_files',
      files: this.getFileNames()
    };
  }

  getFile(fileName: string) {
    return new Promise((resolve, reject) => {
      this.fileSystem.readFile(`/bundles/${fileName}`, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  createFileCompiler(fullPath: string, fileName: string) {
    const compiler = webpack({
      mode: 'development',
      entry: fullPath,
      watch: true,
      devtool: 'inline-source-map',
      output: {
        path: '/bundles',
        filename: fileName
      },
      optimization: {
        noEmitOnErrors: true
      }
    });

    compiler.outputFileSystem = this.fileSystem;

    compiler.hooks.done.tap('afterEmit', stats => {
      this.testServer.runner.analyzeFile(fileName);

      this.testServer.notifyClients({
        type: 'recompilation',
        file: `/bundles/${fileName}`,
        stats: stats.toJson()
      });
    });

    return compiler.watch({}, (error, stats) => {
      // TODO handle compilation errors here?
      if (error) console.error(error);
      // console.log(stats.toString());
    });
  }

  addFile(fullPath: string) {
    const fileName = fullPath.replace(this.options.rootDir, '').replace(/^\/+/, '');
    this.bundleCache.delete(fileName);
    const watchingCompiler = this.createFileCompiler(fullPath, fileName);
    this.bundleCache.set(fileName, watchingCompiler);

    this.testServer.notifyClients({
      type: 'fileAdded',
      fileName
    });
  }

  removeFile(fullPath: string) {
    const fileName = fullPath.replace(this.options.rootDir, '').replace(/^\/+/, '');
    const watchingCompiler = this.bundleCache.get(fileName);
    if (watchingCompiler) watchingCompiler.close(() => {});
    this.bundleCache.delete(fileName);
    this.testServer.notifyClients(this.listFilesEvent());
  }

  startWatching() {
    const { testFilePattern, rootDir } = this.options;

    chokidar
      .watch(testFilePattern.replace('<rootDir>', rootDir), {
        ignored: /node_modules|^\./
      })
      .on('add', path => this.addFile(path))
      .on('unlink', path => this.removeFile(path));
  }
}

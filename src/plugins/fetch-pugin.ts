import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
  name: 'filecache',
});

export const fetchplugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      // In this example onLoad only works with files with attibute namespace 'a'.
      // Namespace attribute was settled on onResolve method
      // build.onLoad({ filter: /.*/, namespace: 'a' }, async (args: any) => {
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);
 
        // if the build is trying to get index file from the local storage, 
        // we give what the build needs...the contents
        // Contents has "jsx" code that will be bundled.
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode,
          };
        }  
        // Check to see if we have already fetched this file
        // and if it is in the cache
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cachedResult){
          return cachedResult;
        }

        // loading from https://unpkg.com/tiny-test-pkg@1.0.0/index.js
        const {data, request} = await axios.get(args.path);

        // format the data string in order to avoid conflits when it is inserted
        // inside de style.innerText tag
        const escaped = data
          .replace(/\n/, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const fileType = args.path.match(/.css$/) ? 'css' : 'jsx';
        const contents = fileType === 'css' 
            ?
          ` const style = document.createElement('style');
            style.innerText = '${escaped}';
            document.head.appendChild(style);
          ` : data;

        // console.log( new URL('./', request.responseURL).pathname);
        const result: esbuild.OnLoadResult =  {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname //  "https://unpkg.com/nested-test-pkg@1.0.0/src/index.js"
        }
         // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
    }
  }
}

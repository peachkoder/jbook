import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
  name: 'filecache'
});
 
// indexedDB testing
// (async ()=>{
//   await fileCache.setItem('color', 'red');

//   const color = await fileCache.getItem('color');
//   console.log(color)
// ;})()

export const unpkgPathPlugin = (inputCode: string) => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) { 
      //build is the bundling process
      // onResolve look after the files, give to them an atttibute namespace 'a'
      // namespace is important to onLoad method because you can filter by namespace too

      // Handle root entry file of 'index.js'
      build.onResolve({filter: /(^index\.js$)/}, () => {
        return {path: 'index.js',namespace: 'a'}
      })

      // Handle relative paths in a module
      build.onResolve({filter: /^\.+\//}, (args: any) => {
        return {
          namespace: 'a',
          path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
        }
      })
      
        
      // Handle main file of a module
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`
        }    
      });
 
      // In this example onLoad only works with files with attibute namespace 'a'.
      // Namespace attribute was settled on onResolve method
      // build.onLoad({ filter: /.*/, namespace: 'a' }, async (args: any) => {
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);
 
        // if the build is trying to get index file from the local storage, 
        // we give what the buid needs...the contents
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
        // console.log( new URL('./', request.responseURL).pathname);
        const result: esbuild.OnLoadResult =  {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname //  "https://unpkg.com/nested-test-pkg@1.0.0/src/index.js"
        }
         // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
    },
  };
};
import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';
import { AnySoaRecord } from 'dns';

const fileCache = localforage.createInstance({
  name: 'filecache',
});

export const fetchplugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {

      build.onLoad({ filter: /(^index\.js$)/}, () => {
        return {
          loader: 'jsx',
          contents: inputCode,
        };
      });

      build.onLoad({ filter: /.css$/}, async(args: any) => {
        // Check to see if we have already fetched this file
        // and if it is in the cache
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cachedResult){
          return cachedResult;
        }

        // loading from https://unpkg.com/****/****.css
        const {data, request} = await axios.get(args.path); 
        // format the data string in order to avoid conflits when it is inserted
        // inside de style.innerText tag
        const escaped = data
          .replace(/\n/, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");
        const contents =  
          ` const style = document.createElement('style');
            style.innerText = '${escaped}';
            document.head.appendChild(style);
          `;

        // console.log( new URL('./', request.responseURL).pathname);
        const result: esbuild.OnLoadResult =  {
          loader: 'jsx', 
          contents, 
          resolveDir: new URL('./', request.responseURL).pathname //  "https://unpkg.com/nested-test-pkg@1.0.0/src/index.js"
        };
         // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
 
      // In this example onLoad only works with files with attibute namespace 'a'.
      // Namespace attribute was settled on onResolve method
      // build.onLoad({ filter: /.*/, namespace: 'a' }, async (args: any) => {
      build.onLoad({ filter: /.*/ }, async (args: any) => {
         
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        if (cachedResult){
          return cachedResult;
        }
 
        const {data, request} = await axios.get(args.path); 

        const result: esbuild.OnLoadResult =  {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname //  "https://unpkg.com/nested-test-pkg@1.0.0/src/index.js"
        };
         // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
    }
  }
}

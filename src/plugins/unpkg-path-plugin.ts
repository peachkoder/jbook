import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
 
export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {  //build is the bundling process
      // onResolve look after the files, give to them an atttibute namespace 'a'
      // namespace is important to onLoad method because you can filter by namespace too
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);
        if (args.path === 'index.js'){
          return { path: args.path, namespace: 'a' };
        }

        if (args.path.includes('./') || args.path.includes('../') ) {
          return {
            namespace: 'a',
            path: new URL(args.path, args.importer + '/').href
          }
        }

        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`
        }
        // } else if(args.path ==='tiny-test-pkg') {
        //   return { path: 'https://unpkg.com/tiny-test-pkg@1.0.0/index.js', 
        //   namespace: 'a'}
        // }     
      });
 
      // In this example onLoad only works with files with attibute namespace 'a'.
      // Namespace attribute was settled on onResolve method
      // build.onLoad({ filter: /.*/, namespace: 'a' }, async (args: any) => {
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);
 
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              const message = require('medium-test-pkg');
              console.log(message);
            `,
          };
        }  
        // loading from https://unpkg.com/tiny-test-pkg@1.0.0/index.js
        const {data} = await axios.get(args.path);
        return {
          loader: 'jsx',
          contents: data
        }
      });
    },
  };
};
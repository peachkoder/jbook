import * as esbuild from 'esbuild-wasm'; 
 
// indexedDB testing
// (async ()=>{
//   await fileCache.setItem('color', 'red');

//   const color = await fileCache.getItem('color');
//   console.log(color)
// ;})()

export const unpkgPathPlugin = () => {
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
 
      
    },
  };
};
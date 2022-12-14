import ReactDOM from "react-dom";
import React from "react";
import { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchplugin } from "./plugins/fetch-pugin";

const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    startservice();
  }, []); //[] is empty so useEffect is called just once

  const startservice = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  const onClick = async () => {
    if (!ref.current) {
      return; //don't waist my time, return immediately!
    }

    /*     const result = await ref.current.transform(input, {
      loader: "jsx", //handle the type code - language
      target: "es2015", // look for esbuild's documentation about this one
    }); */

    // build the bundle
    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchplugin(input)],
      define: {
        "process.env.NODE_ENV": '"production"', // replace with string "production"
        global: "window",
      },
    });

    //console.log(result);
    setCode(result.outputFiles[0].text);

    // try {
    //   // be carefull eval can harm you ;)
    //   eval(result.outputFiles[0].text);
    // } catch (error) {
    //   alert(error);
    // }
  };

  const html = `
  <script>
  ${code}
  </script>
`;

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
      <iframe sandbox="allow-scripts" srcDoc={html}></iframe>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#root"));

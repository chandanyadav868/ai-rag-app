"use client"

import React, { useCallback, useEffect, useState } from 'react'
import markdownit from 'markdown-it'
import hljs from 'highlight.js'

function Markdown({ text, runCopy }: { text: string, runCopy?: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [textContent, setTextContent] = useState(text);

  // const copy = (e: MouseEvent) => {
  //   const span = e.currentTarget as HTMLSpanElement;
  //   console.log("Copying text", span);

  //   const data = span.nextElementSibling?.textContent ?? ""
  //   console.log(data);

  //   navigator.clipboard.writeText(data);
  //   // span.textContent = "Copying"
  //   // setTimeout(() => {
  //   //   span.textContent = "Copy"
  //   // }, 500);
  // }

  const md = markdownit({
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<div style="position: relative;">
                <pre><code class="hljs">${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>
              </div>`;
        } catch (__) { }
      }

      return ''; // use external default escaping
    }
  });



  // useEffect(() => {

  //   const root = containerRef.current;
  //   if (!root) return;

  //   if (!runCopy) {
  //     const elems = root.querySelectorAll("span.copy") as NodeListOf<HTMLSpanElement>;
  //     console.log("Added event listeners for copy", elems);

  //     elems.forEach((el) => {
  //       el.textContent = "Clicked to Copying"; // Reset text to "Copy"
  //       el.addEventListener("click", copy)
  //     });

  //     return () => {
  //       elems.forEach((el) => el.removeEventListener("click", copy));
  //     };
  //   }
  // }, [runCopy]);




  return (
    <div ref={containerRef} className='prose prose-strong:text-[#bc9e85] mx-auto bg-gray-800 text-white rounded-md p-2 max-w-[100ch]'
      dangerouslySetInnerHTML={{ __html: md.render(text) }} />
  )
}

export default Markdown
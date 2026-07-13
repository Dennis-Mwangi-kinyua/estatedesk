(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,128093,e=>{"use strict";var t=e.i(843476);e.s(["SensitiveDataWatermark",0,function({orgLabel:e}){let r,i,a=(r=new Date().toISOString().slice(0,16).replace("T"," "),(i=e?.trim())?`EstateDesk confidential \xb7 ${i} \xb7 ${r}`:`EstateDesk confidential \xb7 ${r}`);return(0,t.jsxs)("div",{"aria-hidden":"true",className:"ed-sensitive-watermark pointer-events-none fixed inset-0 z-[90] overflow-hidden print:hidden",children:[(0,t.jsx)("style",{children:`
        .ed-sensitive-watermark__layer {
          position: absolute;
          inset: -55%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 3.5rem 2.5rem;
          transform: rotate(-22deg);
          opacity: 0.045;
          filter: blur(1.75px);
          -webkit-filter: blur(1.75px);
          user-select: none;
        }

        @media (min-width: 640px) {
          .ed-sensitive-watermark__layer {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4rem 3rem;
            opacity: 0.04;
            filter: blur(2px);
            -webkit-filter: blur(2px);
          }
        }

        @media (min-width: 1024px) {
          .ed-sensitive-watermark__layer {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        .dark .ed-sensitive-watermark__layer {
          opacity: 0.055;
        }

        .ed-sensitive-watermark__text {
          margin: 0;
          white-space: nowrap;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgb(15 23 42);
          line-height: 1.2;
        }

        .dark .ed-sensitive-watermark__text {
          color: rgb(248 250 252);
        }

        @media (prefers-reduced-transparency: reduce) {
          .ed-sensitive-watermark__layer {
            filter: none;
            -webkit-filter: none;
            opacity: 0.03;
          }
        }
      `}),(0,t.jsx)("div",{className:"ed-sensitive-watermark__layer",children:Array.from({length:28},(e,r)=>(0,t.jsx)("p",{className:"ed-sensitive-watermark__text",children:a},r))})]})}])}]);
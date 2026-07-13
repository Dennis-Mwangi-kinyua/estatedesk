module.exports=[110894,a=>{"use strict";var b=a.i(187924);a.s(["SensitiveDataWatermark",0,function({orgLabel:a}){let c,d,e=(c=new Date().toISOString().slice(0,16).replace("T"," "),(d=a?.trim())?`EstateDesk confidential \xb7 ${d} \xb7 ${c}`:`EstateDesk confidential \xb7 ${c}`);return(0,b.jsxs)("div",{"aria-hidden":"true",className:"ed-sensitive-watermark pointer-events-none fixed inset-0 z-[90] overflow-hidden print:hidden",children:[(0,b.jsx)("style",{children:`
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
      `}),(0,b.jsx)("div",{className:"ed-sensitive-watermark__layer",children:Array.from({length:28},(a,c)=>(0,b.jsx)("p",{className:"ed-sensitive-watermark__text",children:e},c))})]})}])}];

//# sourceMappingURL=apps_web_src_components_security_sensitive-data-watermark_tsx_08n1hig._.js.map
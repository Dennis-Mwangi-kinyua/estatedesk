(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,749817,e=>{"use strict";let t=(0,e.i(456420).default)("house",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"r6nss1"}]]);e.s(["Home",0,t],749817)},195057,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={formatUrl:function(){return n},formatWithValidation:function(){return d},urlObjectKeys:function(){return o}};for(var s in a)Object.defineProperty(r,s,{enumerable:!0,get:a[s]});let i=e.r(190809)._(e.r(998183)),l=/https?|ftp|gopher|file/;function n(e){let{auth:t,hostname:r}=e,a=e.protocol||"",s=e.pathname||"",n=e.hash||"",o=e.query||"",d=!1;t=t?encodeURIComponent(t).replace(/%3A/i,":")+"@":"",e.host?d=t+e.host:r&&(d=t+(~r.indexOf(":")?`[${r}]`:r),e.port&&(d+=":"+e.port)),o&&"object"==typeof o&&(o=String(i.urlQueryToSearchParams(o)));let c=e.search||o&&`?${o}`||"";return a&&!a.endsWith(":")&&(a+=":"),e.slashes||(!a||l.test(a))&&!1!==d?(d="//"+(d||""),s&&"/"!==s[0]&&(s="/"+s)):d||(d=""),n&&"#"!==n[0]&&(n="#"+n),c&&"?"!==c[0]&&(c="?"+c),s=s.replace(/[?#]/g,encodeURIComponent),c=c.replace("#","%23"),`${a}${d}${s}${c}${n}`}let o=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"];function d(e){return n(e)}},818581,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"useMergedRef",{enumerable:!0,get:function(){return s}});let a=e.r(271645);function s(e,t){let r=(0,a.useRef)(null),s=(0,a.useRef)(null);return(0,a.useCallback)(a=>{if(null===a){let e=r.current;e&&(r.current=null,e());let t=s.current;t&&(s.current=null,t())}else e&&(r.current=i(e,a)),t&&(s.current=i(t,a))},[e,t])}function i(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let r=e(t);return"function"==typeof r?r:()=>e(null)}}("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},573668,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"isLocalURL",{enumerable:!0,get:function(){return i}});let a=e.r(718967),s=e.r(652817);function i(e){if(!(0,a.isAbsoluteUrl)(e))return!0;try{let t=(0,a.getLocationOrigin)(),r=new URL(e,t);return r.origin===t&&(0,s.hasBasePath)(r.pathname)}catch(e){return!1}}},284508,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0}),Object.defineProperty(r,"errorOnce",{enumerable:!0,get:function(){return a}});let a=e=>{}},522016,(e,t,r)=>{"use strict";Object.defineProperty(r,"__esModule",{value:!0});var a={default:function(){return g},useLinkStatus:function(){return y}};for(var s in a)Object.defineProperty(r,s,{enumerable:!0,get:a[s]});let i=e.r(190809),l=e.r(843476),n=i._(e.r(271645)),o=e.r(195057),d=e.r(8372),c=e.r(818581),u=e.r(718967),h=e.r(405550);e.r(233525);let m=e.r(388540),p=e.r(91949),f=e.r(573668),x=e.r(509396);function g(t){var r,a;let s,i,g,[y,k]=(0,n.useOptimistic)(p.IDLE_LINK_STATUS),w=(0,n.useRef)(null),{href:v,as:j,children:N,prefetch:_=null,passHref:M,replace:C,shallow:E,scroll:P,onClick:S,onMouseEnter:O,onTouchStart:T,legacyBehavior:L=!1,onNavigate:R,transitionTypes:A,ref:U,unstable_dynamicOnHover:D,...$}=t;s=N,L&&("string"==typeof s||"number"==typeof s)&&(s=(0,l.jsx)("a",{children:s}));let z=n.default.useContext(d.AppRouterContext),V=!1!==_,H=!1!==_?null===(a=_)||"auto"===a?x.FetchStrategy.PPR:x.FetchStrategy.Full:x.FetchStrategy.PPR,B="string"==typeof(r=j||v)?r:(0,o.formatUrl)(r);if(L){if(s?.$$typeof===Symbol.for("react.lazy"))throw Object.defineProperty(Error("`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag."),"__NEXT_ERROR_CODE",{value:"E863",enumerable:!1,configurable:!0});i=n.default.Children.only(s)}let F=L?i&&"object"==typeof i&&i.ref:U,K=n.default.useCallback(e=>(null!==z&&(w.current=(0,p.mountLinkInstance)(e,B,z,H,V,k)),()=>{w.current&&((0,p.unmountLinkForCurrentNavigation)(w.current),w.current=null),(0,p.unmountPrefetchableInstance)(e)}),[V,B,z,H,k]),q={ref:(0,c.useMergedRef)(K,F),onClick(t){L||"function"!=typeof S||S(t),L&&i.props&&"function"==typeof i.props.onClick&&i.props.onClick(t),!z||t.defaultPrevented||function(t,r,a,s,i,l,o){if("u">typeof window){let d,{nodeName:c}=t.currentTarget;if("A"===c.toUpperCase()&&((d=t.currentTarget.getAttribute("target"))&&"_self"!==d||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which)||t.currentTarget.hasAttribute("download"))return;if(!(0,f.isLocalURL)(r)){s&&(t.preventDefault(),location.replace(r));return}if(t.preventDefault(),l){let e=!1;if(l({preventDefault:()=>{e=!0}}),e)return}let{dispatchNavigateAction:u}=e.r(699781);n.default.startTransition(()=>{u(r,s?"replace":"push",!1===i?m.ScrollBehavior.NoScroll:m.ScrollBehavior.Default,a.current,o)})}}(t,B,w,C,P,R,A)},onMouseEnter(e){L||"function"!=typeof O||O(e),L&&i.props&&"function"==typeof i.props.onMouseEnter&&i.props.onMouseEnter(e),z&&V&&(0,p.onNavigationIntent)(e.currentTarget,!0===D)},onTouchStart:function(e){L||"function"!=typeof T||T(e),L&&i.props&&"function"==typeof i.props.onTouchStart&&i.props.onTouchStart(e),z&&V&&(0,p.onNavigationIntent)(e.currentTarget,!0===D)}};return(0,u.isAbsoluteUrl)(B)?q.href=B:L&&!M&&("a"!==i.type||"href"in i.props)||(q.href=(0,h.addBasePath)(B)),g=L?n.default.cloneElement(i,q):(0,l.jsx)("a",{...$,...q,children:s}),(0,l.jsx)(b.Provider,{value:y,children:g})}e.r(284508);let b=(0,n.createContext)(p.IDLE_LINK_STATUS),y=()=>(0,n.useContext)(b);("function"==typeof r.default||"object"==typeof r.default&&null!==r.default)&&void 0===r.default.__esModule&&(Object.defineProperty(r.default,"__esModule",{value:!0}),Object.assign(r.default,r),t.exports=r.default)},856423,e=>{"use strict";let t=(0,e.i(456420).default)("book-open",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);e.s(["BookOpen",0,t],856423)},146387,e=>{"use strict";let t=(0,e.i(456420).default)("building-2",[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]]);e.s(["Building2",0,t],146387)},593583,e=>{"use strict";let t=(0,e.i(456420).default)("menu",[["path",{d:"M4 5h16",key:"1tepv9"}],["path",{d:"M4 12h16",key:"1lakjw"}],["path",{d:"M4 19h16",key:"1djgab"}]]);e.s(["Menu",0,t],593583)},768877,e=>{"use strict";let t=(0,e.i(456420).default)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);e.s(["ArrowRight",0,t],768877)},357443,e=>{"use strict";let t=(0,e.i(456420).default)("user-plus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);e.s(["UserPlus",0,t],357443)},566595,e=>{"use strict";let t=(0,e.i(456420).default)("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);e.s(["Search",0,t],566595)},96315,e=>{"use strict";let t=(0,e.i(456420).default)("mail",[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]]);e.s(["Mail",0,t],96315)},598328,e=>{"use strict";var t=e.i(843476),r=e.i(522016),a=e.i(271645),s=e.i(768877),i=e.i(856423),l=e.i(146387),n=e.i(749817),o=e.i(456420);let d=(0,o.default)("log-in",[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]]);var c=e.i(96315),u=e.i(593583);let h=(0,o.default)("message-circle-question-mark",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);var m=e.i(566595),p=e.i(357443);let f=(0,o.default)("wallet-cards",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2",key:"4125el"}],["path",{d:"M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21",key:"1dpki6"}]]);var x=e.i(263676),g=e.i(414498);let b=[{href:"/vacancies",label:"Vacancies",key:"vacancies",icon:n.Home},{href:"/services",label:"Services",key:"services",icon:m.Search},{href:"/pricing",label:"Pricing",key:"pricing",icon:f},{href:"/guides",label:"Guides",key:"guides",icon:i.BookOpen},{href:"/faq",label:"FAQ",key:"faq",icon:h},{href:"/contact",label:"Contact",key:"contact",icon:c.Mail}];e.s(["PublicAccessHeader",0,function({active:e="home",loginHref:i="/login",showPricing:n=!0}){let[o,c]=(0,a.useState)(!1),h=(0,a.useRef)(null),m=n?b:b.filter(e=>"pricing"!==e.key),f="items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:!border-white/20 dark:!bg-white/[0.10] dark:!text-[#f8fafc] dark:hover:!bg-white/[0.16] dark:focus-visible:ring-white";return(0,a.useEffect)(()=>{if(o)return document.documentElement.classList.add("public-mobile-menu-open"),document.addEventListener("keydown",e),()=>{document.documentElement.classList.remove("public-mobile-menu-open"),document.removeEventListener("keydown",e)};function e(e){"Escape"===e.key&&c(!1)}},[o]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("header",{className:"fixed inset-x-0 top-0 z-[100] shrink-0 border-b border-slate-200/80 bg-white/95 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d1117]/95 dark:shadow-[0_14px_34px_rgba(0,0,0,0.22)]",children:(0,t.jsxs)("div",{className:"mx-auto flex h-16 max-w-[1536px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8",children:[(0,t.jsxs)("div",{className:"flex w-full items-center justify-between gap-2 lg:contents",children:[(0,t.jsxs)(r.default,{href:"/","aria-label":"Go to EstateDesk home",className:"inline-flex min-h-10 min-w-0 items-center gap-2.5 rounded-lg pr-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:text-[#f8fafc] dark:hover:text-[#e5e7eb] dark:focus-visible:ring-white",children:[(0,t.jsx)("span",{className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10",children:(0,t.jsx)(l.Building2,{className:"h-5 w-5 text-emerald-700 dark:text-emerald-300"})}),(0,t.jsx)("span",{className:"truncate",children:"EstateDesk"})]}),(0,t.jsxs)("div",{ref:h,className:"relative lg:hidden",children:[(0,t.jsxs)("button",{type:"button","aria-expanded":o,"aria-controls":"public-access-mobile-menu","aria-label":o?"Close menu":"Open menu",onClick:()=>c(e=>!e),className:"inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-white/18 dark:bg-white/[0.10] dark:text-white dark:hover:border-white/28 dark:hover:bg-white/[0.16] dark:focus-visible:ring-white",children:[(0,t.jsx)(u.Menu,{className:`h-5 w-5 ${o?"hidden":"block"}`}),(0,t.jsx)(x.X,{className:`h-5 w-5 ${o?"block":"hidden"}`})]}),o?(0,t.jsx)("div",{className:"fixed inset-x-0 bottom-0 top-16 z-[105] bg-white/68 backdrop-blur-2xl dark:bg-[#05080d]/82"}):null,(0,t.jsxs)("div",{id:"public-access-mobile-menu",hidden:!o,className:"fixed right-3 top-20 z-[110] w-[min(21rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.22)] dark:border-white/20 dark:bg-[#111821] dark:shadow-[0_24px_70px_rgba(0,0,0,0.52)]",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/16 dark:bg-[#18202a]",children:[(0,t.jsxs)("div",{className:"min-w-0",children:[(0,t.jsx)("p",{className:"text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300",children:"Menu"}),(0,t.jsx)("p",{className:"mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-slate-50",children:"EstateDesk public pages"})]}),(0,t.jsx)(g.HeaderThemeToggle,{className:"h-9 w-9 rounded-lg"})]}),(0,t.jsxs)("nav",{className:"mt-3 grid gap-1.5",children:[(0,t.jsx)("p",{className:"px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300",children:"Explore"}),m.map(a=>{let i=a.icon,l=e===a.key;return(0,t.jsxs)(r.default,{href:a.href,onClick:()=>c(!1),className:`inline-flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 text-sm font-semibold transition ${l?"border-slate-300 bg-slate-950 text-white dark:border-emerald-300/45 dark:bg-emerald-400/18 dark:text-emerald-50":"border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-slate-50 dark:border-white/18 dark:bg-[#18202a] dark:text-slate-50 dark:hover:border-white/30 dark:hover:bg-[#202a36]"}`,children:[(0,t.jsxs)("span",{className:"inline-flex min-w-0 items-center gap-3",children:[(0,t.jsx)(i,{className:"h-4 w-4 shrink-0 text-current"}),(0,t.jsx)("span",{className:"truncate text-current",children:a.label})]}),(0,t.jsx)(s.ArrowRight,{className:"h-3.5 w-3.5 shrink-0 text-current opacity-60"})]},a.href)})]}),(0,t.jsxs)("div",{className:"mt-3 grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10",children:[(0,t.jsx)("p",{className:"px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300",children:"Account"}),(0,t.jsxs)(r.default,{href:i,onClick:()=>c(!1),className:`inline-flex min-h-11 text-sm ${f}`,children:[(0,t.jsx)(d,{className:"h-4 w-4 shrink-0"}),(0,t.jsx)("span",{className:"truncate",children:"Sign in"})]}),(0,t.jsxs)(r.default,{href:"/register",onClick:()=>c(!1),className:"inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-emerald-400 dark:text-[#07130f] dark:hover:bg-emerald-300 [&_*]:text-current",children:[(0,t.jsx)(p.UserPlus,{className:"h-4 w-4 shrink-0"}),(0,t.jsx)("span",{className:"truncate",children:"Create account"})]})]})]})]})]}),(0,t.jsxs)("nav",{className:"hidden lg:flex lg:w-auto lg:flex-1 lg:items-center lg:justify-end lg:gap-2",children:[(0,t.jsx)("div",{className:"flex items-center gap-2",children:m.map(a=>{let s=a.icon,i=e===a.key;return(0,t.jsxs)(r.default,{href:a.href,className:`public-access-nav-link inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition xl:px-3.5 ${i?"public-access-nav-link-active border-slate-300 bg-white text-slate-950 shadow-sm dark:border-white/20 dark:bg-white dark:text-[#0b0f16]":"border-transparent bg-transparent text-slate-950 hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.14] dark:hover:text-white"}`,children:[(0,t.jsx)(s,{className:"h-4 w-4 shrink-0 text-current"}),(0,t.jsx)("span",{className:"max-w-full truncate text-current",children:a.label})]},a.href)})}),(0,t.jsx)("span",{className:"mx-1 hidden h-6 w-px bg-slate-200 dark:bg-white/10 md:inline-block"}),(0,t.jsxs)("div",{className:"flex items-center gap-2",children:[(0,t.jsx)(g.HeaderThemeToggle,{}),(0,t.jsxs)(r.default,{href:i,className:`inline-flex min-h-10 min-w-0 text-sm ${f}`,children:[(0,t.jsx)(d,{className:"h-4 w-4 shrink-0"}),(0,t.jsx)("span",{className:"truncate",children:"Sign in"})]}),(0,t.jsxs)(r.default,{href:"/register",className:"inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:focus-visible:ring-white [&_*]:text-current",children:[(0,t.jsx)(p.UserPlus,{className:"h-4 w-4 shrink-0"}),(0,t.jsx)("span",{className:"truncate",children:"Create account"})]})]})]})]})}),(0,t.jsx)("div",{"aria-hidden":"true",className:"h-16 md:h-[4.1rem]"})]})}],598328)},584026,e=>{"use strict";let t=(0,e.i(456420).default)("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);e.s(["ShieldCheck",0,t],584026)},772382,580860,e=>{"use strict";var t=e.i(456420);let r=(0,t.default)("eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);e.s(["Eye",0,r],772382);let a=(0,t.default)("eye-off",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);e.s(["EyeOff",0,a],580860)},972764,e=>{"use strict";let t=(0,e.i(456420).default)("lock-keyhole",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);e.s(["LockKeyhole",0,t],972764)},833373,e=>{"use strict";var t=e.i(843476),r=e.i(522016),a=e.i(271645),s=e.i(174080),i=e.i(768877),l=e.i(772382),n=e.i(580860),o=e.i(972764),d=e.i(96315),c=e.i(584026);let u={success:!1},h=(0,a.memo)(function({children:e}){return(0,t.jsx)("div",{className:"group flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 transition duration-150 focus-within:border-slate-950 focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.10)] sm:min-h-12 sm:px-3.5",children:e})});e.s(["default",0,function({returnTo:e,loginAction:m}){let[p,f,x]=(0,a.useActionState)(m,u),[g,b]=(0,a.useState)(!1),y=p?.error??null,k=(0,a.useCallback)(()=>{b(e=>!e)},[]);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{children:`
        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-loading-ring {
          animation: loginSpin 0.85s linear infinite;
        }

        .login-loading-dot {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 9999px;
          animation-duration: 1.15s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .login-loading-dot--teal {
          background: #14b8a6;
          animation-name: loadingDotGlowTeal;
        }

        .login-loading-dot--violet {
          background: #8b5cf6;
          animation-name: loadingDotGlowViolet;
          animation-delay: 0.18s;
        }

        .login-loading-dot--amber {
          background: #f59e0b;
          animation-name: loadingDotGlowAmber;
          animation-delay: 0.36s;
        }

        @keyframes loadingDotGlowTeal {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 0.15rem rgba(20, 184, 166, 0.2);
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow:
              0 0 0.45rem rgba(20, 184, 166, 0.95),
              0 0 1rem rgba(45, 212, 191, 0.65),
              0 0 1.6rem rgba(20, 184, 166, 0.35);
          }
        }

        @keyframes loadingDotGlowViolet {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 0.15rem rgba(139, 92, 246, 0.2);
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow:
              0 0 0.45rem rgba(139, 92, 246, 0.95),
              0 0 1rem rgba(167, 139, 250, 0.65),
              0 0 1.6rem rgba(139, 92, 246, 0.35);
          }
        }

        @keyframes loadingDotGlowAmber {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 0.15rem rgba(245, 158, 11, 0.2);
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow:
              0 0 0.45rem rgba(245, 158, 11, 0.95),
              0 0 1rem rgba(251, 191, 36, 0.65),
              0 0 1.6rem rgba(245, 158, 11, 0.35);
          }
        }

        .login-auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          min-height: 100vh;
          min-height: 100dvh;
          place-items: center;
          background:
            radial-gradient(circle at center, rgba(255, 255, 255, 0.18), transparent 34%),
            rgba(15, 23, 42, 0.38);
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
          backdrop-filter: blur(14px) saturate(1.08);
        }

        @media (max-height: 740px) {
          .login-form-compact {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .login-form-stack {
            gap: 12px;
          }

          .login-field-stack {
            gap: 6px;
          }

          .login-form-label {
            font-size: 13px;
          }

          .login-form-meta {
            margin-top: 12px;
            padding-top: 12px;
          }
        }

        @media (max-height: 660px) {
          .login-form-compact {
            padding-top: 10px;
            padding-bottom: 10px;
          }

          .login-form-stack {
            gap: 10px;
          }

          .login-form-meta {
            display: none;
          }
        }

        @media (max-height: 590px) {
          .login-form-label {
            display: none;
          }

          .login-form-stack {
            gap: 8px;
          }
        }
      `}),x&&"u">typeof document?(0,s.createPortal)((0,t.jsx)("div",{className:"login-auth-overlay px-5",children:(0,t.jsxs)("div",{className:"w-full max-w-[300px] rounded-2xl border border-white/80 bg-white/92 px-6 py-7 text-center shadow-[0_28px_90px_rgba(15,23,42,0.28)] ring-1 ring-slate-950/5 backdrop-blur-xl",children:[(0,t.jsx)("div",{className:"mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_16px_36px_rgba(15,23,42,0.22)]",children:(0,t.jsx)("div",{className:"login-loading-ring h-9 w-9 rounded-full border-[3px] border-white/30 border-t-white"})}),(0,t.jsx)("h3",{className:"mt-5 text-lg font-semibold tracking-tight text-slate-950",children:"Verifying details"}),(0,t.jsx)("p",{className:"mt-1.5 text-sm leading-5 text-slate-600",children:"Please wait while we securely log you in."}),(0,t.jsxs)("div",{className:"mt-5 flex items-center justify-center gap-2.5","aria-hidden":"true",children:[(0,t.jsx)("span",{className:"login-loading-dot login-loading-dot--teal"}),(0,t.jsx)("span",{className:"login-loading-dot login-loading-dot--violet"}),(0,t.jsx)("span",{className:"login-loading-dot login-loading-dot--amber"})]})]})}),document.body):null,(0,t.jsxs)("div",{className:"px-5 py-6 sm:px-7",children:[(0,t.jsxs)("form",{action:f,className:"flex flex-col gap-4",children:[e?(0,t.jsx)("input",{type:"hidden",name:"returnTo",value:e}):null,(0,t.jsxs)("div",{className:"flex flex-col gap-2",children:[(0,t.jsx)("label",{htmlFor:"email",className:"text-sm font-medium text-slate-800",children:"Email or username"}),(0,t.jsxs)(h,{children:[(0,t.jsx)(d.Mail,{className:"h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-slate-950"}),(0,t.jsx)("input",{id:"email",name:"email",type:"text",autoComplete:"username",placeholder:"you@company.com or landlord01",disabled:x,"aria-invalid":!!p.fieldErrors?.email?.length,className:"h-full w-full bg-transparent text-[16px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[15px]"})]}),p.fieldErrors?.email?.length?(0,t.jsx)("p",{className:"text-xs font-medium text-red-600 sm:text-sm",children:p.fieldErrors.email[0]}):null]}),(0,t.jsxs)("div",{className:"flex flex-col gap-2",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[(0,t.jsx)("label",{htmlFor:"password",className:"text-sm font-medium text-slate-800",children:"Password"}),(0,t.jsx)(r.default,{href:"/forgot-password",className:"text-xs font-semibold text-slate-950 underline-offset-4 transition hover:underline sm:text-sm",children:"Forgot password?"})]}),(0,t.jsxs)(h,{children:[(0,t.jsx)(o.LockKeyhole,{className:"h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-slate-950"}),(0,t.jsx)("input",{id:"password",name:"password",type:g?"text":"password",autoComplete:"current-password",placeholder:"Enter your password",disabled:x,"aria-invalid":!!p.fieldErrors?.password?.length,className:"h-full w-full bg-transparent text-[16px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[15px]"}),(0,t.jsxs)("button",{type:"button",onClick:k,disabled:x,className:"inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 transition active:scale-95 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50","aria-label":g?"Hide password":"View password","aria-pressed":g,children:[g?(0,t.jsx)(n.EyeOff,{className:"h-4 w-4 shrink-0","aria-hidden":"true"}):(0,t.jsx)(l.Eye,{className:"h-4 w-4 shrink-0","aria-hidden":"true"}),(0,t.jsx)("span",{className:"hidden min-[380px]:inline",children:g?"Hide password":"View password"}),(0,t.jsx)("span",{className:"min-[380px]:hidden",children:g?"Hide":"View"})]})]}),p.fieldErrors?.password?.length?(0,t.jsx)("p",{className:"text-xs font-medium text-red-600 sm:text-sm",children:p.fieldErrors.password[0]}):null]}),y?(0,t.jsx)("div",{role:"alert","aria-live":"assertive",className:"rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-700 sm:px-4 sm:py-3 sm:text-sm",children:y}):null,(0,t.jsxs)("button",{type:"submit",disabled:x,className:"inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition duration-150 active:scale-[0.99] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-12",children:[(0,t.jsx)("span",{children:x?"Verifying...":"Log in"}),x?null:(0,t.jsx)(i.ArrowRight,{className:"h-4 w-4"})]})]}),(0,t.jsx)("div",{className:"mt-5 border-t border-slate-200 pt-5",children:(0,t.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[(0,t.jsxs)("p",{className:"text-sm text-slate-600",children:["Need an account?",(0,t.jsx)(r.default,{href:"/register",className:"ml-1.5 font-semibold text-slate-950 underline-offset-4 transition hover:underline",children:"Create one"})]}),(0,t.jsxs)("div",{className:"hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex",children:[(0,t.jsx)(c.ShieldCheck,{className:"h-4 w-4 text-slate-700"}),"Protected"]})]})})]})]})}])}]);